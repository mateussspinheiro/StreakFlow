import { dateKey, isDateKey } from './habits'
import type { CheckIn } from './types'

export type HeatmapState = 'empty' | 'low' | 'partial' | 'completed' | 'excellent' | 'rest'

export type HeatmapDay = {
  date: string
  records: CheckIn[]
  total: number
  completed: number
  partial: number
  postponed: number
  pending: number
  skipped: number
  plannedRest: number
  completionRate: number | null
  level: 0 | 1 | 2 | 3 | 4
  state: HeatmapState
  label: string
}

export const HEATMAP_STATE_LABELS: Record<HeatmapState, string> = {
  empty: 'Sem registro',
  low: 'Sem conclusão',
  partial: 'Progresso parcial',
  completed: 'Hábito concluído',
  excellent: 'Vários hábitos concluídos',
  rest: 'Descanso planejado',
}

const longDate = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })

function localDate(date: string) {
  if (!isDateKey(date)) throw new RangeError('Use uma data local válida no formato YYYY-MM-DD.')
  return new Date(`${date}T12:00:00`)
}

export function groupCheckInsByDate(records: CheckIn[], habitId?: number) {
  const grouped = new Map<string, CheckIn[]>()
  for (const record of records) {
    if (!isDateKey(record.date) || (habitId !== undefined && record.habitId !== habitId)) continue
    const day = grouped.get(record.date)
    if (day) day.push(record)
    else grouped.set(record.date, [record])
  }
  return grouped
}

// Usa o status histórico: não reinterpreta valores com a meta atual do hábito.
export function getDailyHeatmapSummary(date: string, records: CheckIn[]): HeatmapDay {
  const dayDate = localDate(date)
  const dayRecords = records.filter(record => record.date === date)
  const counts = { completed: 0, partial: 0, postponed: 0, pending: 0, skipped: 0, plannedRest: 0 }
  for (const record of dayRecords) {
    if (record.status === 'planned_rest') counts.plannedRest++
    else counts[record.status]++
  }
  const total = dayRecords.length
  const evaluated = total - counts.plannedRest
  // A taxa descreve check-ins registrados, não hábitos previstos ou metas semanais.
  const completionRate = evaluated ? counts.completed / evaluated * 100 : null
  let state: HeatmapState = 'empty'
  let level: HeatmapDay['level'] = 0
  if (counts.completed >= 2) { state = 'excellent'; level = 4 }
  else if (counts.completed === 1) { state = 'completed'; level = 3 }
  else if (counts.partial > 0) { state = 'partial'; level = 2 }
  else if (total > 0 && counts.plannedRest === total) state = 'rest'
  else if (total > 0) { state = 'low'; level = 1 }
  const label = `${longDate.format(dayDate)}: ${HEATMAP_STATE_LABELS[state]}. ${total} check-ins; ${counts.completed} concluídos, ${counts.partial} parciais, ${counts.postponed} adiados, ${counts.pending} pendentes, ${counts.skipped} não realizados e ${counts.plannedRest} descansos planejados.${completionRate === null ? '' : ` Taxa de conclusão dos registros, sem descanso: ${Math.round(completionRate)}%.`}`
  return { date, records: dayRecords, total, ...counts, completionRate, level, state, label }
}

// Intervalo inclusivo em dias de calendário local, sem conversão para UTC.
export function getHeatmapRange(period: number, today: string) {
  if (!Number.isInteger(period) || period < 1) throw new RangeError('O período deve conter ao menos um dia.')
  const start = localDate(today)
  start.setDate(start.getDate() - period + 1)
  return { start: dateKey(start), end: today }
}

export function buildHeatmapCalendar(records: CheckIn[], options: {
  start: string
  end: string
  habitId?: number
  firstDayOfWeek?: 0 | 1
}): { days: HeatmapDay[]; weeks: (HeatmapDay | null)[][] } {
  const cursor = localDate(options.start)
  localDate(options.end)
  if (options.start > options.end) throw new RangeError('O início do período deve ser anterior ou igual ao fim.')
  const firstDayOfWeek = options.firstDayOfWeek ?? 1
  const grouped = groupCheckInsByDate(records, options.habitId)
  const days: HeatmapDay[] = []
  const cells: (HeatmapDay | null)[] = Array.from({ length: (cursor.getDay() - firstDayOfWeek + 7) % 7 }, () => null)
  while (dateKey(cursor) <= options.end) {
    const date = dateKey(cursor)
    const day = getDailyHeatmapSummary(date, grouped.get(date) ?? [])
    days.push(day)
    cells.push(day)
    cursor.setDate(cursor.getDate() + 1)
  }
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks: (HeatmapDay | null)[][] = []
  for (let index = 0; index < cells.length; index += 7) weeks.push(cells.slice(index, index + 7))
  return { days, weeks }
}

export function summarizeHeatmap(days: HeatmapDay[]) {
  const summary = { totalDays: days.length, activeDays: 0, completionDays: 0, restDays: 0, totalCheckIns: 0, activeRate: 0 }
  for (const day of days) {
    if (day.completed > 0 || day.partial > 0) summary.activeDays++
    if (day.completed > 0) summary.completionDays++
    if (day.plannedRest > 0) summary.restDays++
    summary.totalCheckIns += day.total
  }
  summary.activeRate = days.length ? summary.activeDays / days.length * 100 : 0
  return summary
}
