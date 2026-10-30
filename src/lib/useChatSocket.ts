import { useCallback, useEffect, useRef, useState } from 'react'
import { getAccessToken } from './auth'
import { applyChatEvent, chatSocketUrl, failPending, parseChatEvent, validateQuestion, type ChatMessage, type ChatStatus } from './chat'

const newId = () => crypto.randomUUID()

// Conexão WebSocket autenticada com o API Gateway. O access token do Cognito
// vai na query string (?token=) porque o navegador não permite cabeçalhos
// personalizados no handshake WebSocket; a Lambda valida o token no $connect.
export function useChatSocket(baseUrl: string | undefined) {
  const [status, setStatus] = useState<ChatStatus>(baseUrl ? 'connecting' : 'unconfigured')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [error, setError] = useState('')
  const socketRef = useRef<WebSocket | null>(null)
  const generation = useRef(0)

  const open = useCallback(async () => {
    if (!baseUrl) return
    const attempt = ++generation.current
    let url: string
    try { url = chatSocketUrl(baseUrl, await getAccessToken()) }
    catch (cause) {
      if (attempt !== generation.current) return
      setStatus('error')
      setError(cause instanceof Error && cause.message.includes('wss://') ? cause.message : 'Não foi possível obter sua sessão. Entre novamente.')
      return
    }
    if (attempt !== generation.current) return // página desmontada ou nova tentativa em andamento
    socketRef.current?.close()
    const socket = new WebSocket(url)
    socketRef.current = socket
    socket.onopen = () => { if (socketRef.current === socket) { setStatus('open'); setError('') } }
    socket.onmessage = event => {
      const parsed = parseChatEvent(event.data)
      if (parsed) setMessages(list => applyChatEvent(list, parsed))
    }
    socket.onerror = () => { if (socketRef.current === socket) setError('Não foi possível manter a conexão com o assistente.') }
    socket.onclose = () => {
      if (socketRef.current !== socket) return
      socketRef.current = null
      setStatus('closed')
      setMessages(failPending)
    }
  }, [baseUrl])

  useEffect(() => {
    void open()
    return () => { generation.current++; const socket = socketRef.current; socketRef.current = null; socket?.close() }
  }, [open])

  const reconnect = useCallback(() => { setStatus('connecting'); setError(''); void open() }, [open])

  const send = useCallback((text: string) => {
    const socket = socketRef.current
    const { question, error: invalid } = validateQuestion(text)
    if (!question) { setError(invalid ?? 'Digite uma pergunta.'); return false }
    if (!socket || socket.readyState !== WebSocket.OPEN) { setError('Conexão indisponível. Clique em Reconectar.'); return false }
    const id = newId()
    socket.send(JSON.stringify({ type: 'ask', id, question }))
    setMessages(list => [...list, { id, role: 'user', text: question, state: 'sent' }])
    setError('')
    return true
  }, [])

  return { status, messages, error, send, reconnect }
}
