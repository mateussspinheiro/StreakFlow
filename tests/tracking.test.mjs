import { test } from 'node:test'
import assert from 'node:assert/strict'
import { app } from './helpers/store.mjs'

// Cada arquivo roda em seu próprio processo no node:test. À noite no Brasil, UTC já é amanhã.
process.env.TZ = 'America/Sao_Paulo'

class LocalClock extends Date {
  constructor(...args) { super(...(args.length ? args : [2026, 8, 22, 23, 45])) }
  static now() { return new LocalClock().getTime() }
}
const input = { title: 'Água', category: 'Saúde', description: '', weeklyGoal: 7 }
function setup(extra = {}) {
  const fixture = app([], LocalClock)
  fixture.store.createUser({ profile: { name: 'Teste local', email: 'teste@example.com' }, salt: Array(16).fill(1), verifier: 'a'.repeat(64) })
  fixture.store.startSession()
  const habit = fixture.store.saveHabit({ ...input, ...extra })
  return { ...fixture, habit }
}
const numeric = { trackingType: 'quantity', target: 2500, unit: 'ml' }

test('binário: conclusão rápida preserva o comportamento anterior', () => {
  const { store, habit } = setup()
  const record = store.completeCheckIn(habit.id)
  assert.equal(record.status, 'completed')
  assert.equal(record.tracking.trackingType, 'binary')
  assert.equal(store.getIndicators(store.getState(), new LocalClock()).currentStreak, 1)
})

test('quantidade: dia sem check-in começa em zero e registra pendente', () => {
  const { store, habit, tracking } = setup(numeric)
  assert.equal(store.getTodayCheckIn(habit.id), undefined)
  const initial = tracking.calculateProgressPercentage(0, habit.target)
  assert.equal(initial.percentage, 0)
  const record = store.saveCheckIn({ habitId: habit.id, date: '2026-09-22', status: 'pending', value: 0 })
  assert.equal(record.status, 'pending')
  assert.equal(record.value, 0)
})

test('quantidade: soma parcial produz 1500 / 2500 e 60%', () => {
  const { store, habit, tracking } = setup(numeric)
  store.addProgress(habit.id, 500)
  store.addProgress(habit.id, 500)
  const record = store.addProgress(habit.id, 500)
  assert.equal(record.value, 1500)
  assert.equal(record.status, 'partial')
  assert.equal(tracking.calculateProgressPercentage(record.value, record.tracking.target).visualPercentage, 60)
  assert.equal(store.getState().completions.length, 1)
})

test('atingir e superar a meta conclui sem perder valor excedente', () => {
  const { store, habit, tracking } = setup(numeric)
  assert.equal(store.addProgress(habit.id, 2500).status, 'completed')
  const record = store.addProgress(habit.id, 500)
  assert.equal(record.status, 'completed')
  assert.equal(record.value, 3000)
  const progress = tracking.calculateProgressPercentage(record.value, 2500)
  assert.equal(progress.percentage, 120)
  assert.equal(progress.visualPercentage, 100)
  assert.equal(store.completeCheckIn(habit.id).value, 3000)
})

test('entrada manual substitui o total e recalcula o status sem duplicar', () => {
  const { store, habit } = setup(numeric)
  store.completeCheckIn(habit.id)
  const record = store.saveCheckIn({ habitId: habit.id, date: '2026-09-22', value: 750, status: 'completed' })
  assert.equal(record.status, 'partial')
  assert.equal(store.getState().completions.length, 1)
  assert.equal(store.getIndicators(store.getState(), new LocalClock()).completed, 0)
  assert.equal(store.saveCheckIn({ ...record, value: 0 }).status, 'pending')
})

test('valores negativos, NaN, infinito e metas inválidas não são persistidos', () => {
  const { store, habit, data } = setup(numeric)
  const before = data.get('streakflow_data')
  for (const value of [-1, NaN, Infinity, 1e20]) {
    assert.throws(() => store.addProgress(habit.id, value))
    assert.throws(() => store.saveCheckIn({ habitId: habit.id, date: '2026-09-22', status: 'partial', value }))
  }
  for (const target of [0, -1, NaN, Infinity]) assert.throws(() => store.saveHabit({ ...input, ...numeric, target }))
  assert.throws(() => store.saveHabit({ ...input, ...numeric, unit: '' }))
  assert.throws(() => store.saveHabit({ ...input, trackingType: 'invalid' }))
  assert.throws(() => store.saveCheckIn({ habitId: habit.id, date: '2026-09-22', value: 20, status: 'invalid' }))
  assert.equal(data.get('streakflow_data'), before)
})

