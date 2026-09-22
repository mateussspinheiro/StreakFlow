import type { CheckInStatus } from './types'

export const STATUS_LABELS: Record<CheckInStatus, string> = { pending: 'Pendente', partial: 'Parcial', completed: 'Concluído', postponed: 'Adiado', planned_rest: 'Descanso planejado', skipped: 'Ignorado (registro anterior)' }
export const INTENSITY_LABELS = { light: 'Leve', moderate: 'Moderada', intense: 'Intensa' } as const
export const EFFORT_LABELS = ['Muito fácil', 'Tranquilo', 'Normal', 'Difícil', 'Muito difícil']
export const formatDate = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })
