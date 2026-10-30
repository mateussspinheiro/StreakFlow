// Protocolo do chat via API Gateway WebSocket (rota $default).
// Cliente → servidor: { type: 'ask', id, question }
// Servidor → cliente: { type: 'processing' | 'answer' | 'error', id, answer?, message?, model? }
export const MAX_QUESTION_LENGTH = 1000

export type ChatStatus = 'unconfigured' | 'connecting' | 'open' | 'closed' | 'error'
export type QuestionState = 'sent' | 'processing' | 'answered' | 'failed'
export type ChatMessage =
  | { id: string; role: 'user'; text: string; state: QuestionState }
  | { id: string; role: 'assistant'; text: string; model?: string }
  | { id: string; role: 'error'; text: string }
export type ChatEvent =
  | { type: 'processing'; id: string }
  | { type: 'answer'; id: string; answer: string; model?: string }
  | { type: 'error'; id: string | null; message: string }

export function chatSocketUrl(base: string, token: string) {
  const url = new URL(base.trim())
  const local = ['localhost', '127.0.0.1'].includes(url.hostname)
  if (url.protocol !== 'wss:' && !(local && url.protocol === 'ws:')) throw new Error('O endereço do chat deve usar wss://.')
  url.searchParams.set('token', token)
  return url.toString()
}

export function parseChatEvent(raw: unknown): ChatEvent | null {
  if (typeof raw !== 'string') return null
  let data: Record<string, unknown>
  try { data = JSON.parse(raw) } catch { return null }
  if (!data || typeof data !== 'object') return null
  const id = typeof data.id === 'string' ? data.id : null
  if (data.type === 'processing' && id) return { type: 'processing', id }
  if (data.type === 'answer' && id && typeof data.answer === 'string') return { type: 'answer', id, answer: data.answer, model: typeof data.model === 'string' ? data.model : undefined }
  if (data.type === 'error') return { type: 'error', id, message: typeof data.message === 'string' ? data.message : 'Erro no assistente.' }
  return null
}

const setState = (messages: ChatMessage[], id: string | null, state: QuestionState) =>
  messages.map(message => message.role === 'user' && message.id === id && message.state !== 'answered' ? { ...message, state } : message)

export function applyChatEvent(messages: ChatMessage[], event: ChatEvent): ChatMessage[] {
  if (event.type === 'processing') return setState(messages, event.id, 'processing')
  if (event.type === 'answer') return [...setState(messages, event.id, 'answered'), { id: `${event.id}:answer`, role: 'assistant', text: event.answer, model: event.model }]
  return [...setState(messages, event.id, 'failed'), { id: `${event.id ?? 'server'}:error:${messages.length}`, role: 'error', text: event.message }]
}

/** Marca como falhas as perguntas que ficaram sem resposta quando a conexão caiu. */
export function failPending(messages: ChatMessage[]) {
  return messages.map(message => message.role === 'user' && (message.state === 'sent' || message.state === 'processing') ? { ...message, state: 'failed' as const } : message)
}

export function validateQuestion(text: string): { question?: string; error?: string } {
  const question = text.trim()
  if (!question) return { error: 'Digite uma pergunta.' }
  if (question.length > MAX_QUESTION_LENGTH) return { error: `A pergunta deve ter até ${MAX_QUESTION_LENGTH} caracteres.` }
  return { question }
}
