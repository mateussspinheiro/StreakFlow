import { useState } from 'react'
import type { CheckIn, Habit } from '../lib/types'
import { previousDays } from '../lib/habits'
import { EFFORT_LABELS, INTENSITY_LABELS, formatDate } from '../lib/checkins'
import { isNumericTracking } from '../lib/tracking'
import NumericProgress from './NumericProgress'
import CheckInStatusBadge from './CheckInStatusBadge'
import EmptyState from './EmptyState'

export default function HistoryPanel({ habits, records, today, onEdit }: { habits: Habit[]; records: CheckIn[]; today: string; onEdit: (habit: Habit, record: CheckIn) => void }) {
  const [period, setPeriod] = useState(0)
  const [habitId, setHabitId] = useState('')
  const [date, setDate] = useState('')
  const first = period ? previousDays(period, new Date(`${today}T12:00:00`))[0] : ''
  const history = records.filter(c => c.date >= first && c.date <= today && (!date || date === c.date) && (!habitId || c.habitId === Number(habitId))).sort((a, b) => b.date.localeCompare(a.date) || (b.time ?? '').localeCompare(a.time ?? '') || a.habitId - b.habitId)
  return <section className="panel"><div className="section-heading"><div><h2>Seu diário de registros</h2><p className="muted">Resultados e contexto, do mais recente ao mais antigo.</p></div><span className="badge">{history.length} check-ins</span></div>
    <div className="filters"><label>Período<select value={period} onChange={e => setPeriod(Number(e.target.value))}><option value={0}>Todos</option><option value={7}>Últimos 7 dias</option><option value={30}>Últimos 30 dias</option></select></label><label>Hábito<select value={habitId} onChange={e => setHabitId(e.target.value)}><option value="">Todos os hábitos</option>{habits.map(h => <option key={h.id} value={h.id}>{h.title}</option>)}</select></label><label>Data específica<input type="date" max={today} value={date} onChange={e => setDate(e.target.value)} /></label><button className="secondary self-end" onClick={() => { setDate(''); setPeriod(0); setHabitId('') }}>Limpar filtros</button></div>
    {!history.length ? <EmptyState title={records.length ? 'Nenhum check-in neste período.' : 'Nenhum check-in ainda.'} text={records.length ? 'Ajuste os filtros para consultar outros registros.' : 'Quando você registrar seu primeiro hábito, ele aparecerá aqui.'} /> : <div className="history-list">{history.map(record => {
      const habit = habits.find(h => h.id === record.habitId)
      return <article className="checkin-card" key={record.id}><div className="section-heading"><div><h3>{habit?.title ?? 'Hábito não encontrado'}</h3><time className="muted" dateTime={`${record.date}${record.time ? `T${record.time}` : ''}`}>{record.date === today ? 'Hoje' : formatDate(record.date)}{record.time ? `, ${record.time}` : ' · Horário não informado'}</time></div><CheckInStatusBadge status={record.status} /></div><div className="habit-meta">{record.intensity && <span>Intensidade: {INTENSITY_LABELS[record.intensity]}</span>}{record.durationMinutes !== undefined && <span>{record.durationMinutes} min</span>}{record.effort && <span>Esforço: {EFFORT_LABELS[record.effort - 1]}</span>}</div>{record.tracking && isNumericTracking(record.tracking) && <NumericProgress config={record.tracking} value={record.value ?? 0} label={habit?.title ?? "Registro"} />}{record.note && <p className="checkin-note">{record.note}</p>}{habit && <button className="quiet-button" onClick={() => onEdit(habit, record)}>Editar registro</button>}</article>
    })}</div>}
  </section>
}
