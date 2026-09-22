import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import * as React from 'react'
import * as jsx from 'react/jsx-runtime'
import * as router from 'react-router'
import { app } from './helpers/store.mjs'

const profile = { name: 'Pessoa Teste', email: 'pessoa@example.com' }
const habit = { title: 'Ler', category: 'Leitura', description: '', weeklyGoal: 3 }
const location = (pathname = '/') => ({ pathname, search: '', hash: '' })

// Executa componentes reais; substitui somente hooks de ambiente e páginas-filhas.
function component(path, fixture, current = location(), states = [], navigate = () => {}) {
  let index = 0
  const source = readFileSync(new URL(`../src/${path}.tsx`, import.meta.url), 'utf8')
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText
  const context = { exports: {}, require: name => {
    if (name === 'react/jsx-runtime') return jsx
    if (name === 'react') return { ...React, useEffect: () => {}, useState: initial => [index < states.length ? states[index++] : initial, () => {}] }
    if (name === 'react-router') return { ...router, useLocation: () => current, useNavigate: () => navigate }
    if (name.endsWith('/auth')) return fixture.auth
    if (name.endsWith('/streakflow')) return fixture.store
    if (name.endsWith('/useStreakFlow')) return { useStreakFlow: () => fixture.store.getState() }
    if (name.endsWith('/useTheme')) return { useTheme: () => {} }
    const child = () => null
    child.displayName = name.split('/').at(-1)
    return { __esModule: true, default: child }
  } }
  vm.runInNewContext(compiled, context)
  return context.exports.default
}

function route(fixture, path) {
  const tree = component('App', fixture, location(path))()
  const routes = React.Children.toArray(tree.props.children).find(child => child.type === router.Routes)
  return router.matchRoutes(router.createRoutesFromElements(routes.props.children), path)
}

function guard(fixture, path = '/dashboard') {
  return component('components/ProtectedRoute', fixture, location(path))({ authenticated: fixture.store.getState().authenticated, children: 'private-content' })
}

function findForm(node) {
  if (!React.isValidElement(node)) return undefined
  if (node.type === 'form') return node
  return React.Children.toArray(node.props.children).map(findForm).find(Boolean)
}

async function register(initial = []) {
  const fixture = app(initial)
  await fixture.auth.registerAccount(profile, 'senha123')
  return fixture
}

async function login(fixture, password = 'senha123', state) {
  const destinations = []
  const Login = component('pages/Login', fixture, { ...location('/login'), state }, [profile.email, password, '', false, false], path => destinations.push(path))
  const form = findForm(Login({ onEnter: fixture.store.startSession }))
  await form.props.onSubmit({ preventDefault() {} })
  return destinations
}

test('autenticação: navegador limpo inicia deslogado sem criar dados', () => {
  const fixture = app()
  assert.equal(fixture.store.getState().authenticated, false)
  assert.equal(fixture.store.getState().user, null)
  assert.equal(fixture.data.size, 0)
})

test('autenticação: raiz mostra Landing pública ao visitante', () => {
  const fixture = app()
  assert.equal(route(fixture, '/').at(-1).route.element.type.displayName, 'Landing')
  assert.equal(fixture.data.size, 0)
})

test('autenticação: login e cadastro são públicos e não iniciam sessão', () => {
  const fixture = app()
  for (const [path, name] of [['/login', 'Login'], ['/cadastro', 'Cadastro']]) assert.equal(route(fixture, path).at(-1).route.element.type.displayName, name)
  assert.equal(fixture.store.getState().authenticated, false)
  assert.equal(fixture.data.size, 0)
})

test('autenticação: visitante é enviado ao Login nas rotas privadas', () => {
  const fixture = app()
  for (const path of ['/dashboard', '/meus-habitos', '/historico', '/progresso', '/dashboard/perfil', '/dashboard/configuracoes']) {
    assert.ok(route(fixture, path).some(match => match.route.element?.type.displayName === 'ProtectedRoute'))
    const redirect = guard(fixture, path)
    assert.equal(redirect.type, router.Navigate)
    assert.equal(redirect.props.to, '/login')
    assert.equal(redirect.props.state.from, path)
  }
})