test('hábitos e check-ins v3 antigos continuam binários e editáveis', () => {
  const legacy = { version: 3, user: { profile: { name: 'Teste', email: 'teste@example.com' }, salt: Array(16).fill(1), verifier: 'b'.repeat(64) }, habits: [{ ...input, id: 1, createdAt: '2026-09-01' }], completions: [{ id: '1:2026-09-21', habitId: 1, date: '2026-09-21', status: 'completed', note: 'Anterior' }], settings: { compact: false, habitReminders: false, weeklySummary: false, firstDayOfWeek: 1, theme: 'system' } }
  const { store, tracking } = app([['streakflow_data', JSON.stringify(legacy)], ['streakflow_logged', 'true']], LocalClock)
  assert.equal(store.getState().storageError, null)
  assert.equal(tracking.getTracking(store.getState().habits[0]).trackingType, 'binary')
  assert.equal(store.completeCheckIn(1).status, 'completed')
  assert.equal(store.getIndicators(store.getState(), new LocalClock()).currentStreak, 2)
  const old = store.saveCheckIn({ ...store.getState().completions[0], note: 'Revisado' })
  assert.equal(old.tracking.trackingType, 'binary')
  assert.equal(old.note, 'Revisado')
})

test('check-in noturno usa calendário local e um ID estável por dia', () => {
  const { store, habit } = setup(numeric)
  const record = store.addProgress(habit.id, 250)
  assert.ok(new LocalClock().toISOString().startsWith('2026-09-23'))
  assert.equal(record.date, '2026-09-22')
  assert.equal(record.time, '23:45')
  assert.equal(record.id, `${habit.id}:2026-09-22`)
  assert.equal(store.addProgress(habit.id, 250).id, record.id)
})

test('descanso planejado autorizado persiste e não conta como conclusão', () => {
  const { store, habit, data } = setup({ trackingType: 'qualitative', allowPlannedRest: true })
  const record = store.saveCheckIn({ habitId: habit.id, date: '2026-09-22', status: 'planned_rest', note: 'Recuperação' })
  const refreshed = app(data, LocalClock).store.getState()
  assert.equal(refreshed.completions[0].status, 'planned_rest')
  assert.equal(refreshed.completions[0].tracking.allowPlannedRest, true)
  assert.equal(record.note, 'Recuperação')
  const indicators = store.getIndicators(refreshed, new LocalClock())
  assert.equal(indicators.total, 0)
  assert.equal(indicators.scheduled, 0)
  assert.equal(indicators.rest, 1)
  assert.equal(indicators.completionRate, null)
  const other = store.saveHabit(input)
  assert.throws(() => store.saveCheckIn({ habitId: other.id, date: '2026-09-22', status: 'planned_rest' }), /descanso/)
})

test('descanso conecta conclusões, não aumenta streak e não preenche lacunas', () => {
  const { consistency } = setup()
  const completed = date => ({ habitId: 1, date, status: 'completed' })
  const rest = date => ({ habitId: 1, date, status: 'planned_rest', tracking: { trackingType: 'qualitative', allowPlannedRest: true } })
  let result = consistency.getHabitStreaks([completed('2026-09-20'), rest('2026-09-21'), completed('2026-09-22')], 1, new LocalClock())
  assert.equal(result.current, 2)
  assert.equal(result.best, 2)
  result = consistency.getHabitStreaks([completed('2026-09-19'), rest('2026-09-21'), completed('2026-09-22')], 1, new LocalClock())
  assert.equal(result.current, 1)
  assert.equal(consistency.getHabitStreaks([rest('2026-09-22')], 1, new LocalClock()).current, 0)
  assert.equal(consistency.getHabitStreaks([completed('2026-09-20'), rest('2026-09-21'), rest('2026-09-22')], 1, new LocalClock()).current, 1)
  for (const status of ['pending', 'partial', 'postponed', 'skipped']) {
    assert.equal(consistency.getHabitStreaks([completed('2026-09-20'), { habitId: 1, date: '2026-09-21', status }, completed('2026-09-22')], 1, new LocalClock()).current, 1)
  }
})

