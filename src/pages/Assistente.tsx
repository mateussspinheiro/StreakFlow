import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { MAX_QUESTION_LENGTH, type ChatStatus } from '../lib/chat'
import { useChatSocket } from '../lib/useChatSocket'
import ChatMarkdown from '../components/ChatMarkdown'

const statusLabels: Record<ChatStatus, string> = {
  unconfigured: 'Não configurado',
  connecting: 'Conectando...',
  open: 'Conectado',
  closed: 'Desconectado',
  error: 'Erro de conexão',
}
const stateLabels = { sent: 'Enviada', processing: 'Processando...', answered: 'Respondida', failed: 'Sem resposta' } as const

export default function Assistente() {
  const baseUrl = import.meta.env.VITE_CHAT_WS_URL?.trim() || undefined
  const { status, messages, error, send, reconnect } = useChatSocket(baseUrl)
  const [draft, setDraft] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const waiting = messages.some(message => message.role === 'user' && (message.state === 'sent' || message.state === 'processing'))
  const host = baseUrl ? (() => { try { return new URL(baseUrl).host } catch { return baseUrl } })() : ''

  useEffect(() => { document.title = 'Assistente IA | StreakFlow' }, [])
  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight }) }, [messages])

  function submit(event?: FormEvent) {
    event?.preventDefault()
    if (send(draft)) setDraft('')
  }
  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); submit() }
  }

  return <div className="page-content">
    <header className="page-heading">
      <div>
        <p className="eyebrow">STREAKFLOW / ASSISTENTE</p>
        <h1>Assistente IA</h1>
        <p className="muted">Tire dúvidas sobre hábitos, constância e rotina. As respostas são geradas pelo Google Gemini.</p>
      </div>
      <div className="chat-connection">
        <span className={`chat-status chat-status-${status}`} role="status"><span aria-hidden="true" />{statusLabels[status]}</span>
        {host && <small className="muted">{host}</small>}
        {(status === 'closed' || status === 'error') && <button type="button" className="secondary" onClick={reconnect}>Reconectar</button>}
      </div>
    </header>

    <section className="panel chat-panel" aria-label="Conversa com o assistente">
      {status === 'unconfigured'
        ? <p className="muted">O chat ainda não está configurado. Defina <code>VITE_CHAT_WS_URL</code> no ambiente e gere o build novamente.</p>
        : <div className="chat-messages" ref={listRef} role="log" aria-live="polite" aria-relevant="additions">
            {!messages.length && <p className="muted chat-empty">Envie uma pergunta, por exemplo: “Como manter um hábito de leitura nos fins de semana?”</p>}
            {messages.map(message => <article key={message.id} className={`chat-bubble chat-${message.role}`}>
              <p className="chat-author">{message.role === 'user' ? 'Você' : message.role === 'assistant' ? 'Assistente' : 'Aviso'}</p>
              {message.role === 'assistant' ? <ChatMarkdown text={message.text} /> : <p className="chat-text">{message.text}</p>}
              {message.role === 'user' && <small className="chat-meta">{stateLabels[message.state]}</small>}
              {message.role === 'assistant' && message.model && <small className="chat-meta">Gerado por {message.model}</small>}
            </article>)}
            {waiting && <p className="muted chat-typing" aria-live="polite">O assistente está pensando...</p>}
          </div>}

      <form className="chat-form" onSubmit={submit}>
        <label htmlFor="chat-question" className="sr-only">Sua pergunta</label>
        <textarea id="chat-question" rows={2} maxLength={MAX_QUESTION_LENGTH} value={draft} placeholder="Escreva sua pergunta..." disabled={status !== 'open'} onChange={event => setDraft(event.target.value)} onKeyDown={onKeyDown} />
        <button className="primary" type="submit" disabled={status !== 'open' || !draft.trim()}>Enviar</button>
      </form>
      <p className="muted chat-hint">Enter envia, Shift+Enter quebra linha. {draft.length}/{MAX_QUESTION_LENGTH}. Não compartilhe dados pessoais sensíveis: o texto é enviado ao Google Gemini.</p>
      {error && <p role="alert" className="chat-error">{error}</p>}
    </section>
  </div>
}
