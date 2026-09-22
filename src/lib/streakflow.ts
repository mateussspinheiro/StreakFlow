import type { CheckInInput, Completion, Habit, HabitInput, Profile, Settings, StreakFlowData, StreakFlowState, User } from './types'
import { dateKey, isDateKey, weekDays } from './habits'
import { addValues, calculateProgressPercentage, getCheckInStatus, getTracking, isNumericTracking, validateTracking, validateValue } from './tracking'
import { getHabitStreaks, isPlannedRest } from './consistency'
import { hasStoredSession, readLegacy, readStored, removeSession, STORAGE_KEYS, writeStored } from './storage'

export const DEFAULT_SETTINGS: Settings = {
  compact: false,
  habitReminders: false,
  weeklySummary: false,
  firstDayOfWeek: 1,
  theme: 'system',
}
const emptyData = (): StreakFlowData => ({ version: 3, user: null, habits: [], completions: [], settings: { ...DEFAULT_SETTINGS } })
const validMinutes = (value: unknown): value is number => Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 1440
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)
const isProfile = (value: unknown): value is Profile => isRecord(value) && typeof value.name === 'string' && typeof value.email === 'string'
const isUser = (value: unknown): value is User => isRecord(value) && isProfile(value.profile) && Array.isArray(value.salt) && value.salt.length === 16 && value.salt.every(n => Number.isInteger(n) && n >= 0 && n <= 255) && typeof value.verifier === 'string' && /^[a-f0-9]{64}$/.test(value.verifier) && (value.joinedAt === undefined || isDateKey(value.joinedAt))
const isHabit = (value: unknown): value is Habit => isRecord(value) && Number.isSafeInteger(value.id) && typeof value.title === 'string' && value.title.trim().length > 0 && typeof value.category === 'string' && typeof value.description === 'string' && Number.isInteger(value.weeklyGoal) && Number(value.weeklyGoal) >= 1 && Number(value.weeklyGoal) <= 7 && isDateKey(value.createdAt) && (value.estimatedMinutes === undefined || validMinutes(value.estimatedMinutes)) && (value.color === undefined || ['purple', 'violet', 'indigo', 'gray'].includes(String(value.color)))
const isSettings = (value: unknown): value is Settings => isRecord(value) && typeof value.compact === 'boolean' && typeof value.habitReminders === 'boolean' && typeof value.weeklySummary === 'boolean' && (value.firstDayOfWeek === 0 || value.firstDayOfWeek === 1) && (value.theme === undefined || ['light', 'dark', 'system'].includes(String(value.theme)))

function validateData(value: unknown): StreakFlowData {
  if (!isRecord(value) || (value.version !== 2 && value.version !== 3) || (value.user !== null && !isUser(value.user)) || !Array.isArray(value.habits) || !value.habits.every(isHabit) || !Array.isArray(value.completions) || !isSettings(value.settings)) throw new Error('Formato de dados inválido.')
  const habits = value.habits
  habits.forEach(habit => validateTracking(getTracking(habit)))
  const ids = new Set(habits.map(h => h.id))
  if (ids.size !== habits.length) throw new Error('Hábitos duplicados.')
  const seen = new Set<string>()
  const completions: Completion[] = []
  for (const item of value.completions) {
    if (!isRecord(item) || typeof item.habitId !== 'number' || !ids.has(item.habitId) || !isDateKey(item.date)) throw new Error('Registro de conclusão inválido.')
    const key = `${item.habitId}:${item.date}`
    const record = value.version === 2 ? { id: key, habitId: item.habitId, date: item.date, status: 'completed' } : item
    validateCheckIn(record)
    if (typeof record.id !== 'string' || record.id !== key) throw new Error('Identificador de check-in inválido.')
    if (!seen.has(key)) completions.push(record as Completion)
    seen.add(key)
  }
  return { version: 3, user: value.user, habits, completions, settings: { ...value.settings, theme: value.settings.theme ?? 'system' } }
}

