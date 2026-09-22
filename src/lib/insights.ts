import { dateKey, previousDays } from './habits'
import { habitDates } from './streakflow'
import type { CheckIn, Habit } from './types'

// Compare janelas completas e equivalentes. Não extrapole tendências a partir de um único dia.
export function getInsights(habits: Habit[], records: CheckIn[], today = new Date()) {
  const days = previousDays(14, today)
  const recent = new Set(days.slice(7))
  const previous = new Set(days.slice(0, 7))
  const completed = records.filter(c => c.status === 'completed' && c.date <= dateKey(today))
  const ranked = habits.map(habit => {
    const eligible = days.slice(7).filter(day => day >= habit.createdAt).length
    const count = habitDates(completed, habit.id).filter(day => recent.has(day)).length
    return { habit, count, eligible, rate: eligible ? count / eligible : 0 }
  }).filter(item => item.eligible === 7 && item.count > 0).sort((a, b) => b.rate - a.rate || a.habit.id - b.habit.id)
  const mostConsistent = ranked.length && (ranked.length === 1 || ranked[0].rate > ranked[1].rate) ? ranked[0] : null
  const messages: string[] = []
  if (mostConsistent) messages.push(`${mostConsistent.habit.title}: ${mostConsistent.count} conclusões nos últimos 7 dias, seu hábito mais consistente nesse período.`)
  const stableIds = new Set(habits.filter(h => h.createdAt <= days[0]).map(h => h.id))
  const currentCount = completed.filter(c => stableIds.has(c.habitId) && recent.has(c.date)).length
  const previousCount = completed.filter(c => stableIds.has(c.habitId) && previous.has(c.date)).length
  if (previousCount > 0) {
    const change = Math.round((currentCount - previousCount) / previousCount * 100)
    messages.push(change === 0 ? 'Os hábitos presentes nos dois períodos tiveram a mesma quantidade de conclusões nos últimos 7 dias e nos 7 anteriores.' : `Nos hábitos presentes nos dois períodos, houve ${Math.abs(change)}% ${change > 0 ? 'mais' : 'menos'} conclusões nos últimos 7 dias (${currentCount}) que nos 7 anteriores (${previousCount}).`)
  }
  return { mostConsistent, messages }
}
