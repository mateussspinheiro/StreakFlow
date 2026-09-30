import { test } from 'node:test'
import assert from 'node:assert/strict'
import { app } from './helpers/store.mjs'

process.env.TZ = 'America/Sao_Paulo'

class LocalClock extends Date {
  constructor(...args) { super(...(args.length ? args : [2026, 8, 22, 23, 45])) }
  static now() { return new LocalClock().getTime() }
}

const { heatmap } = app([], LocalClock)
const date = '2026-09-22'
const record = (status, habitId = 1, day = date, extra = {}) => ({ id: `${habitId}:${day}`, habitId, date: day, status, ...extra })
const plain = value => JSON.parse(JSON.stringify(value))
const habitInput = { title: 'Hábito', category: 'Saúde', description: '', weeklyGoal: 7 }

function setup(clock = LocalClock) {
  const fixture = app([], clock)
  fixture.store.setAuthenticatedUser({ sub: 'test-sub', name: 'Teste', email: 'teste@example.com' })
  return fixture
}

test('heatmap: constrói todos os dias inclusivos e ignora registros fora do intervalo', () => {
  const records = [record('completed', 1, '2026-09-19'), record('partial', 1, '2026-09-21'), record('completed', 1, '2026-09-24')]
  const { days, weeks } = heatmap.buildHeatmapCalendar(records, { start: '2026-09-20', end: '2026-09-23' })
  assert.deepEqual(Array.from(days, day => day.date), ['2026-09-20', '2026-09-21', '2026-09-22', '2026-09-23'])
  assert.deepEqual(Array.from(days, day => day.total), [0, 1, 0, 0])
  assert.equal(weeks.flat().filter(Boolean).length, 4)
  assert.ok(weeks.every(week => week.length === 7))
})

test('heatmap: agrupa pela chave local YYYY-MM-DD e aceita filtro por hábito', () => {
  const records = [record('partial'), record('completed', 2), record('completed', 1, '2026-09-21')]
  const grouped = heatmap.groupCheckInsByDate(records)
  assert.equal(grouped.size, 2)
  assert.equal(grouped.get(date).length, 2)
  assert.equal(grouped.get(date)[0], records[0])
  assert.equal(heatmap.groupCheckInsByDate(records, 2).get(date).length, 1)
  assert.equal(heatmap.groupCheckInsByDate([...records, record('completed', 3, '2026-02-30')]).size, 2)
})

test('heatmap: dia vazio tem estado neutro e taxa ausente', () => {
  const day = heatmap.getDailyHeatmapSummary(date, [record('completed', 1, '2026-09-21')])
  assert.equal(day.state, 'empty')
  assert.equal(day.level, 0)
  assert.equal(day.total, 0)
  assert.equal(day.completionRate, null)
  assert.match(day.label, /Sem registro/)
})

test('heatmap: pendentes, adiados e não realizados têm intensidade baixa', () => {
  const day = heatmap.getDailyHeatmapSummary(date, [record('pending'), record('postponed', 2), record('skipped', 3)])
  assert.equal(day.state, 'low')
  assert.equal(day.level, 1)
  assert.equal(day.pending, 1)
  assert.equal(day.postponed, 1)
  assert.equal(day.skipped, 1)
  assert.equal(day.completionRate, 0)
})

test('heatmap: progresso parcial prevalece sobre adiados e pendentes', () => {
  const day = heatmap.getDailyHeatmapSummary(date, [record('partial'), record('postponed', 2), record('pending', 3)])
  assert.equal(day.state, 'partial')
  assert.equal(day.level, 2)
  assert.equal(day.partial, 1)
})

test('heatmap: uma conclusão prevalece sobre progresso parcial', () => {
  const day = heatmap.getDailyHeatmapSummary(date, [record('partial'), record('completed', 2)])
  assert.equal(day.state, 'completed')
  assert.equal(day.level, 3)
  assert.equal(day.completed, 1)
  assert.equal(day.completionRate, 50)
})

