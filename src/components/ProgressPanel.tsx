import { useState } from 'react'
import type { CheckIn, Habit, Settings } from '../lib/types'
import { previousDays } from '../lib/habits'
import { getIndicators, weeklyProgress } from '../lib/streakflow'
import { getHabitStreaks, isPlannedRest } from '../lib/consistency'
import { getInsights } from '../lib/insights'
import { Stat } from './DayOverview'
import EmptyState from './EmptyState'
import { Mascot } from './BrandLogo'

export default function ProgressPanel({ habits, records, settings, today }: { habits: Habit[]; records: CheckIn[]; settings: Settings; today: string }) {
  const [period, setPeriod] = useState(7)
  const now = new Date(`${today}T12:00:00`)
  const { checkIns, completionRate, currentStreak, bestStreak, total } = getIndicators({ habits, completions: records }, now)
  const { mostConsistent, messages } = getInsights(habits, records, now)
  const days = previousDays(period, now)
  return <>
    <section className="stats-grid"><Stat icon="history" label="Total de check-ins" value={checkIns} detail={`${total} concluídos`} /><Stat icon="check" label="Taxa de conclusão" value={completionRate === null ? '—' : `${completionRate}%`} detail="Concluídos ÷ registros sem descanso" /><Stat icon="flame" label="Streak atual" value={`${currentStreak} dias`} detail={`Melhor streak: ${bestStreak} dias`} /></section>
    <section className="panel insights-panel"><div><p className="eyebrow">SUA ROTINA EM PERSPECTIVA</p><h2>{mostConsistent ? `Mais consistente: ${mostConsistent.habit.title}` : 'Cada registro ajuda a entender seu ritmo'}</h2></div>{messages.length ? <ul>{messages.map(message => <li key={message}>{message}</li>)}</ul> : <p className="muted">Continue registrando seus hábitos para desbloquear mais informações sobre sua rotina.</p>}</section>
    {!records.length ? <section className="panel"><EmptyState title="Ainda não temos dados suficientes." text="Continue registrando seus hábitos para visualizar sua evolução." createHabit={!habits.length} /></section> : <section className="panel"><div className="section-heading"><div><h2>Progresso recente</h2><p className="muted">Conclusões por dia, entre os hábitos existentes naquela data.</p></div><label>Período<select value={period} onChange={e => setPeriod(Number(e.target.value))}><option value={7}>Últimos 7 dias</option><option value={14}>Últimos 14 dias</option><option value={30}>Últimos 30 dias</option></select></label></div><div className={`chart ${period === 7 ? 'chart-week' : ''}`} role="list" aria-label="Conclusões por dia">{days.map(day => {
      const eligible = habits.filter(h => h.createdAt <= day && !records.some(c => c.habitId === h.id && c.date === day && isPlannedRest(c)))
      const count = eligible.filter(h => records.some(c => c.habitId === h.id && c.date === day && c.status === 'completed')).length
      const rate = eligible.length ? Math.round(count / eligible.length * 100) : 0
      const label = new Date(`${day}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
      return <div className="chart-column" role="listitem" key={day} aria-label={`${day}: ${count} de ${eligible.length}, ${rate}%`} title={`${day}: ${count} de ${eligible.length}`}><span className="chart-value">{rate}%</span><div className="bar-track"><div style={{ height: `${rate}%` }} /></div><span>{period === 7 ? label : day.slice(-2)}</span></div>
    })}</div><p className="muted mt-4">Somente conclusões somam às metas. Descansos planejados são neutros e saem da base do dia. Dias sem atividades aparecem com 0%.</p></section>}
    <section className="panel"><div className="section-heading"><div><h2>Consistência por hábito</h2><p className="muted">Semana iniciada {settings.firstDayOfWeek === 0 ? 'no domingo' : 'na segunda-feira'}.</p></div></div>{!habits.length ? <EmptyState title="Sua rotina começa aqui." text="Crie um hábito para acompanhar sua meta semanal." createHabit /> : habits.map(habit => {
      const week = weeklyProgress(habit, records, settings, now)
      return <article className="consistency-row" key={habit.id}><div><h3>{habit.title}</h3><p className="muted">Meta: {habit.weeklyGoal}x / semana · Realizado: {week.count}x</p><span className="streak-inline"><Mascot size={20} />{getHabitStreaks(records, habit.id, now).current} dias seguidos</span></div><div className="habit-weekly"><strong>{week.percent}%</strong><progress aria-label={`Meta semanal de ${habit.title}`} max={100} value={week.percent} /></div></article>
    })}</section>
  </>
}
