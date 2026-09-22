import { useState } from 'react'
import { Link } from 'react-router'
import type { CheckIn, Habit } from '../lib/types'
import { previousDays, streak } from '../lib/habits'
import { habitDates } from '../lib/streakflow'
import { STATUS_LABELS } from '../lib/checkins'
import EmptyState from './EmptyState'
import { Mascot } from './BrandLogo'

export default function HabitList({ habits, records, today, summary = false, onCheckIn, onDelete }: { habits: Habit[]; records: CheckIn[]; today: string; summary?: boolean; onCheckIn: (habit: Habit, record?: CheckIn) => void; onDelete: (habit: Habit) => void }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Todas')
  const [status, setStatus] = useState('Todos')
  const currentDate = new Date(`${today}T12:00:00`)
  const first = previousDays(7, currentDate)[0]
  const visible = habits.filter(h => {
    const record = records.find(c => c.habitId === h.id && c.date === today)
    return h.title.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')) && (category === 'Todas' || h.category === category) && (status === 'Todos' || (status === 'pending' ? !record : record?.status === status))
  })
  return <section className="panel"><div className="section-heading"><div><h2>{summary ? 'Sua rotina de hoje' : 'Seus hábitos'}</h2><p className="muted">Registre uma realização, com espaço para o contexto.</p></div><span className="badge">{habits.length} ativos</span></div>
    {!summary && <div className="filters"><label>Buscar hábito<input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar pelo nome…" /></label><label>Categoria<select value={category} onChange={e => setCategory(e.target.value)}>{['Todas', ...new Set(habits.map(h => h.category))].map(c => <option key={c}>{c}</option>)}</select></label><label>Status de hoje<select value={status} onChange={e => setStatus(e.target.value)}><option>Todos</option><option value="pending">Sem registro</option>{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>}
    {!visible.length ? <EmptyState title={habits.length ? 'Nenhum resultado encontrado' : 'Sua rotina começa aqui.'} text={habits.length ? 'Ajuste os filtros para encontrar seus hábitos.' : 'Crie seu primeiro hábito para começar a acompanhar sua consistência.'} createHabit={!habits.length} /> : <div className="habit-list">{(summary ? visible.slice(0, 5) : visible).map(habit => {
      const record = records.find(c => c.habitId === habit.id && c.date === today)
      const dates = habitDates(records, habit.id)
      return <article key={habit.id} className={`habit-card habit-color-${habit.color ?? 'purple'} ${record?.status === 'completed' ? 'is-done' : ''}`}>
        <div className="habit-card-top"><span className="category-label">{habit.category}</span><span className={`badge status-${record?.status ?? 'pending'}`}>{record ? STATUS_LABELS[record.status] : 'Sem registro hoje'}</span></div>
        <h3>{habit.title}</h3>{habit.description && <p className="muted habit-description">{habit.description}</p>}
        <div className="habit-meta"><span>Meta: {habit.weeklyGoal}x / semana</span>{habit.estimatedMinutes && <span>Estimativa: {habit.estimatedMinutes} min</span>}<span>{dates.filter(day => day >= first && day <= today).length} conclusões nos últimos 7 dias</span></div>
        <div className="habit-card-bottom"><span className="streak-inline"><Mascot size={23} />{streak(dates, currentDate)} dias</span><div className="habit-actions"><Link className="quiet-button" to={`/dashboard/editar-habito/${habit.id}`} aria-label={`Editar hábito ${habit.title}`}>Editar</Link><button className="quiet-button danger-text" aria-label={`Excluir ${habit.title}`} onClick={() => onDelete(habit)}>Excluir</button><button className={record ? 'secondary' : 'primary'} onClick={() => onCheckIn(habit, record)}>{record ? 'Editar registro' : 'Registrar'}</button></div></div>
      </article>
    })}</div>}
    {summary && <Link className="text-link" to="/meus-habitos">Gerenciar meus hábitos →</Link>}
  </section>
}
