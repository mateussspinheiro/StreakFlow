import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import type { CheckIn, Habit } from '../lib/types'
import { previousDays } from '../lib/habits'
import { habitDates } from '../lib/streakflow'
import { STATUS_LABELS } from '../lib/checkins'
import EmptyState from './EmptyState'
import { Mascot } from './BrandLogo'
import { getQuickSteps, getTracking, isNumericTracking } from '../lib/tracking'
import { getHabitStreaks } from '../lib/consistency'
import NumericProgress from './NumericProgress'
import CheckInStatusBadge from './CheckInStatusBadge'

export default function HabitList({ habits, records, today, summary = false, onCheckIn, onDelete, onQuickCheckIn }: { habits: Habit[]; records: CheckIn[]; today: string; summary?: boolean; onCheckIn: (habit: Habit, record?: CheckIn) => void; onDelete: (habit: Habit) => void; onQuickCheckIn: (habitId: number, delta?: number) => void }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Todas')
  const [status, setStatus] = useState('Todos')
  const currentDate = new Date(`${today}T12:00:00`)
  const first = previousDays(7, currentDate)[0]
  const { todayRecords, byHabit } = useMemo(() => {
    const todayRecords = new Map<number, CheckIn>()
    const byHabit = new Map<number, CheckIn[]>()
    for (const record of records) {
      if (record.date === today) todayRecords.set(record.habitId, record)
      const list = byHabit.get(record.habitId) ?? []
      list.push(record)
      byHabit.set(record.habitId, list)
    }
    return { todayRecords, byHabit }
  }, [records, today])
  const visible = habits.filter(h => {
    const record = todayRecords.get(h.id)
    return h.title.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')) && (category === 'Todas' || h.category === category) && (status === 'Todos' || (record?.status ?? 'pending') === status)
  })
  return <section className="panel"><div className="section-heading"><div><h2>{summary ? 'Sua rotina de hoje' : 'Seus hábitos'}</h2><p className="muted">Registre uma realização, com espaço para o contexto.</p></div><span className="badge">{habits.length} ativos</span></div>
    {!summary && <div className="filters"><label>Buscar hábito<input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar pelo nome…" /></label><label>Categoria<select value={category} onChange={e => setCategory(e.target.value)}>{['Todas', ...new Set(habits.map(h => h.category))].map(c => <option key={c}>{c}</option>)}</select></label><label>Status de hoje<select value={status} onChange={e => setStatus(e.target.value)}><option>Todos</option>{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>}
    {!visible.length ? <EmptyState title={habits.length ? 'Nenhum resultado encontrado' : 'Sua rotina começa aqui.'} text={habits.length ? 'Ajuste os filtros para encontrar seus hábitos.' : 'Crie seu primeiro hábito para começar a acompanhar sua consistência.'} createHabit={!habits.length} /> : <div className="habit-list">{(summary ? visible.slice(0, 5) : visible).map(habit => {
      const record = todayRecords.get(habit.id)
      const habitRecords = byHabit.get(habit.id) ?? []
      const dates = habitDates(habitRecords, habit.id)
      const tracking = getTracking(habit, record)
      const numeric = isNumericTracking(tracking)
      return <article key={habit.id} className={`habit-card habit-color-${habit.color ?? 'purple'} ${record?.status === 'completed' ? 'is-done' : ''}`}>
        <div className="habit-card-top"><span className="category-label">{habit.category}</span><CheckInStatusBadge status={record?.status} /></div>
        <h3>{habit.title}</h3>{habit.description && <p className="muted habit-description">{habit.description}</p>}
        <div className="habit-meta"><span>Meta: {habit.weeklyGoal}x / semana</span>{habit.estimatedMinutes && <span>Estimativa: {habit.estimatedMinutes} min</span>}<span>{dates.filter(day => day >= first && day <= today).length} conclusões nos últimos 7 dias</span></div>
        {numeric && <><NumericProgress config={tracking} value={record?.value ?? 0} label={habit.title} /><div className="quick-actions">{getQuickSteps(tracking).map(step => <button className="secondary" key={step.label} aria-label={`${step.label} em ${habit.title}`} onClick={() => onQuickCheckIn(habit.id, step.value)}>{step.label}</button>)}{record?.status !== 'completed' && <button className="secondary" onClick={() => onQuickCheckIn(habit.id)} aria-label={`Atingir meta de ${habit.title}`}>Concluir</button>}</div></>}
        {tracking.trackingType === 'binary' && record?.status !== 'completed' && <button className="secondary" onClick={() => onQuickCheckIn(habit.id)} aria-label={`Marcar ${habit.title} como concluído`}>Marcar como concluído</button>}
        <div className="habit-card-bottom"><span className="streak-inline"><Mascot size={23} />{getHabitStreaks(habitRecords, habit.id, currentDate).current} dias</span><div className="habit-actions"><Link className="quiet-button" to={`/dashboard/editar-habito/${habit.id}`} aria-label={`Editar hábito ${habit.title}`}>Editar</Link><button className="quiet-button danger-text" aria-label={`Excluir ${habit.title}`} onClick={() => onDelete(habit)}>Excluir</button><button className={record ? 'secondary' : 'primary'} onClick={() => onCheckIn(habit, record)}>{record ? 'Editar registro' : 'Registrar'}</button></div></div>
      </article>
    })}</div>}
    {summary && <Link className="text-link" to="/meus-habitos">Gerenciar meus hábitos →</Link>}
  </section>
}
