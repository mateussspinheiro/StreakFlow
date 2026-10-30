// Lambda do assistente do StreakFlow (API Gateway WebSocket).
// Rotas atendidas: $connect, $disconnect e $default.
//  - $connect: valida o access token do Cognito recebido em ?token=... e
//    recusa a conexão (401) quando ele é inválido ou expirou.
//  - $default: recebe { type: 'ask', id, question }, consulta o Google Gemini e
//    devolve a resposta pela API de gerenciamento de conexões do API Gateway.
// Sem dependências externas: usa fetch e crypto do Node.js 20+ e o AWS SDK v3
// que já vem no runtime Node.js da Lambda.
import { createPublicKey, verify } from 'node:crypto'

export const MAX_QUESTION_LENGTH = 1000
const DEFAULT_MODEL = 'gemini-3.8-flash'
const SYSTEM_PROMPT = 'Você é o assistente do StreakFlow, um aplicativo de acompanhamento de hábitos. ' +
  'Responda em português do Brasil, de forma clara, gentil e objetiva (no máximo alguns parágrafos curtos). ' +
  'Você pode ajudar com dúvidas gerais sobre criação de hábitos, constância, metas e organização da rotina. ' +
  'Você não tem acesso aos hábitos ou registros do usuário. Não dê diagnósticos médicos.'

const decode = part => JSON.parse(Buffer.from(part, 'base64url').toString('utf8'))
const log = (message, data = {}) => console.log(JSON.stringify({ message, ...data }))

export class TokenError extends Error {
  constructor(reason) { super(reason); this.name = 'TokenError' }
}