test('edição da meta e unidade preserva histórico e acompanhamento do dia', () => {
  const { store, habit, data } = setup(numeric)
  const original = store.addProgress(habit.id, 500)
  store.saveHabit({ ...input, trackingType: 'quantity', target: 3, unit: 'L', title: 'Hidratação' }, habit.id)
  let edited = store.getState().habits[0]
  assert.equal(edited.id, habit.id)
  assert.equal(edited.createdAt, habit.createdAt)
  assert.equal(edited.target, 3)
  assert.equal(store.getState().completions[0].tracking.target, 2500)
  assert.equal(store.addProgress(habit.id, 250).tracking.unit, 'ml')
  assert.equal(store.getTodayCheckIn(habit.id).value, 750)
  class Tomorrow extends LocalClock {
    constructor(...args) { super(...(args.length ? args : [2026, 8, 23, 10, 0])) }
  }
  const nextDay = app(data, Tomorrow).store
  const nextRecord = nextDay.addProgress(habit.id, 0.5)
  assert.equal(nextRecord.date, '2026-09-23')
  assert.equal(nextRecord.tracking.target, 3)
  assert.equal(nextRecord.tracking.unit, 'L')
  store.saveHabit({ ...input, trackingType: 'binary' }, habit.id)
  edited = store.getState().habits[0]
  assert.equal(edited.target, undefined)
  assert.equal(store.getTodayCheckIn(habit.id).id, original.id)
  assert.equal(app(data, LocalClock).store.getTodayCheckIn(habit.id).tracking.target, 2500)
})

test('descanso é neutro no ranking de consistência e nas taxas do dashboard', () => {
  const { insights, store } = setup()
  const habits = [{ ...input, id: 1, createdAt: '2026-09-01' }, { ...input, id: 2, createdAt: '2026-09-01' }]
  const records = [
    ...['16', '17', '18', '19'].map(day => ({ habitId: 1, date: `2026-09-${day}`, status: 'completed' })),
    ...['20', '21', '22'].map(day => ({ habitId: 1, date: `2026-09-${day}`, status: 'planned_rest', tracking: { trackingType: 'qualitative', allowPlannedRest: true } })),
    ...['16', '17', '18', '19', '20', '22'].map(day => ({ habitId: 2, date: `2026-09-${day}`, status: 'completed' })),
  ]
  assert.equal(insights.getInsights(habits, records, new LocalClock()).mostConsistent.habit.id, 1)
  const indicators = store.getIndicators({ habits, completions: records }, new LocalClock())
  assert.equal(indicators.progress, 100)
  assert.equal(indicators.completed, 1)
  assert.equal(indicators.scheduled, 1)
  assert.equal(indicators.completionRate, 100)
})

test('registro numérico inconsistente no armazenamento não é sobrescrito', () => {
  const { store, habit, data } = setup(numeric)
  store.addProgress(habit.id, 500)
  const raw = JSON.parse(data.get('streakflow_data'))
  raw.completions[0].status = 'completed'
  const invalid = JSON.stringify(raw)
  data.set('streakflow_data', invalid)
  const reloaded = app(data, LocalClock)
  assert.ok(reloaded.store.getState().storageError)
  assert.equal(reloaded.data.get('streakflow_data'), invalid)
})

test('unidade L converte atalhos e preserva precisão decimal', () => {
  const { store, habit, tracking } = setup({ ...numeric, unit: 'L', target: 2.5 })
  const steps = tracking.getQuickSteps(tracking.getTracking(habit))
  assert.equal(steps[0].value, 0.25)
  assert.equal(steps[1].value, 0.5)
  store.addProgress(habit.id, steps[1].value)
  store.addProgress(habit.id, steps[1].value)
  const record = store.addProgress(habit.id, steps[1].value)
  assert.equal(record.value, 1.5)
  assert.equal(tracking.calculateProgressPercentage(record.value, 2.5).percentage, 60)
  assert.equal(tracking.addValues(0.1, 0.2), 0.3)
})

