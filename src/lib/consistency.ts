import { dateKey, longestStreak, streak } from './habits'
import type { CheckIn } from './types'

export const isPlannedRest = (record: CheckIn) => record.status === 'planned_rest' && record.tracking?.allowPlannedRest === true

// Descanso autorizado é neutro: conecta dias concluídos sem aumentar o contador.
// Hoje ainda pode estar pendente/parcial/adiado, mantendo a sequência até ontem.
export function getHabitStreaks(records: CheckIn[], habitId: number, today = new Date()) {
  const list = records.filter(c => c.habitId === habitId && c.date <= dateKey(today))
  const completed = list.filter(c => c.status === 'completed').map(c => c.date)
  if (!list.some(isPlannedRest)) return { current: streak(completed, today), best: longestStreak(completed) }
  const days = new Map(list.filter(c => c.status === 'completed' || isPlannedRest(c)).map(c => [c.date, c]))
  const cursor = new Date(today)
  if (!days.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1)
  let current = 0
  while (days.has(dateKey(cursor))) {
    if (days.get(dateKey(cursor))!.status === 'completed') current++
    cursor.setDate(cursor.getDate() - 1)
  }
  let best = 0
  let count = 0
  let previous = ''
  for (const day of [...days.keys()].sort()) {
    const yesterday = new Date(`${day}T12:00:00`)
    yesterday.setDate(yesterday.getDate() - 1)
    if (dateKey(yesterday) !== previous) count = 0
    if (days.get(day)!.status === 'completed') count++
    best = Math.max(best, count)
    previous = day
  }
  return { current, best }
}
