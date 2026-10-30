import { test } from 'node:test'
import assert from 'node:assert/strict'
import { generateKeyPairSync, sign } from 'node:crypto'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import { createHandler, createTokenVerifier, createGeminiClient, parseQuestion, MAX_QUESTION_LENGTH } from '../aws/lambda/streakflow-chat/index.mjs'

const source = readFileSync(new URL('../src/lib/chat.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
const chat = { exports: {} }
vm.runInNewContext(compiled, { exports: chat.exports, URL })
const client = chat.exports

const poolId = 'us-east-1_TESTPOOL'
const clientId = 'client-123'
const issuer = `https://cognito-idp.us-east-1.amazonaws.com/${poolId}`
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
const jwks = { keys: [{ ...publicKey.export({ format: 'jwk' }), kid: 'kid-1', alg: 'RS256', use: 'sig' }] }
const now = Date.UTC(2026, 9, 30, 12)
const b64 = value => Buffer.from(JSON.stringify(value)).toString('base64url')
function jwt(claims = {}, header = {}) {
  const head = b64({ alg: 'RS256', kid: 'kid-1', ...header })
  const body = b64({ iss: issuer, token_use: 'access', client_id: clientId, sub: 'user-sub', exp: now / 1000 + 600, ...claims })
  return `${head}.${body}.${sign('RSA-SHA256', Buffer.from(`${head}.${body}`), privateKey).toString('base64url')}`
}
const jwksFetch = async url => { assert.equal(url, `${issuer}/.well-known/jwks.json`); return { ok: true, json: async () => jwks } }
const verifier = () => createTokenVerifier({ userPoolId: poolId, clientId, fetchImpl: jwksFetch, now: () => now })

test('Lambda aceita apenas access tokens válidos do User Pool e App Client configurados', async () => {
  const verify = verifier()
  assert.equal((await verify(jwt())).sub, 'user-sub')
  for (const [token, reason] of [
    [jwt({ token_use: 'id' }), 'não é access token'],
    [jwt({ client_id: 'outro' }), 'app client inválido'],
    [jwt({ iss: 'https://cognito-idp.us-east-1.amazonaws.com/outro' }), 'emissor inválido'],
    [jwt({ exp: now / 1000 - 1 }), 'token expirado'],
    [jwt({}, { alg: 'none' }), 'algoritmo não suportado'],
    [jwt({}, { kid: 'desconhecida' }), 'chave desconhecida'],
    [`${jwt().split('.').slice(0, 2).join('.')}.${Buffer.from('falsa').toString('base64url')}`, 'assinatura inválida'],
    ['abc', 'formato inválido'],
    [undefined, 'formato inválido'],
  ]) await assert.rejects(verify(token), { name: 'TokenError', message: reason })
  const forged = jwt().split('.'); forged[1] = b64({ iss: issuer, token_use: 'access', client_id: clientId, sub: 'outra-pessoa', exp: now / 1000 + 600 })
  await assert.rejects(verify(forged.join('.')), { message: 'assinatura inválida' })
})

function lambda(overrides = {}) {
  const sent = []
  const handler = createHandler({
    env: { AWS_REGION: 'us-east-1', GEMINI_MODEL: 'gemini-teste' },
    verifyAccessToken: verifier(),
    askGemini: async question => `Resposta para: ${question}`,
    postToConnection: async (endpoint, connectionId, payload) => { sent.push({ endpoint, connectionId, payload }) },
    ...overrides,
  })
  const event = (routeKey, extra = {}) => ({ requestContext: { routeKey, connectionId: 'conn-1', apiId: 'abc123', stage: 'production', domainName: 'api.exemplo.web.ufersa.dev.br' }, ...extra })
  return { handler, sent, event }
}

test('$connect recusa conexão sem token válido e aceita usuário autenticado', async () => {
  const { handler, event } = lambda()
  assert.equal((await handler(event('$connect', { queryStringParameters: { token: jwt() } }))).statusCode, 200)
  assert.equal((await handler(event('$connect', { queryStringParameters: { token: jwt({ exp: 1 }) } }))).statusCode, 401)
  assert.equal((await handler(event('$connect'))).statusCode, 401)
  assert.equal((await handler(event('$disconnect'))).statusCode, 200)
})

test('$default consulta o Gemini e responde pela API de gerenciamento da conexão', async () => {
  const { handler, sent, event } = lambda()
  const result = await handler(event('$default', { body: JSON.stringify({ type: 'ask', id: 'q-1', question: '  Como manter constância?  ' }) }))
  assert.equal(result.statusCode, 200)
  assert.deepEqual(sent.map(item => item.payload), [
    { type: 'processing', id: 'q-1' },
    { type: 'answer', id: 'q-1', answer: 'Resposta para: Como manter constância?', model: 'gemini-teste' },
  ])
  // Usa o endpoint execute-api mesmo quando o acesso chega pelo domínio personalizado.
  assert.ok(sent.every(item => item.endpoint === 'https://abc123.execute-api.us-east-1.amazonaws.com/production' && item.connectionId === 'conn-1'))
})

test('$default devolve erro amigável sem expor detalhes do Gemini e valida a entrada', async () => {
  const failing = lambda({ askGemini: async () => { throw new Error('403 chave inválida') } })
  await failing.handler(failing.event('$default', { body: JSON.stringify({ type: 'ask', id: 'q-2', question: 'Oi' }) }))
  assert.equal(failing.sent.at(-1).payload.type, 'error')
  assert.doesNotMatch(failing.sent.at(-1).payload.message, /chave|403/)

  const { handler, sent, event } = lambda({ askGemini: async () => assert.fail('não deveria consultar o Gemini') })
  for (const body of ['nada', JSON.stringify({ type: 'ask', id: 'q-3', question: '   ' }), JSON.stringify({ type: 'ask', id: 'q-4', question: 'x'.repeat(MAX_QUESTION_LENGTH + 1) }), JSON.stringify({ type: 'ask', id: '<script>', question: 'oi' })]) {
    await handler(event('$default', { body }))
  }
  assert.deepEqual(sent.map(item => item.payload.type), ['error', 'error', 'error', 'error'])
  assert.deepEqual(sent.map(item => item.payload.id), [null, 'q-3', 'q-4', null])
  assert.deepEqual(parseQuestion(JSON.stringify({ type: 'ask', id: 'a', question: 'ok' })), { id: 'a', question: 'ok' })
})

test('Cliente Gemini usa a chave no cabeçalho, nunca na URL, e extrai o texto da resposta', async () => {
  let request
  const ask = createGeminiClient({ apiKey: 'segredo', model: 'gemini-teste', fetchImpl: async (url, init) => {
    request = { url, init }
    return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: 'Olá' }, { text: ', tudo bem?' }] } }] }) }
  } })
  assert.equal(await ask('Oi'), 'Olá, tudo bem?')
  assert.equal(request.url, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-teste:generateContent')
  assert.doesNotMatch(request.url, /segredo/)
  assert.equal(request.init.headers['x-goog-api-key'], 'segredo')
  assert.equal(JSON.parse(request.init.body).contents[0].parts[0].text, 'Oi')
  assert.equal(JSON.parse(request.init.body).generationConfig.thinkingConfig.thinkingLevel, 'low')
  const bodies = []
  const retry = createGeminiClient({ apiKey: 'k', fetchImpl: async (_, init) => {
    bodies.push(JSON.parse(init.body))
    return bodies.length === 1 ? { ok: false, status: 400 } : { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: 'ok' }] } }] }) }
  } })
  assert.equal(await retry('Oi'), 'ok')
  assert.ok(bodies[0].generationConfig.thinkingConfig && !bodies[1].generationConfig.thinkingConfig)
  await assert.rejects(createGeminiClient({ apiKey: '' })('Oi'), /GEMINI_API_KEY/)
  await assert.rejects(createGeminiClient({ apiKey: 'k', fetchImpl: async () => ({ ok: false, status: 429 }) })('Oi'), /429/)
})