test('duração reutiliza progresso numérico com atalhos de 15 e 30 minutos', () => {
  const { store, habit, tracking } = setup({ trackingType: 'duration', target: 60 })
  assert.equal(habit.unit, 'min')
  const steps = tracking.getQuickSteps(tracking.getTracking(habit))
  store.addProgress(habit.id, steps[0].value)
  const record = store.addProgress(habit.id, steps[1].value)
  assert.equal(record.value, 45)
  assert.equal(record.status, 'partial')
  assert.equal(tracking.calculateProgressPercentage(record.value, 60).percentage, 75)
  assert.equal(store.completeCheckIn(habit.id).value, 60)
})

test('qualitativo aceita duração, intensidade e nota opcionais', () => {
  const { store, habit } = setup({ trackingType: 'qualitative' })
  const record = store.saveCheckIn({ habitId: habit.id, date: '2026-09-22', status: 'completed', durationMinutes: 52, intensity: 'moderate', note: 'Treino realizado' })
  assert.equal(record.durationMinutes, 52)
  assert.equal(record.intensity, 'moderate')
  assert.equal(store.saveCheckIn({ ...record, status: 'postponed' }).status, 'postponed')
  assert.throws(() => store.saveCheckIn({ ...record, intensity: 'invalid' }))
})

test('falha de armazenamento preserva o valor anterior; logout impede atalhos', () => {
  const { store, habit, block } = setup(numeric)
  store.addProgress(habit.id, 500)
  block()
  assert.throws(() => store.addProgress(habit.id, 250), /salvar/)
  assert.equal(store.getTodayCheckIn(habit.id).value, 500)
  const second = setup(numeric)
  second.store.endSession()
  assert.throws(() => second.store.addProgress(second.habit.id, 500), /Entre/)
  assert.throws(() => second.store.completeCheckIn(second.habit.id), /Entre/)
})

test('auditoria: progresso parcial e conclusão sobrevivem a duas recargas', () => {
  const initial = setup(numeric)
  initial.store.addProgress(initial.habit.id, 250)
  initial.store.addProgress(initial.habit.id, 500)
  const reloaded = app(initial.data, LocalClock)
  assert.equal(reloaded.store.getState().storageError, null)
  assert.equal(reloaded.store.getTodayCheckIn(initial.habit.id).value, 750)
  assert.equal(reloaded.store.getTodayCheckIn(initial.habit.id).status, 'partial')
  reloaded.store.completeCheckIn(initial.habit.id)
  const completed = app(reloaded.data, LocalClock).store
  assert.equal(completed.getState().storageError, null)
  assert.equal(completed.getTodayCheckIn(initial.habit.id).value, 2500)
  assert.equal(completed.getTodayCheckIn(initial.habit.id).status, 'completed')
  assert.equal(completed.getState().completions.length, 1)
})

test('auditoria: dia incompleto interrompe a streak após a meia-noite, com ou sem descanso anterior', () => {
  const { consistency } = setup()
  for (const withRest of [false, true]) {
    for (const status of ['pending', 'partial', 'postponed']) {
      const records = [
        { habitId: 1, date: '2026-09-20', status: 'completed' },
        { habitId: 1, date: '2026-09-21', status: withRest ? 'planned_rest' : 'completed', tracking: { trackingType: 'binary', allowPlannedRest: true } },
        { habitId: 1, date: '2026-09-22', status },
      ]
      assert.equal(consistency.getHabitStreaks(records, 1, new LocalClock()).current, withRest ? 1 : 2)
      assert.equal(consistency.getHabitStreaks(records, 1, new Date(2026, 8, 23, 0, 1)).current, 0)
    }
  }
})

test('auditoria: zero, valor ausente e entradas não numéricas não corrompem o armazenamento', () => {
  const { store, habit, data } = setup(numeric)
  const empty = store.saveCheckIn({ habitId: habit.id, date: '2026-09-22', status: 'pending' })
  assert.equal(empty.value, 0)
  assert.equal(empty.status, 'pending')
  store.addProgress(habit.id, 250)
  assert.equal(store.addProgress(habit.id, 0).value, 250)
  const before = data.get('streakflow_data')
  for (const value of ['', 'abc', '250', {}, []]) {
    assert.throws(() => store.addProgress(habit.id, value))
    assert.throws(() => store.saveCheckIn({ ...empty, value }))
    assert.equal(data.get('streakflow_data'), before)
  }
  assert.equal(store.saveCheckIn({ ...empty, value: 0 }).status, 'pending')
  assert.equal(app(data, LocalClock).store.getTodayCheckIn(habit.id).value, 0)
})