// Migração única da implementação anterior; os dados originais da aba são preservados.
function migrateLegacy(): StreakFlowData {
  const next = emptyData()
  const account = readLegacy('account')
  const profile = readLegacy('profile')
  const rawHabits = readLegacy('habits')
  if (account !== null && !isUser(account)) throw new Error('Conta anterior inválida.')
  if (isUser(account)) next.user = { ...account, profile: isProfile(profile) ? validateProfile(profile) : validateProfile(account.profile) }
  if (rawHabits !== null && !Array.isArray(rawHabits)) throw new Error('Hábitos anteriores inválidos.')
  for (const value of (rawHabits as unknown[] | null) || []) {
    if (!isRecord(value) || !Number.isSafeInteger(value.id) || typeof value.title !== 'string' || typeof value.category !== 'string') throw new Error('Hábito anterior inválido.')
    const dates = Array.isArray(value.dates) ? value.dates : value.completed ? [dateKey()] : []
    if (!dates.every(isDateKey)) throw new Error('Datas anteriores inválidas.')
    const createdAt = isDateKey(value.createdAt) ? value.createdAt : [...dates, dateKey()].sort()[0]
    next.habits.push({ id: Number(value.id), title: value.title, category: value.category, description: typeof value.description === 'string' ? value.description : '', weeklyGoal: typeof value.weeklyGoal === 'number' ? value.weeklyGoal : 7, createdAt })
    next.completions.push(...dates.map(date => ({ id: `${value.id}:${date}`, habitId: Number(value.id), date, status: 'completed' as const })))
  }
  next.settings.compact = readLegacy('compact') === true
  const validated = validateData(next)
  if (account || rawHabits || next.settings.compact) {
    writeStored('data', validated)
    if (validated.user && readLegacy('session') === true) writeStored('session', true)
  }
  return validated
}

let snapshot: StreakFlowState | undefined
const listeners = new Set<() => void>()

export function getState(): StreakFlowState {
  if (snapshot) return snapshot
  try {
    const stored = readStored('data')
    const data = stored === null ? migrateLegacy() : validateData(stored)
    snapshot = { ...data, authenticated: !!data.user && hasStoredSession(), storageError: null }
  } catch {
    snapshot = { ...emptyData(), authenticated: false, storageError: 'Não foi possível carregar os dados locais. O armazenamento pode estar bloqueado ou conter dados inválidos. Os dados originais foram preservados; verifique o navegador e tente novamente.' }
  }
  return snapshot
}

function publish(next: StreakFlowState) {
  snapshot = next
  listeners.forEach(listener => listener())
}

export function refreshState() {
  snapshot = undefined
  const next = getState()
  publish(next)
}

function onStorage(event: StorageEvent) {
  if (event.key === null || event.key === STORAGE_KEYS.data || event.key === STORAGE_KEYS.session) refreshState()
}

export function subscribe(listener: () => void) {
  listeners.add(listener)
  if (listeners.size === 1) window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) window.removeEventListener('storage', onStorage)
  }
}

function writableState() {
  const current = getState()
  if (current.storageError) throw new Error(current.storageError)
  return current
}

function commit(data: StreakFlowData) {
  const current = writableState()
  const next = validateData(data)
  writeStored('data', next)
  publish({ ...next, authenticated: current.authenticated, storageError: null })
}

export function validateProfile(profile: Profile): Profile {
  const name = profile.name.trim()
  const email = profile.email.trim().toLowerCase()
  if (name.length < 3 || name.length > 80) throw new Error('O nome deve possuir entre 3 e 80 caracteres.')
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Digite um e-mail válido.')
  return { name, email }
}

export function getUser() { return writableState().user }

export function createUser(user: User) {
  const current = writableState()
  if (current.user) throw new Error('Já existe uma conta neste navegador. Entre com seu cadastro existente.')
  // Cadastro não faz login nem herda uma marca de sessão sem conta associada.
  removeSession()
  commit({ ...current, user: { ...user, profile: validateProfile(user.profile), joinedAt: dateKey() } })
}

export function updateProfile(profile: Profile) {
  const current = writableState()
  if (!current.user || !current.authenticated) throw new Error('Entre na sua conta para editar o perfil.')
  commit({ ...current, user: { ...current.user, profile: validateProfile(profile) } })
}

export function startSession() {
  const current = writableState()
  if (!current.user) throw new Error('Crie uma conta antes de entrar.')
  writeStored('session', true)
  publish({ ...current, authenticated: true })
}

export function endSession() {
  removeSession()
  publish({ ...getState(), authenticated: false })
}

function authenticatedState() {
  const current = writableState()
  if (!current.authenticated) throw new Error('Entre na sua conta para continuar.')
  return current
}