test('heatmap: várias conclusões atingem o nível máximo sem extrapolar', () => {
  for (const count of [2, 5, 100]) {
    const day = heatmap.getDailyHeatmapSummary(date, Array.from({ length: count }, (_, index) => record('completed', index)))
    assert.equal(day.state, 'excellent')
    assert.equal(day.level, 4)
    assert.equal(day.completed, count)
    assert.equal(day.completionRate, 100)
  }
  const levels = [[], [record('pending')], [record('partial')], [record('completed')], [record('completed'), record('completed', 2)], [record('planned_rest')]]
  assert.deepEqual(levels.map(records => heatmap.getDailyHeatmapSummary(date, records).level), [0, 1, 2, 3, 4, 0])
})

test('heatmap: descanso exclusivo é distinto de ausência, inclusive sem campos opcionais antigos', () => {
  const day = heatmap.getDailyHeatmapSummary(date, [record('planned_rest'), record('planned_rest', 2)])
  assert.equal(day.state, 'rest')
  assert.equal(day.level, 0)
  assert.equal(day.plannedRest, 2)
  assert.equal(day.completed, 0)
  assert.equal(day.completionRate, null)
  assert.match(day.label, /Descanso planejado/)
  assert.match(day.label, /2 descansos planejados/)
})

test('heatmap: descanso misto mantém contagem e é neutro na taxa dos registros', () => {
  const records = [record('completed'), record('partial', 2), record('planned_rest', 3), record('planned_rest', 4)]
  const day = heatmap.getDailyHeatmapSummary(date, records)
  assert.equal(day.state, 'completed')
  assert.equal(day.total, 4)
  assert.equal(day.plannedRest, 2)
  assert.equal(day.completionRate, 50)
  assert.equal(heatmap.getDailyHeatmapSummary(date, [record('planned_rest'), record('partial', 2)]).state, 'partial')
  assert.equal(heatmap.getDailyHeatmapSummary(date, [record('planned_rest'), record('pending', 2)]).state, 'low')
})

test('heatmap: filtro todos consolida o dia e filtro de hábito isola seus registros', () => {
  const records = [record('completed'), record('completed', 2), record('partial', 3)]
  const options = { start: date, end: date }
  assert.equal(heatmap.buildHeatmapCalendar(records, options).days[0].state, 'excellent')
  assert.equal(heatmap.buildHeatmapCalendar(records, { ...options, habitId: 3 }).days[0].state, 'partial')
  assert.equal(heatmap.buildHeatmapCalendar(records, { ...options, habitId: 99 }).days[0].state, 'empty')
  assert.equal(heatmap.buildHeatmapCalendar(records, { ...options, habitId: 1 }).days[0].total, 1)
})

test('heatmap: label acessível descreve data, todos os status e taxa coerente', () => {
  const statuses = ['completed', 'partial', 'postponed', 'pending', 'skipped', 'planned_rest']
  const day = heatmap.getDailyHeatmapSummary(date, statuses.map((status, index) => record(status, index)))
  for (const text of ['22 de setembro de 2026', '6 check-ins', '1 concluídos', '1 parciais', '1 adiados', '1 pendentes', '1 não realizados', '1 descansos planejados', '20%']) {
    assert.ok(day.label.includes(text), text)
  }
  assert.equal(day.completionRate, 20)
  assert.match(day.label, /dos registros, sem descanso/)
  assert.equal(Object.keys(heatmap.HEATMAP_STATE_LABELS).length, 6)
})

test('heatmap: períodos de 30, 90, 180 e 365 dias são inclusivos', () => {
  for (const period of [30, 90, 180, 365]) {
    const range = heatmap.getHeatmapRange(period, date)
    const { days } = heatmap.buildHeatmapCalendar([], range)
    assert.equal(days.length, period)
    assert.equal(days[0].date, range.start)
    assert.equal(days.at(-1).date, date)
  }
  assert.equal(heatmap.getHeatmapRange(30, date).start, '2026-08-24')
  assert.equal(heatmap.getHeatmapRange(90, date).start, '2026-06-25')
})

