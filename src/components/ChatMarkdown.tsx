import { Fragment, type ReactNode } from 'react'

// Renderiza o subconjunto de Markdown que o Gemini costuma usar (parágrafos,
// títulos, listas, **negrito**, *itálico* e `código`) como elementos React.
// Não usa HTML bruto: o texto continua escapado pelo React.
type Block =
  | { type: 'p'; lines: string[] }
  | { type: 'h'; text: string }
  | { type: 'ul' | 'ol'; items: string[] }

const BULLET = /^\s*[*\-•]\s+(.*)$/
const NUMBER = /^\s*\d+[.)]\s+(.*)$/
const HEADING = /^\s*#{1,6}\s+(.*)$/

function parseBlocks(text: string): Block[] {
  const blocks: Block[] = []
  for (const line of text.replace(/\r\n?/g, '\n').split('\n')) {
    const last = blocks.at(-1)
    const bullet = line.match(BULLET)
    const number = bullet ? null : line.match(NUMBER)
    const heading = line.match(HEADING)
    if (!line.trim()) { blocks.push({ type: 'p', lines: [] }); continue }
    if (heading) blocks.push({ type: 'h', text: heading[1] })
    else if (bullet || number) {
      const type = bullet ? 'ul' : 'ol'
      const item = (bullet ?? number)?.[1] ?? ''
      if ((last?.type === 'ul' || last?.type === 'ol') && last.type === type) last.items.push(item)
      else blocks.push({ type, items: [item] })
    } else if (last?.type === 'p') last.lines.push(line.trim())
    else blocks.push({ type: 'p', lines: [line.trim()] })
  }
  return blocks.filter(block => block.type !== 'p' || block.lines.length)
}

const INLINE = /(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\*[^*\s][^*]*\*)/g
function inline(text: string): ReactNode[] {
  return text.split(INLINE).filter(Boolean).map((part, index) => {
    if (/^(\*\*|__).+\1$/.test(part)) return <strong key={index}>{part.slice(2, -2)}</strong>
    if (/^`.+`$/.test(part)) return <code key={index}>{part.slice(1, -1)}</code>
    if (/^\*.+\*$/.test(part)) return <em key={index}>{part.slice(1, -1)}</em>
    return part
  })
}

export default function ChatMarkdown({ text }: { text: string }) {
  return <div className="chat-markdown">{parseBlocks(text).map((block, index) => {
    if (block.type === 'p') return <p key={index}>{block.lines.map((line, i) => <Fragment key={i}>{i > 0 && <br />}{inline(line)}</Fragment>)}</p>
    if (block.type === 'h') return <p key={index} className="chat-md-heading">{inline(block.text)}</p>
    const items = block.items.map((item, i) => <li key={i}>{inline(item)}</li>)
    return block.type === 'ul' ? <ul key={index}>{items}</ul> : <ol key={index}>{items}</ol>
  })}</div>
}
