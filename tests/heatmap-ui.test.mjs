import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import vm from 'node:vm'
import ts from 'typescript'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'

const require = createRequire(import.meta.url)
const modules = new Map()

// Renderiza os componentes reais e seus helpers, sem simular hooks ou JSX.
// Somente imports de CSS são dispensados porque não há navegador no SSR.
function load(url) {
  if (modules.has(url.href)) return modules.get(url.href)
  const source = readFileSync(url, 'utf8')
  const compiled = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText
  const exports = {}
  modules.set(url.href, exports)
  vm.runInNewContext(compiled, { exports, require: name => {
    if (name.endsWith('.css')) return {}
    if (!name.startsWith('.')) return require(name)
    for (const extension of ['.ts', '.tsx']) {
      const dependency = new URL(`${name}${extension}`, url)
      if (existsSync(dependency)) return load(dependency)
    }
    throw new Error(`Dependência local não encontrada: ${name}`)
  } }, { filename: url.pathname })
  return exports
}

const ConsistencyHeatmap = load(new URL('../src/components/ConsistencyHeatmap.tsx', import.meta.url)).default
const today = '2026-09-23'
const settings = { compact: false, habitReminders: false, weeklySummary: false, firstDayOfWeek: 1, theme: 'light' }
const habits = [{ id: 1, title: 'Leitura', category: 'Estudo', description: '', weeklyGoal: 7, createdAt: '2026-01-01' }]
const checkIn = (date, status, habitId = 1) => ({ id: `${habitId}:${date}`, habitId, date, status })
const render = (props = {}) => renderToStaticMarkup(createElement(MemoryRouter, null,
  createElement(ConsistencyHeatmap, { habits, records: [], settings, today, ...props })))
const dayButtons = html => [...html.matchAll(/<button\b[^>]*class="heatmap-cell [^"]*"[^>]*>[\s\S]*?<\/button>/g)].map(match => match[0])

test('heatmap UI: período inicial tem 90 dias descritos e apenas uma entrada de Tab', () => {
  const html = render({ records: [checkIn(today, 'completed')] })
  const cells = dayButtons(html)
  assert.equal(cells.length, 90)
  assert.ok(cells.every(cell => /aria-label="[^\"]+check-ins;[^\"]+"/.test(cell)))
  assert.equal(cells.filter(cell => /tabindex="0"/.test(cell)).length, 1)
  assert.equal(cells.filter(cell => /tabindex="-1"/.test(cell)).length, 89)
  const current = cells.find(cell => /aria-current="date"/.test(cell))
  assert.match(current, /tabindex="0"/)
  assert.match(current, /23 de setembro de 2026/)
  assert.match(current, /1 concluídos/)
  assert.match(html, /role="grid"[^>]*aria-describedby="[^"]+"[^>]*aria-rowcount="7"/)
  assert.match(html, /Setas navegam/)
})

test('heatmap UI: a ordem acessível das sete linhas segue a preferência de semana', () => {
  for (const [firstDayOfWeek, expected] of [[0, ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']], [1, ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']]]) {
    const html = render({ settings: { ...settings, firstDayOfWeek } })
    const rows = [...html.matchAll(/role="row" aria-label="([^"]+)"/g)].map(match => match[1])
    assert.deepEqual(rows, expected)
  }
})

test('heatmap UI: preview usa 30 dias, oferece acesso ao Progresso e não repete filtros', () => {
  const html = render({ compact: true, records: [checkIn(today, 'partial')] })
  assert.equal(dayButtons(html).length, 30)
  assert.match(html, /Consistência recente/)
  assert.match(html, /href="\/progresso"/)
  assert.match(html, /Explorar meu progresso/)
  assert.match(html, /dias com progresso/)
  assert.doesNotMatch(html, /<fieldset|<select/)
})

test('heatmap UI: os seis estados possuem marca, descrição diária e legenda textual', () => {
  const records = [
    checkIn('2026-09-19', 'postponed'), checkIn('2026-09-20', 'partial'),
    checkIn('2026-09-21', 'completed'), checkIn('2026-09-22', 'completed'),
    checkIn('2026-09-22', 'completed', 2), checkIn(today, 'planned_rest'),
  ]
  const html = render({ records })
  const cells = dayButtons(html)
  const states = { empty: 'Sem registro', low: 'Sem conclusão', partial: 'Progresso parcial', completed: 'Hábito concluído', excellent: 'Vários hábitos concluídos', rest: 'Descanso planejado' }
  for (const [state, label] of Object.entries(states)) {
    const cell = cells.find(cell => cell.includes(`heatmap-state-${state}`))
    assert.ok(cell, `Célula ${state} ausente`)
    assert.ok(cell.includes(label), `Descrição ${state} ausente`)
    assert.ok(cell.includes(`heatmap-mark-${state}`), `Marca ${state} ausente`)
    assert.ok(html.includes(`</span>${label}</span>`), `Legenda ${state} ausente`)
  }
  const rest = cells.find(cell => cell.includes('heatmap-state-rest'))
  assert.match(rest, /0 concluídos/)
  assert.match(rest, /1 descansos planejados/)
})

test('heatmap UI: dados vazios preservam calendário neutro e orientação para o primeiro hábito', () => {
  const html = render({ habits: [] })
  const cells = dayButtons(html)
  assert.equal(cells.length, 90)
  assert.ok(cells.every(cell => cell.includes('heatmap-state-empty')))
  assert.match(html, /Seu próximo passo começa a preencher este mapa/)
  assert.match(html, /href="\/dashboard\/novo-habito"/)
  assert.doesNotMatch(html, /NaN|Infinity/)
})

test('heatmap UI: percentual do resumo não expõe dízimas ao usuário', () => {
  const html = render({ records: [checkIn(today, 'completed')] })
  assert.match(html, />1% do período</)
  assert.doesNotMatch(html, /1\.111111/)
})