export function createTokenVerifier({ userPoolId, clientId, fetchImpl = fetch, now = () => Date.now() }) {
  if (!userPoolId || !clientId) throw new Error('COGNITO_USER_POOL_ID e COGNITO_CLIENT_ID são obrigatórios.')
  const region = userPoolId.split('_')[0]
  const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`
  let keys = null
  async function loadKeys() {
    const response = await fetchImpl(`${issuer}/.well-known/jwks.json`)
    if (!response.ok) throw new Error(`JWKS indisponível (${response.status})`)
    keys = (await response.json()).keys ?? []
  }
  return async function verifyAccessToken(token) {
    if (typeof token !== 'string' || token.split('.').length !== 3) throw new TokenError('formato inválido')
    const [rawHeader, rawPayload, signature] = token.split('.')
    let header, payload
    try { header = decode(rawHeader); payload = decode(rawPayload) } catch { throw new TokenError('formato inválido') }
    if (header.alg !== 'RS256') throw new TokenError('algoritmo não suportado')
    if (!keys) await loadKeys()
    let jwk = keys.find(key => key.kid === header.kid)
    if (!jwk) { await loadKeys(); jwk = keys.find(key => key.kid === header.kid) } // rotação de chaves
    if (!jwk) throw new TokenError('chave desconhecida')
    const valid = verify('RSA-SHA256', Buffer.from(`${rawHeader}.${rawPayload}`), createPublicKey({ key: jwk, format: 'jwk' }), Buffer.from(signature, 'base64url'))
    if (!valid) throw new TokenError('assinatura inválida')
    if (payload.iss !== issuer) throw new TokenError('emissor inválido')
    if (payload.token_use !== 'access') throw new TokenError('não é access token')
    if (payload.client_id !== clientId) throw new TokenError('app client inválido')
    if (typeof payload.exp !== 'number' || payload.exp * 1000 <= now()) throw new TokenError('token expirado')
    return payload
  }
}

// thinkingLevel 'low' reduz o tempo de resposta dos modelos Gemini 3.x; se o
// modelo não aceitar o parâmetro (400), repete a chamada sem ele.
export function createGeminiClient({ apiKey, model = DEFAULT_MODEL, thinkingLevel = 'low', timeoutMs = 50_000, fetchImpl = fetch }) {
  const call = (question, withThinking) => fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: question }] }],
      generationConfig: { maxOutputTokens: 4096, temperature: 0.7, ...(withThinking ? { thinkingConfig: { thinkingLevel } } : {}) },
    }),
    signal: AbortSignal.timeout(timeoutMs),
  })
  return async function askGemini(question) {
    if (!apiKey) throw new Error('GEMINI_API_KEY não configurada.')
    const useThinking = !!thinkingLevel && thinkingLevel !== 'none'
    let response = await call(question, useThinking)
    if (response.status === 400 && useThinking) response = await call(question, false)
    if (!response.ok) throw new Error(`Gemini respondeu ${response.status}`)
    const data = await response.json()
    const answer = (data.candidates?.[0]?.content?.parts ?? []).map(part => part.text).filter(Boolean).join('').trim()
    if (!answer) throw new Error('Gemini não retornou texto.')
    return answer
  }
}

const clients = new Map()
async function postWithSdk(endpoint, connectionId, payload) {
  const { ApiGatewayManagementApiClient, PostToConnectionCommand } = await import('@aws-sdk/client-apigatewaymanagementapi')
  if (!clients.has(endpoint)) clients.set(endpoint, new ApiGatewayManagementApiClient({ endpoint }))
  await clients.get(endpoint).send(new PostToConnectionCommand({ ConnectionId: connectionId, Data: Buffer.from(JSON.stringify(payload)) }))
}

export function parseQuestion(body) {
  let input
  try { input = JSON.parse(body ?? '') } catch { return { id: null, error: 'Mensagem em formato inválido.' } }
  const id = typeof input?.id === 'string' && /^[\w-]{1,64}$/.test(input.id) ? input.id : null
  const question = typeof input?.question === 'string' ? input.question.trim() : ''
  if (input?.type !== 'ask' || !id) return { id, error: 'Mensagem em formato inválido.' }
  if (!question) return { id, error: 'Digite uma pergunta.' }
  if (question.length > MAX_QUESTION_LENGTH) return { id, error: `A pergunta deve ter até ${MAX_QUESTION_LENGTH} caracteres.` }
  return { id, question }
}

export function createHandler({ env = process.env, verifyAccessToken, askGemini, postToConnection = postWithSdk } = {}) {
  verifyAccessToken ??= createTokenVerifier({ userPoolId: env.COGNITO_USER_POOL_ID, clientId: env.COGNITO_CLIENT_ID })
  askGemini ??= createGeminiClient({ apiKey: env.GEMINI_API_KEY, model: env.GEMINI_MODEL || DEFAULT_MODEL, thinkingLevel: env.GEMINI_THINKING_LEVEL ?? 'low' })
  const model = env.GEMINI_MODEL || DEFAULT_MODEL

  return async function handler(event) {
    const { routeKey, connectionId, apiId, stage } = event.requestContext ?? {}

    if (routeKey === '$connect') {
      try {
        const claims = await verifyAccessToken(event.queryStringParameters?.token)
        log('Conexão WebSocket autorizada', { connectionId, sub: claims.sub })
        return { statusCode: 200 }
      } catch (error) {
        log('Conexão WebSocket recusada', { connectionId, reason: error instanceof TokenError ? error.message : 'falha na validação' })
        return { statusCode: 401, body: 'Unauthorized' }
      }
    }
    if (routeKey === '$disconnect') {
      log('Conexão WebSocket encerrada', { connectionId })
      return { statusCode: 200 }
    }

    // $default: usa o endpoint execute-api (funciona também com domínio personalizado).
    const endpoint = `https://${apiId}.execute-api.${env.AWS_REGION}.amazonaws.com/${stage}`
    const send = async payload => {
      try { await postToConnection(endpoint, connectionId, payload) }
      catch (error) { log('Falha ao enviar para a conexão', { connectionId, error: error?.name ?? String(error) }) }
    }
    const { id, question, error } = parseQuestion(event.body)
    if (error) { await send({ type: 'error', id, message: error }); return { statusCode: 200 } }

    log('Pergunta recebida pela Lambda', { connectionId, id, length: question.length })
    await send({ type: 'processing', id })
    try {
      const started = Date.now()
      const answer = await askGemini(question)
      log('Resposta do Gemini enviada', { connectionId, id, model, ms: Date.now() - started, length: answer.length })
      await send({ type: 'answer', id, answer, model })
    } catch (cause) {
      log('Erro ao consultar o Gemini', { connectionId, id, error: cause?.message ?? String(cause) })
      await send({ type: 'error', id, message: 'Não foi possível obter uma resposta do assistente agora. Tente novamente.' })
    }
    return { statusCode: 200 }
  }
}

let cached
export const handler = event => (cached ??= createHandler())(event)