test('heatmap: calendário respeita ano bissexto e mudança de ano', () => {
  const leap = heatmap.getHeatmapRange(3, '2024-03-01')
  assert.deepEqual(Array.from(heatmap.buildHeatmapCalendar([], leap).days, day => day.date), ['2024-02-28', '2024-02-29', '2024-03-01'])
  const newYear = heatmap.getHeatmapRange(3, '2026-01-01')
  assert.deepEqual(Array.from(heatmap.buildHeatmapCalendar([], newYear).days, day => day.date), ['2025-12-30', '2025-12-31', '2026-01-01'])
})

test('heatmap: padding alinha domingo ou segunda e nunca inclui dias extras', () => {
  for (const [firstDayOfWeek, padding] of [[0, 2], [1, 1]]) {
    const { weeks } = heatmap.buildHeatmapCalendar([], { start: date, end: date, firstDayOfWeek })
    assert.equal(weeks.length, 1)
    assert.equal(weeks[0].length, 7)
    assert.equal(weeks[0][padding].date, date)
    assert.equal(weeks[0].filter(day => day === null).length, 6)
    assert.ok(weeks[0].slice(0, padding).every(day => day === null))
  }
  const sunday = heatmap.buildHeatmapCalendar([], { start: '2026-09-20', end: '2026-09-26', firstDayOfWeek: 0 })
  assert.equal(sunday.weeks.length, 1)
  assert.ok(sunday.weeks[0].every(Boolean))
  const monday = heatmap.buildHeatmapCalendar([], { start: '2026-09-21', end: '2026-09-27', firstDayOfWeek: 1 })
  assert.equal(monday.weeks.length, 1)
  assert.ok(monday.weeks[0].every(Boolean))
})

test('heatmap: noite no Brasil preserva o dia local mesmo quando UTC já mudou', () => {
  const { store, dates, heatmap: localHeatmap } = setup()
  const habit = store.saveHabit(habitInput)
  const saved = store.completeCheckIn(habit.id)
  assert.ok(new LocalClock().toISOString().startsWith('2026-09-23'))
  assert.equal(dates.dateKey(new LocalClock()), date)
  const { days } = localHeatmap.buildHeatmapCalendar(store.getState().completions, localHeatmap.getHeatmapRange(30, dates.dateKey(new LocalClock())))
  assert.equal(days.at(-1).date, date)
  assert.equal(days.at(-1).records[0].id, saved.id)
  assert.match(days.at(-1).label, /22 de setembro/)
})

test('heatmap: migração v2 mantém conclusão antiga sem valor, unidade ou meta', () => {
  const legacy = { version: 2, user: null, habits: [{ ...habitInput, id: 1, createdAt: '2026-09-01' }], completions: [{ habitId: 1, date }], settings: { compact: false, habitReminders: false, weeklySummary: false, firstDayOfWeek: 1 } }
  const { store, heatmap: migratedHeatmap, data } = app([['streakflow_data', JSON.stringify(legacy)]], LocalClock)
  const state = store.getState()
  assert.equal(state.storageError, null)
  const before = data.get('streakflow_data')
  const day = migratedHeatmap.getDailyHeatmapSummary(date, state.completions)
  assert.equal(day.state, 'completed')
  assert.equal(day.completed, 1)
  assert.equal(day.completionRate, 100)
  assert.equal(day.records[0].value, undefined)
  assert.equal(data.get('streakflow_data'), before)
})

test('heatmap: usa status de todos os tipos e mantém supermeta como concluído', () => {
  const { store, heatmap: actualHeatmap } = setup()
  const binary = store.saveHabit(habitInput)
  const quantity = store.saveHabit({ ...habitInput, trackingType: 'quantity', target: 2500, unit: 'ml' })
  const duration = store.saveHabit({ ...habitInput, trackingType: 'duration', target: 60 })
  const qualitative = store.saveHabit({ ...habitInput, trackingType: 'qualitative' })
  store.completeCheckIn(binary.id)
  store.addProgress(quantity.id, 3000)
  store.addProgress(duration.id, 30)
  store.saveCheckIn({ habitId: qualitative.id, date, status: 'partial', note: 'Treino leve' })
  const day = actualHeatmap.getDailyHeatmapSummary(date, store.getState().completions)
  assert.equal(day.state, 'excellent')
  assert.equal(day.completed, 2)
  assert.equal(day.partial, 2)
  assert.equal(day.completionRate, 50)
  assert.equal(day.records.find(checkIn => checkIn.habitId === quantity.id).value, 3000)
  assert.equal(day.records.find(checkIn => checkIn.habitId === qualitative.id).note, 'Treino leve')
  store.saveHabit({ ...habitInput, trackingType: 'quantity', target: 5000, unit: 'ml' }, quantity.id)
  assert.equal(actualHeatmap.getDailyHeatmapSummary(date, store.getState().completions).completed, 2)
})

