export function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function previousDays(count: number, today = new Date()) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(today)
    date.setDate(date.getDate() - count + index + 1)
    return dateKey(date)
  })
}

export function streak(dates: string[], today = new Date()) {
  const unique = new Set(dates)
  const cursor = new Date(today)
  if (!unique.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1)
  let result = 0
  while (unique.has(dateKey(cursor))) {
    result++
    cursor.setDate(cursor.getDate() - 1)
  }
  return result
}

export function isDateKey(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T12:00:00`)
  return !Number.isNaN(date.getTime()) && dateKey(date) === value
}

export function longestStreak(dates: string[]) {
  const sorted = [...new Set(dates.filter(isDateKey))].sort()
  let best = 0
  let current = 0
  let previous = ''
  for (const day of sorted) {
    const yesterday = new Date(`${day}T12:00:00`)
    yesterday.setDate(yesterday.getDate() - 1)
    current = dateKey(yesterday) === previous ? current + 1 : 1
    best = Math.max(best, current)
    previous = day
  }
  return best
}

export function weekDays(firstDay: 0 | 1, today = new Date()) {
  const start = new Date(today)
  start.setDate(start.getDate() - (start.getDay() - firstDay + 7) % 7)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  return previousDays(7, end)
}