export function saveHabit(input: HabitInput, id?: number) {
  const current = authenticatedState()
  const title = input.title.trim()
  const description = input.description.trim()
  if (!title || title.length > 100) throw new Error('Informe um nome de até 100 caracteres para o hábito.')
  if (description.length > 500) throw new Error('A descrição deve ter até 500 caracteres.')
  if (!Number.isInteger(input.weeklyGoal) || input.weeklyGoal < 1 || input.weeklyGoal > 7) throw new Error('A meta semanal deve ser de 1 a 7 dias.')
  if (input.estimatedMinutes !== undefined && !validMinutes(input.estimatedMinutes)) throw new Error('A duração estimada deve ser de 1 a 1440 minutos.')
  const existing = current.habits.find(h => h.id === id)
  if (id !== undefined && !existing) throw new Error('Este hábito não foi encontrado.')
  const tracking = getTracking({ ...existing, ...input })
  validateTracking(tracking)
  const habit: Habit = { ...existing, ...input, ...tracking, target: tracking.target, unit: tracking.unit, title, description, category: input.category.trim() || 'Outros', id: existing?.id ?? Math.max(Date.now(), ...current.habits.map(h => h.id + 1)), createdAt: existing?.createdAt ?? dateKey() }
  commit({ ...current, habits: existing ? current.habits.map(h => h.id === id ? habit : h) : [...current.habits, habit] })
  return habit
}

export function deleteHabit(id: number) {
  const current = authenticatedState()
  commit({ ...current, habits: current.habits.filter(h => h.id !== id), completions: current.completions.filter(c => c.habitId !== id) })
}

function validateCheckIn(input: Record<string, unknown>) {
  if (!['pending', 'completed', 'partial', 'postponed', 'planned_rest', 'skipped'].includes(String(input.status))) throw new Error('Escolha um status válido.')
  if (input.time !== undefined && (typeof input.time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(input.time))) throw new Error('Informe um horário válido.')
  if (input.effort !== undefined && (!Number.isInteger(input.effort) || Number(input.effort) < 1 || Number(input.effort) > 5)) throw new Error('Escolha um esforço de 1 a 5.')
  if (input.durationMinutes !== undefined && !validMinutes(input.durationMinutes)) throw new Error('A duração deve ser de 1 a 1440 minutos.')
  if (input.note !== undefined && (typeof input.note !== 'string' || input.note.length > 500)) throw new Error('A observação deve ter até 500 caracteres.')
  if (input.intensity !== undefined && !['light', 'moderate', 'intense'].includes(String(input.intensity))) throw new Error('Escolha uma intensidade válida.')
  if (input.value !== undefined) validateValue(input.value)
  if (input.tracking !== undefined) {
    if (!isRecord(input.tracking)) throw new Error('A configuração do registro é inválida.')
    const tracking = input.tracking as unknown as NonNullable<Completion['tracking']>
    validateTracking(tracking)
    if (isNumericTracking(tracking)) {
      validateValue(input.value)
      calculateProgressPercentage(input.value, tracking.target!)
      if (getCheckInStatus(tracking, input.value, input.status as Completion['status']) !== input.status) throw new Error('O status não corresponde ao progresso registrado.')
    }
  }
  if (input.status === 'planned_rest' && (!isRecord(input.tracking) || input.tracking.allowPlannedRest !== true)) throw new Error('Este registro não permite descanso planejado.')
}

// Um único check-in por hábito/data. Editar preserva o identificador.
export function saveCheckIn(input: CheckInInput) {
  const current = authenticatedState()
  const habit = current.habits.find(h => h.id === input.habitId)
  if (!habit) throw new Error('Este hábito não foi encontrado.')
  if (!isDateKey(input.date) || input.date > dateKey() || input.date < habit.createdAt) throw new Error('A data do check-in é inválida.')
  const existing = current.completions.find(c => c.habitId === input.habitId && c.date === input.date)
  const tracking = getTracking(habit, existing)
  validateTracking(tracking)
  const value = isNumericTracking(tracking) ? input.value ?? existing?.value ?? 0 : input.value
  const status = getCheckInStatus(tracking, value ?? 0, input.status)
  const record: Completion = { ...input, tracking: { ...tracking }, value, status, id: `${input.habitId}:${input.date}`, note: input.note?.trim() || undefined }
  validateCheckIn(record)
  commit({ ...current, completions: [...current.completions.filter(c => c.id !== record.id), record] })
  return record
}

export function getTodayCheckIn(habitId: number, date = dateKey()) {
  return getState().completions.find(c => c.habitId === habitId && c.date === date)
}