test('heatmap: resumo usa os mesmos dias e inclui descanso em dias mistos', () => {
  const records = [record('completed', 1, '2026-09-19'), record('planned_rest', 2, '2026-09-19'), record('partial', 1, '2026-09-20'), record('planned_rest', 1, '2026-09-21'), record('postponed', 1, date)]
  const { days } = heatmap.buildHeatmapCalendar(records, { start: '2026-09-18', end: date })
  assert.deepEqual(plain(heatmap.summarizeHeatmap(days)), { totalDays: 5, activeDays: 2, completionDays: 1, restDays: 2, totalCheckIns: 5, activeRate: 40 })
  assert.deepEqual(plain(heatmap.summarizeHeatmap([])), { totalDays: 0, activeDays: 0, completionDays: 0, restDays: 0, totalCheckIns: 0, activeRate: 0 })
})

test('heatmap: helpers não alteram check-ins, tracking, store ou streak', () => {
  class EarlierClock extends LocalClock {
    constructor(...args) { super(...(args.length ? args : [2026, 8, 20, 12, 0])) }
  }
  const initial = setup(EarlierClock)
  const habit = initial.store.saveHabit({ ...habitInput, allowPlannedRest: true })
  const { store, heatmap: actualHeatmap, consistency, data } = app(initial.data, LocalClock)
  store.setAuthenticatedUser({ sub: 'test-sub', name: 'Teste', email: 'teste@example.com' })
  store.saveCheckIn({ habitId: habit.id, date: '2026-09-20', status: 'completed' })
  store.saveCheckIn({ habitId: habit.id, date: '2026-09-21', status: 'planned_rest' })
  store.completeCheckIn(habit.id)
  const records = store.getState().completions
  const beforeRecords = JSON.stringify(records)
  const beforeStored = data.get('streakflow_data')
  const beforeStreak = plain(consistency.getHabitStreaks(records, habit.id, new LocalClock()))
  records.forEach(checkIn => { Object.freeze(checkIn.tracking); Object.freeze(checkIn) })
  Object.freeze(records)
  const calendar = actualHeatmap.buildHeatmapCalendar(records, actualHeatmap.getHeatmapRange(30, date))
  actualHeatmap.summarizeHeatmap(calendar.days)
  actualHeatmap.groupCheckInsByDate(records)
  actualHeatmap.getDailyHeatmapSummary(date, records)
  assert.equal(JSON.stringify(records), beforeRecords)
  assert.equal(data.get('streakflow_data'), beforeStored)
  assert.deepEqual(plain(consistency.getHabitStreaks(records, habit.id, new LocalClock())), beforeStreak)
  assert.equal(calendar.days.find(day => day.date === '2026-09-21').state, 'rest')
  assert.equal(beforeStreak.current, 2)
})

test('heatmap: intervalos inválidos falham de forma explícita', () => {
  for (const period of [0, -1, 1.5, Infinity, NaN]) assert.throws(() => heatmap.getHeatmapRange(period, date), /período/)
  assert.throws(() => heatmap.getHeatmapRange(30, '2026-02-30'), /data local válida/)
  assert.throws(() => heatmap.buildHeatmapCalendar([], { start: date, end: '2026-09-21' }), /início/)
  assert.throws(() => heatmap.buildHeatmapCalendar([], { start: date, end: 'invalid' }), /data local válida/)
})
