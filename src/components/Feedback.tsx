import { Mascot } from './BrandLogo'

export default function Feedback({ message, error = false, celebrate = false, onClose }: { message: string; error?: boolean; celebrate?: boolean; onClose: () => void }) {
  if (!message) return null
  return <div role={error ? 'alert' : 'status'} className={`notice ${error ? 'notice-error' : ''}`}>{celebrate && <Mascot key={message} size={30} animate />}<span>{message}</span><button className="icon-button" aria-label="Fechar aviso" onClick={onClose}>×</button></div>
}