test('Frontend monta URL wss autenticada e interpreta eventos do servidor', () => {
  const url = new URL(client.chatSocketUrl('wss://api.mateus-pinheiro.feliz.web.ufersa.dev.br', 'a.b.c'))
  assert.equal(url.host, 'api.mateus-pinheiro.feliz.web.ufersa.dev.br')
  assert.equal(url.searchParams.get('token'), 'a.b.c')
  assert.equal(new URL(client.chatSocketUrl('wss://api.exemplo.dev/production?x=1', 't')).searchParams.get('x'), '1')
  assert.throws(() => client.chatSocketUrl('ws://api.exemplo.dev', 't'), /wss/)
  assert.ok(client.chatSocketUrl('ws://localhost:3001', 't').startsWith('ws://localhost:3001'))

  assert.equal(client.parseChatEvent('não é json'), null)
  assert.equal(client.parseChatEvent(JSON.stringify({ type: 'answer', id: 'x' })), null)
  let messages = [{ id: 'q1', role: 'user', text: 'Oi', state: 'sent' }, { id: 'q2', role: 'user', text: 'Tudo?', state: 'sent' }]
  messages = client.applyChatEvent(messages, client.parseChatEvent(JSON.stringify({ type: 'processing', id: 'q1' })))
  assert.equal(messages[0].state, 'processing')
  messages = client.applyChatEvent(messages, client.parseChatEvent(JSON.stringify({ type: 'answer', id: 'q1', answer: 'Olá!', model: 'gemini' })))
  assert.equal(messages[0].state, 'answered')
  assert.deepEqual({ ...messages.at(-1) }, { id: 'q1:answer', role: 'assistant', text: 'Olá!', model: 'gemini' })
  messages = client.failPending(messages)
  assert.deepEqual([...messages.filter(message => message.role === 'user').map(message => message.state)], ['answered', 'failed'])
  messages = client.applyChatEvent(messages, client.parseChatEvent(JSON.stringify({ type: 'error', id: null, message: 'Falhou' })))
  assert.equal(messages.at(-1).role, 'error')

  assert.deepEqual({ ...client.validateQuestion('  oi  ') }, { question: 'oi' })
  assert.ok(client.validateQuestion('   ').error)
  assert.ok(client.validateQuestion('x'.repeat(client.MAX_QUESTION_LENGTH + 1)).error)
})
