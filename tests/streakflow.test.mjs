import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { webcrypto } from 'node:crypto'
import vm from 'node:vm'
import ts from 'typescript'

function app(initial = []) {
  const data = new Map(initial)
  let blocked = false
  const localStorage = {
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => { if (blocked) throw new Error('quota'); data.set(key, value) },
    removeItem: key => { if (blocked) throw new Error('blocked'); data.delete(key) },
  }
  const modules = new Map()
  function load(name) {
    if (modules.has(name)) return modules.get(name)
    const source = readFileSync(new URL(`../src/lib/${name}.ts`, import.meta.url), 'utf8')
    const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
    const context = { exports: {}, localStorage, sessionStorage: { getItem: () => null }, crypto: webcrypto, TextEncoder, require: path => load(path.slice(2)) }
    vm.runInNewContext(compiled, context)
    modules.set(name, context.exports)
    return context.exports
  }
  return { store: load('streakflow'), auth: load('auth'), dates: load('habits'), insights: load('insights'), data, block: () => { blocked = true } }
}

const profile = { name: 'Pessoa Teste', email: 'teste@example.com' }
const input = { title: 'Ler', description: '20 minutos', category: 'Estudos', weeklyGoal: 3 }

test('cadastro, login, hábitos, indicadores, perfil, preferências e logout persistem', async () => {
  const { store, auth, data } = app()
  assert.equal(store.getState().authenticated, false)
  assert.throws(() => store.saveHabit(input), /Entre/)
  await auth.registerAccount(profile, 'teste123')
  assert.equal(store.getState().authenticated, false)
  assert.equal(await auth.validateAccount(profile.email, 'errada'), null)
  assert.equal(await auth.validateAccount('ausente@example.com', 'teste123'), null)
  assert.ok(await auth.validateAccount(' TESTE@example.com ', 'teste123'))
  await assert.rejects(auth.registerAccount(profile, 'teste123'), /Já existe/)
  store.startSession()
  const habit = store.saveHabit(input)
  store.setCompletion(habit.id, true)
  store.setCompletion(habit.id, true)
  assert.equal(store.getState().completions.length, 1)
  const indicators = store.getIndicators(store.getState())
  assert.equal(indicators.completed, 1)
  assert.equal(indicators.progress, 100)
  assert.equal(indicators.currentStreak, 1)
  assert.equal(indicators.bestStreak, 1)
  assert.equal(store.weeklyProgress(habit, store.getState().completions, store.getState().settings).count, 1)
  store.saveHabit({ ...input, title: 'Ler um livro' }, habit.id)
  assert.equal(store.getState().habits[0].title, 'Ler um livro')
  assert.equal(store.getState().completions.length, 1)
  store.toggleCompletion(habit.id)
  assert.equal(store.getIndicators(store.getState()).total, 0)
  store.toggleCompletion(habit.id)
  store.updateProfile({ name: 'Nome Atualizado', email: 'novo@example.com' })
  assert.ok(await auth.validateAccount('novo@example.com', 'teste123'))
  assert.equal(await auth.validateAccount(profile.email, 'teste123'), null)
  store.saveSettings({ compact: true, habitReminders: true, weeklySummary: true, firstDayOfWeek: 0 })
  const refreshed = app(data).store.getState()
  assert.equal(refreshed.authenticated, true)
  assert.equal(refreshed.user.profile.name, 'Nome Atualizado')
  assert.equal(refreshed.settings.firstDayOfWeek, 0)
  assert.equal(refreshed.settings.habitReminders, true)
  assert.equal(refreshed.habits.length, 1)
  assert.equal(refreshed.completions.length, 1)
  assert.equal(JSON.stringify(store.exportData()).includes('verifier'), false)
  store.endSession()
  assert.equal(app(data).store.getState().authenticated, false)
  assert.equal(store.getState().habits.length, 1)
  assert.throws(() => store.toggleCompletion(habit.id), /Entre/)
  store.startSession()
  store.deleteHabit(habit.id)
  assert.equal(store.getState().habits.length, 0)
  assert.equal(store.getState().completions.length, 0)
})

