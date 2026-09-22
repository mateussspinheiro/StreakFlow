import type { CheckInStatus } from './types'

export const STATUS_LABELS: Record<CheckInStatus, string> = { completed: 'Concluído', partial: 'Parcial', skipped: 'Ignorado' }
export const EFFORT_LABELS = ['Muito fácil', 'Tranquilo', 'Normal', 'Difícil', 'Muito difícil']
export const formatDate = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })
