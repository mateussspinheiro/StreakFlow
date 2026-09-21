export function read<T>(key: string, fallback: T): T {
  try { return JSON.parse(sessionStorage.getItem(`streakflow:${key}`) || 'null') ?? fallback } catch { return fallback }
}
export function save(key: string, value: unknown) { sessionStorage.setItem(`streakflow:${key}`, JSON.stringify(value)) }