test('autenticação: formulário valida credenciais antes de iniciar sessão', async () => {
  const fixture = await register()
  assert.equal(fixture.store.getState().authenticated, false)
  assert.deepEqual(await login(fixture), ['/dashboard'])
  assert.equal(fixture.store.getState().authenticated, true)
})

test('autenticação: login inválido não cria sessão nem navega', async () => {
  const fixture = await register()
  assert.deepEqual(await login(fixture, 'incorreta'), [])
  assert.equal(fixture.store.getState().authenticated, false)
  assert.equal(fixture.data.has('streakflow_logged'), false)
})

test('autenticação: recarga mantém sessão criada por login válido', async () => {
  const fixture = await register()
  await login(fixture)
  assert.equal(app(fixture.data).store.getState().authenticated, true)
})

test('autenticação: logout remove somente a sessão e preserva hábitos e histórico', async () => {
  const fixture = await register()
  await login(fixture)
  const saved = fixture.store.saveHabit(habit)
  fixture.store.completeCheckIn(saved.id)
  const before = fixture.data.get('streakflow_data')
  fixture.store.endSession()
  assert.equal(fixture.store.getState().authenticated, false)
  assert.equal(fixture.data.has('streakflow_logged'), false)
  assert.equal(fixture.data.get('streakflow_data'), before)
  assert.equal(app(fixture.data).store.getState().authenticated, false)
})

test('autenticação: dashboard volta ao Login após logout', async () => {
  const fixture = await register()
  await login(fixture)
  assert.equal(guard(fixture), 'private-content')
  fixture.store.endSession()
  assert.equal(guard(fixture).props.to, '/login')
})

test('autenticação: conta e hábitos armazenados não bastam para autenticar', async () => {
  const fixture = await register()
  await login(fixture)
  fixture.store.saveHabit(habit)
  fixture.store.endSession()
  const state = app(fixture.data).store.getState()
  assert.equal(state.habits.length, 1)
  assert.ok(state.user)
  assert.equal(state.authenticated, false)
})

test('autenticação: dados de demonstração e tokens desconhecidos não criam sessão', () => {
  const fixture = app([['mockUser', JSON.stringify(profile)], ['token', 'fake-token'], ['isAuthenticated', 'true'], ['streakflow_logged', 'true']])
  assert.equal(fixture.store.getState().authenticated, false)
  assert.equal(fixture.store.getState().user, null)
})

test('autenticação: raiz continua Landing mesmo com sessão válida', async () => {
  const fixture = await register()
  await login(fixture)
  const element = route(fixture, '/').at(-1).route.element
  assert.equal(element.type.displayName, 'Landing')
  assert.equal(element.props.authenticated, true)
})

test('regressão: cadastro não herda marca de sessão órfã após recarga', async () => {
  const fixture = await register([['streakflow_logged', 'true']])
  assert.equal(fixture.store.getState().authenticated, false)
  assert.equal(app(fixture.data).store.getState().authenticated, false)
  assert.ok(app(fixture.data).store.getState().user)
})

test('regressão: sessão malformada não bloqueia nem apaga dados existentes', async () => {
  const fixture = await register()
  await login(fixture)
  fixture.store.saveHabit(habit)
  const before = fixture.data.get('streakflow_data')
  for (const invalid of ['{', '"true"', '{}', 'false']) {
    const reloaded = app([...fixture.data, ['streakflow_logged', invalid]])
    assert.equal(reloaded.store.getState().authenticated, false)
    assert.equal(reloaded.store.getState().storageError, null)
    assert.equal(reloaded.store.getState().habits.length, 1)
    assert.equal(reloaded.data.get('streakflow_data'), before)
  }
})

test('autenticação: retorno preserva busca e fragmento e rejeita destinos externos', async () => {
  const fixture = await register()
  const current = { pathname: '/historico', search: '?periodo=7', hash: '#registros' }
  const redirect = component('components/ProtectedRoute', fixture, current)({ authenticated: false })
  assert.deepEqual(await login(fixture, 'senha123', redirect.props.state), ['/historico?periodo=7#registros'])
  for (const from of ['https://example.com', '//example.com', '/dashboard\\example.com', '/login']) {
    fixture.store.endSession()
    assert.deepEqual(await login(fixture, 'senha123', { from }), ['/dashboard'])
  }
})
