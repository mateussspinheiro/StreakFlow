import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import vm from 'node:vm'

const source = readFileSync(new URL('../src/lib/habits.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
const sandbox = { exports: {} }
vm.runInNewContext(compiled, sandbox)
const { dateKey, previousDays, streak } = sandbox.exports

function migrationState(legacyHabits, storedData) {
  const local = new Map(storedData ? [['streakflow_data', JSON.stringify(storedData)]] : [])
  const session = new Map([['streakflow:habits', JSON.stringify(legacyHabits)]])
  const storage = values => ({
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  })
  const modules = new Map()
  function load(name) {
    if (modules.has(name)) return modules.get(name)
    const source = readFileSync(new URL(`../src/lib/${name}.ts`, import.meta.url), 'utf8')
    const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
    const context = {
      exports: {},
      localStorage: storage(local),
      sessionStorage: storage(session),
      require: path => load(path.replace('./', '')),
    }
    vm.runInNewContext(compiled, context)
    modules.set(name, context.exports)
    return context.exports
  }
  return { state: load('streakflow').getState(), local, session }
}

test('datas usam o calendário local e atravessam meses e anos', () => {
  assert.equal(dateKey(new Date(2026, 0, 1, 23, 59)), '2026-01-01')
  assert.equal(Array.from(previousDays(3, new Date(2026, 0, 1))).join(','), '2025-12-30,2025-12-31,2026-01-01')
})
test('sequência mantém ontem enquanto hoje ainda está pendente', () => {
  assert.equal(streak(['2026-09-19', '2026-09-20'], new Date(2026, 8, 21)), 2)
})
test('sequência ignora duplicados e para na primeira lacuna', () => {
  assert.equal(streak(['2026-09-18', '2026-09-20', '2026-09-21', '2026-09-21'], new Date(2026, 8, 21)), 2)
  assert.equal(streak(['2026-09-19'], new Date(2026, 8, 21)), 0)
  assert.equal(streak([], new Date(2026, 8, 21)), 0)
})
test('migração mantém conclusões antigas sem recriar datas já migradas', () => {
  const legacy = [{ id: 1, title: 'Ler', category: 'Estudos', completed: true }]
  const migrated = migrationState(legacy)
  assert.equal(migrated.state.storageError, null)
  assert.equal(migrated.state.completions[0].date, dateKey())
  assert.equal(migrated.session.get('streakflow:habits'), JSON.stringify(legacy))
  const stored = JSON.parse(migrated.local.get('streakflow_data'))
  stored.habits[0].createdAt = '2026-08-31'
  stored.completions = [{ id: '1:2026-09-01', habitId: 1, date: '2026-09-01', status: 'completed' }]
  const current = migrationState(legacy, stored).state
  assert.equal(current.storageError, null)
  assert.equal(current.completions.length, 1)
  assert.equal(current.completions[0].date, '2026-09-01')
  assert.equal(current.habits[0].createdAt, '2026-08-31')
})
