import type { CheckIn, CheckInStatus, Habit, TrackingConfig } from './types'

export const TRACKING_LABELS = { binary: 'Sim / Não', quantity: 'Quantidade', duration: 'Duração', qualitative: 'Status' } as const
export const COMMON_UNITS = ['ml', 'L', 'páginas', 'min', 'km', 'repetições', 'vezes']
export const MAX_VALUE = 1_000_000_000

export function isNumericTracking(config: TrackingConfig) {
  return config.trackingType === 'quantity' || config.trackingType === 'duration'
}

export function validateValue(value: unknown, label = 'O progresso'): asserts value is number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > MAX_VALUE) throw new Error(`${label} deve ser um número entre 0 e ${MAX_VALUE.toLocaleString('pt-BR')}.`)
}

export function validateTracking(config: TrackingConfig) {
  if (!Object.hasOwn(TRACKING_LABELS, config.trackingType) || typeof config.allowPlannedRest !== 'boolean') throw new Error('Escolha um tipo de acompanhamento válido.')
  if (isNumericTracking(config)) {
    validateValue(config.target, 'A meta')
    if (config.target < 0.000001) throw new Error('A meta deve ser maior que zero (mínimo: 0,000001).')
    if (typeof config.unit !== 'string' || !config.unit.trim() || config.unit.length > 30) throw new Error('Informe uma unidade de até 30 caracteres.')
    if (config.trackingType === 'duration' && config.unit !== 'min') throw new Error('A unidade de duração deve ser min.')
  }
}

// Registros antigos não tinham medição: nunca inferir sua meta a partir do hábito atual.
export function getTracking(habit: Partial<Habit>, record?: CheckIn): TrackingConfig {
  if (record) return record.tracking ?? { trackingType: 'binary', allowPlannedRest: false }
  const config: TrackingConfig = {
    trackingType: habit.trackingType ?? 'binary',
    allowPlannedRest: habit.allowPlannedRest ?? false,
  }
  if (isNumericTracking(config)) { config.target = habit.target; config.unit = config.trackingType === 'duration' ? 'min' : habit.unit?.trim() }
  return config
}

export function getCheckInStatus(config: TrackingConfig, value: number, requested: CheckInStatus = 'pending'): CheckInStatus {
  if (!['pending', 'partial', 'completed', 'postponed', 'planned_rest', 'skipped'].includes(requested)) throw new Error('Escolha um status válido.')
  if (requested === 'planned_rest' && !config.allowPlannedRest) throw new Error('Este hábito não permite descanso planejado.')
  if (!isNumericTracking(config)) return requested
  validateTracking(config)
  validateValue(value)
  if (value >= config.target!) return 'completed'
  if (requested === 'postponed' || requested === 'planned_rest') return requested
  return value > 0 ? 'partial' : 'pending'
}

export function calculateProgressPercentage(value: number, target: number) {
  validateValue(value)
  validateValue(target, 'A meta')
  if (target <= 0) throw new Error('A meta deve ser maior que zero.')
  const percentage = value / target * 100
  if (!Number.isFinite(percentage)) throw new Error('A relação entre o progresso e a meta é muito grande.')
  return { percentage, visualPercentage: Math.min(100, percentage) }
}

export function getQuickSteps(config: TrackingConfig) {
  if (config.unit === 'ml') return [{ value: 250, label: '+250 ml' }, { value: 500, label: '+500 ml' }]
  if (config.unit === 'L') return [{ value: 0.25, label: '+250 ml' }, { value: 0.5, label: '+500 ml' }]
  if (config.unit === 'min') return [{ value: 15, label: '+15 min' }, { value: 30, label: '+30 min' }]
  if (config.unit === 'páginas') return [{ value: 1, label: '+1 página' }, { value: 5, label: '+5 páginas' }]
  return [{ value: 1, label: `+1 ${config.unit ?? ''}` }]
}

export function addValues(current: number, delta: number) {
  validateValue(current)
  validateValue(delta, 'O incremento')
  const next = Number((current + delta).toPrecision(15))
  validateValue(next)
  return next
}

export function checkInFeedback(record: CheckIn) {
  if (record.status === 'completed') {
    if (record.tracking && isNumericTracking(record.tracking)) return record.value! > record.tracking.target! ? 'Você passou da meta de hoje!' : 'Meta alcançada!'
    return 'Hábito concluído!'
  }
  if (record.status === 'planned_rest') return 'Descanso planejado salvo. Sua sequência foi preservada.'
  if (record.status === 'postponed') return 'Hábito adiado. Retome quando puder.'
  return 'Progresso salvo.'
}
