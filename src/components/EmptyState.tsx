import { Link } from 'react-router'
import { Mascot } from './BrandLogo'

export default function EmptyState({ title, text, createHabit = false }: { title: string; text: string; createHabit?: boolean }) {
  return <div className="empty-state"><span><Mascot size={40} /></span><h3>{title}</h3><p>{text}</p>{createHabit && <Link className="primary mt-5" to="/dashboard/novo-habito">Criar hábito</Link>}</div>
}