test('validação rejeita dados inválidos e falha de gravação preserva o estado', async () => {
  const { store, auth, block, data } = app()
  await assert.rejects(auth.registerAccount({ ...profile, name: 'Ab' }, 'teste123'), /nome/)
  await assert.rejects(auth.registerAccount({ ...profile, email: 'invalido' }, 'teste123'), /e-mail/)
  await assert.rejects(auth.registerAccount(profile, '123'), /senha/)
  await auth.registerAccount(profile, 'teste123')
  store.startSession()
  assert.throws(() => store.saveHabit({ ...input, title: ' ' }), /nome/)
  assert.throws(() => store.saveHabit({ ...input, weeklyGoal: 8 }), /meta/)
  const habit = store.saveHabit(input)
  assert.throws(() => store.setCompletion(habit.id, true, '2099-01-01'), /data/)
  assert.throws(() => store.setCompletion(habit.id, true, '2026-02-30'), /data/)
  assert.throws(() => store.setCompletion(habit.id, true, '2000-01-01'), /data/)
  const before = data.get('streakflow_data')
  block()
  assert.throws(() => store.saveHabit({ ...input, title: 'Outro' }), /salvar/)
  assert.equal(store.getState().habits.length, 1)
  assert.equal(data.get('streakflow_data'), before)
})

test('dados corrompidos são preservados e impedem sobrescrita', () => {
  const { store, data } = app([['streakflow_data', '{invalido']])
  assert.ok(store.getState().storageError)
  assert.throws(() => store.saveHabit(input), /carregar/)
  assert.equal(data.get('streakflow_data'), '{invalido')
})

test('recordes e metas semanais respeitam datas locais e início da semana', () => {
  const { dates } = app()
  assert.equal(dates.longestStreak(['2025-12-31', '2026-01-01', '2026-01-02', '2026-01-02', '2026-01-04']), 3)
  assert.equal(dates.weekDays(0, new Date(2026, 8, 20))[0], '2026-09-20')
  assert.equal(dates.weekDays(1, new Date(2026, 8, 20))[0], '2026-09-14')
})

test('check-in completo, parcial e ignorado recalculam as páginas sem duplicar registros', async () => {
  const { store, auth, dates, data } = app()
  await auth.registerAccount(profile, 'teste123')
  store.startSession()
  const habit = store.saveHabit({ ...input, estimatedMinutes: 45, color: 'indigo' })
  const record = store.saveCheckIn({ habitId: habit.id, date: dates.dateKey(), time: '20:30', status: 'completed', effort: 3, durationMinutes: 45, note: 'Revisei React Router e TypeScript.' })
  assert.equal(store.getState().habits[0].estimatedMinutes, 45)
  assert.equal(store.getState().user.joinedAt, dates.dateKey())
  let indicators = store.getIndicators(store.getState())
  assert.equal(indicators.completed, 1)
  assert.equal(indicators.checkIns, 1)
  assert.equal(indicators.completionRate, 100)
  assert.equal(indicators.currentStreak, 1)
  let persisted = app(data).store.getState()
  assert.equal(persisted.completions[0].time, '20:30')
  assert.equal(persisted.completions[0].effort, 3)
  assert.equal(persisted.completions[0].durationMinutes, 45)
  assert.equal(persisted.completions[0].note, 'Revisei React Router e TypeScript.')
  store.saveCheckIn({ ...record, status: 'partial', effort: 4, durationMinutes: 20, note: 'Ainda falta revisar os hooks.' })
  indicators = store.getIndicators(store.getState())
  assert.equal(store.getState().completions.length, 1)
  assert.equal(store.getState().completions[0].id, record.id)
  assert.equal(indicators.completed, 0)
  assert.equal(indicators.currentStreak, 0)
  assert.equal(indicators.completionRate, 0)
  assert.equal(store.weeklyProgress(habit, store.getState().completions, store.getState().settings).count, 0)
  store.saveCheckIn({ ...record, status: 'skipped' })
  assert.equal(store.getIndicators(store.getState()).total, 0)
  store.saveCheckIn({ ...record, status: 'completed' })
  assert.equal(store.getIndicators(store.getState()).currentStreak, 1)
  store.saveSettings({ ...store.DEFAULT_SETTINGS, theme: 'dark', compact: true })
  persisted = app(data).store.getState()
  assert.equal(persisted.settings.theme, 'dark')
  assert.equal(persisted.settings.compact, true)
  store.removeCheckIn(record.id)
  assert.equal(store.getState().completions.length, 0)
  assert.equal(store.getIndicators(store.getState()).completionRate, null)
})