// As ações rápidas leem o estado atual no clique; não acumulam sobre uma cópia do componente.
export function addProgress(habitId: number, delta: number, date = dateKey()) {
  const current = authenticatedState()
  const habit = current.habits.find(h => h.id === habitId)
  if (!habit) throw new Error('Este hábito não foi encontrado.')
  const existing = getTodayCheckIn(habitId, date)
  const tracking = getTracking(habit, existing)
  if (!isNumericTracking(tracking)) throw new Error('Este hábito não usa progresso numérico.')
  const now = new Date()
  return saveCheckIn({ ...existing, habitId, date, time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`, value: addValues(existing?.value ?? 0, delta), status: 'pending' })
}

export function completeCheckIn(habitId: number, date = dateKey()) {
  const current = authenticatedState()
  const habit = current.habits.find(h => h.id === habitId)
  if (!habit) throw new Error('Este hábito não foi encontrado.')
  const existing = getTodayCheckIn(habitId, date)
  const tracking = getTracking(habit, existing)
  const now = new Date()
  return saveCheckIn({ ...existing, habitId, date, time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`, status: 'completed', value: isNumericTracking(tracking) ? Math.max(existing?.value ?? 0, tracking.target!) : undefined })
}

export function removeCheckIn(id: string) {
  const current = authenticatedState()
  commit({ ...current, completions: current.completions.filter(c => c.id !== id) })
}

// Compatibilidade para clientes antigos. A interface usa o formulário de check-in.
export function setCompletion(id: number, completed: boolean, date = dateKey()) {
  if (completed) {
    completeCheckIn(id, date)
  } else removeCheckIn(`${id}:${date}`)
}

export function toggleCompletion(id: number) {
  const today = dateKey()
  setCompletion(id, !getState().completions.some(c => c.habitId === id && c.date === today && c.status === 'completed'), today)
}

export function saveSettings(settings: Settings) {
  if (!isSettings(settings)) throw new Error('Verifique as preferências selecionadas.')
  commit({ ...authenticatedState(), settings: { ...settings } })
}

// Parcial/ignorado não sustentam sequência: são dias sem conclusão, assim como um dia sem registro.
export function habitDates(completions: Completion[], habitId: number) {
  return completions.filter(c => c.habitId === habitId && c.status === 'completed').map(c => c.date)
}

export function getIndicators(data: Pick<StreakFlowData, 'habits' | 'completions'>, today = new Date()) {
  const byHabit = new Map<number, Completion[]>()
  const completedToday = new Set<number>()
  const restingToday = new Set<number>()
  const day = dateKey(today)
  for (const record of data.completions) {
    const list = byHabit.get(record.habitId) ?? []
    list.push(record)
    byHabit.set(record.habitId, list)
    if (record.date === day && record.status === 'completed') completedToday.add(record.habitId)
    if (record.date === day && isPlannedRest(record)) restingToday.add(record.habitId)
  }
  const completed = data.habits.filter(h => completedToday.has(h.id)).length
  const sequences = data.habits.map(h => getHabitStreaks(byHabit.get(h.id) ?? [], h.id, today))
  const rest = data.habits.filter(h => restingToday.has(h.id)).length
  const scheduled = data.habits.length - rest
  const evaluated = data.completions.filter(c => !isPlannedRest(c))
  return {
    completed,
    scheduled,
    rest,
    progress: scheduled ? Math.round(completed / scheduled * 100) : 0,
    currentStreak: Math.max(0, ...sequences.map(s => s.current)),
    bestStreak: Math.max(0, ...sequences.map(s => s.best)),
    total: data.completions.filter(c => c.status === 'completed').length,
    checkIns: data.completions.length,
    completionRate: evaluated.length ? Math.round(evaluated.filter(c => c.status === 'completed').length / evaluated.length * 100) : null,
  }
}

export function weeklyProgress(habit: Habit, completions: Completion[], settings: Settings, today = new Date()) {
  const week = new Set(weekDays(settings.firstDayOfWeek, today))
  const count = habitDates(completions, habit.id).filter(day => week.has(day) && day <= dateKey(today)).length
  return { count, percent: Math.min(100, Math.round(count / habit.weeklyGoal * 100)) }
}

export function exportData() {
  const { user, habits, completions, settings } = writableState()
  return { version: 3, exportedAt: new Date().toISOString(), profile: user?.profile, joinedAt: user?.joinedAt, habits, completions, settings }
}