test('migração v2 preserva conta e datas sem inventar horário, esforço ou entrada', () => {
  const legacy = {
    version: 2,
    user: { profile, salt: Array(16).fill(1), verifier: 'a'.repeat(64) },
    habits: [{ ...input, id: 1, createdAt: '2026-01-01' }],
    completions: [{ habitId: 1, date: '2026-01-02' }, { habitId: 1, date: '2026-01-02' }],
    settings: { compact: false, habitReminders: true, weeklySummary: false, firstDayOfWeek: 1 },
  }
  const { store, data } = app([['streakflow_data', JSON.stringify(legacy)], ['streakflow_logged', 'true']])
  const state = store.getState()
  assert.equal(state.storageError, null)
  assert.equal(state.version, 3)
  assert.equal(state.authenticated, true)
  assert.equal(state.completions.length, 1)
  assert.equal(state.completions[0].id, '1:2026-01-02')
  assert.equal(state.completions[0].status, 'completed')
  assert.equal(state.completions[0].time, undefined)
  assert.equal(state.completions[0].effort, undefined)
  assert.equal(state.user.joinedAt, undefined)
  assert.equal(state.settings.theme, 'system')
  assert.equal(state.settings.habitReminders, true)
  assert.equal(data.get('streakflow_data'), JSON.stringify(legacy))
  store.saveCheckIn({ ...state.completions[0], time: '10:20', note: 'Registro revisado' })
  const refreshed = app(data).store.getState()
  assert.equal(refreshed.version, 3)
  assert.equal(refreshed.completions.length, 1)
  assert.equal(refreshed.completions[0].note, 'Registro revisado')
  assert.equal(refreshed.user.verifier, legacy.user.verifier)
})

test('valida status, esforço, duração, nota e horário antes de persistir', async () => {
  const { store, auth, dates, block } = app()
  await auth.registerAccount(profile, 'teste123')
  store.startSession()
  const habit = store.saveHabit(input)
  const record = { habitId: habit.id, date: dates.dateKey(), status: 'completed' }
  for (const invalid of [{ status: 'other' }, { effort: 0 }, { effort: 6 }, { effort: 2.5 }, { durationMinutes: -1 }, { durationMinutes: 1441 }, { durationMinutes: 1.5 }, { time: '25:00' }, { time: '12:61' }, { note: 'x'.repeat(501) }]) {
    assert.throws(() => store.saveCheckIn({ ...record, ...invalid }))
    assert.equal(store.getState().completions.length, 0)
  }
  assert.throws(() => store.saveHabit({ ...input, color: 'red' }))
  assert.throws(() => store.saveHabit({ ...input, estimatedMinutes: -10 }))
  assert.throws(() => store.saveSettings({ ...store.DEFAULT_SETTINGS, theme: 'invalid' }))
  const saved = store.saveCheckIn({ ...record, effort: 5, durationMinutes: 1440, note: 'x'.repeat(500), time: '23:59' })
  block()
  assert.throws(() => store.saveCheckIn({ ...saved, status: 'partial' }), /salvar/)
  assert.throws(() => store.removeCheckIn(saved.id), /salvar/)
  assert.equal(store.getState().completions[0].status, 'completed')
})

test('insights exigem período suficiente e evitam ranking arbitrário em empates', () => {
  const { insights } = app()
  const habits = [{ ...input, id: 1, title: 'Ler', createdAt: '2026-09-01' }, { ...input, id: 2, title: 'Estudar', createdAt: '2026-09-01' }]
  const complete = (habitId, date) => ({ id: `${habitId}:${date}`, habitId, date, status: 'completed' })
  const now = new Date(2026, 8, 22)
  assert.equal(insights.getInsights(habits, [], now).mostConsistent, null)
  assert.equal(insights.getInsights(habits, [], now).messages.length, 0)
  const records = [complete(1, '2026-09-10'), complete(1, '2026-09-20'), complete(1, '2026-09-21')]
  const result = insights.getInsights(habits, records, now)
  assert.equal(result.mostConsistent.habit.id, 1)
  assert.ok(result.messages.some(message => message.includes('100% mais')))
  const tie = insights.getInsights(habits, [complete(1, '2026-09-20'), complete(2, '2026-09-20')], now)
  assert.equal(tie.mostConsistent, null)
  const recentHabit = [{ ...habits[0], createdAt: '2026-09-22' }]
  assert.equal(insights.getInsights(recentHabit, [complete(1, '2026-09-22')], now).mostConsistent, null)
})
