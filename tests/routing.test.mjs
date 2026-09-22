import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import * as React from 'react'
import * as jsx from 'react/jsx-runtime'
import * as router from 'react-router'

// Executa a árvore real de App.tsx, isolando apenas efeitos e conteúdo das páginas.
function routes(authenticated, pathname = '/', search = '', hash = '') {
  const source = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText
  const context = { exports: {}, require: name => {
    if (name === 'react/jsx-runtime') return jsx
    if (name === 'react') return { ...React, useEffect: () => {}, useState: value => [value, () => {}] }
    if (name === 'react-router') return { ...router, useLocation: () => ({ pathname, search, hash }), useNavigate: () => () => {} }
    if (name.endsWith('/useStreakFlow')) return { useStreakFlow: () => ({ authenticated, user: { profile: { name: 'Teste', email: 'teste@example.com' } }, settings: { theme: 'system' } }) }
    if (name.endsWith('/useTheme')) return { useTheme: () => {} }
    if (name.endsWith('/streakflow')) return {}
    const component = () => null
    component.displayName = name.split('/').at(-1)
    return { __esModule: true, default: component }
  } }
  vm.runInNewContext(compiled, context)
  const result = context.exports.default()
  const root = React.Children.toArray(result.props.children).find(child => child.type === router.Routes)
  return router.createRoutesFromElements(root.props.children)
}

const privatePages = {
  '/dashboard': 'Dashboard', '/meus-habitos': 'MeusHabitos', '/historico': 'Historico', '/progresso': 'Progresso',
  '/dashboard/perfil': 'Perfil', '/dashboard/configuracoes': 'Configuracoes',
  '/dashboard/novo-habito': 'DashboardContent', '/dashboard/editar-habito/123': 'DashboardContent',
}

test('URLs principais resolvem páginas reais e preservam proteção de toda a área privada', () => {
  for (const authenticated of [false, true]) {
    for (const [path, page] of Object.entries(privatePages)) {
      const matches = router.matchRoutes(routes(authenticated, path), path)
      assert.equal(matches.at(-1).route.element.type.displayName, page, path)
      const guard = matches.find(match => match.route.element?.type.displayName === 'ProtectedRoute')
      assert.ok(guard, `Proteção ausente: ${path}`)
      assert.equal(guard.route.element.props.authenticated, authenticated)
      assert.equal(guard.route.element.props.children.type.displayName, 'DashboardLayout')
    }
  }
  for (const [path, page] of Object.entries({ '/': 'Landing', '/login': 'Login', '/cadastro': 'Cadastro' })) {
    assert.equal(router.matchRoutes(routes(false), path).at(-1).route.element.type.displayName, page)
  }
  for (const path of ['/login', '/cadastro']) {
    const element = router.matchRoutes(routes(true), path).at(-1).route.element
    assert.equal(element.type, router.Navigate)
    assert.equal(element.props.to, '/dashboard')
  }
})

test('URLs antigas redirecionam sem reload, preservando busca e fragmento', () => {
  const aliases = { '/habitos': '/meus-habitos', '/dashboard/habitos': '/meus-habitos', '/dashboard/historico': '/historico', '/dashboard/progresso': '/progresso', '/perfil': '/dashboard/perfil', '/configuracoes': '/dashboard/configuracoes', '/novo-habito': '/dashboard/novo-habito' }
  for (const [path, target] of Object.entries(aliases)) {
    const element = router.matchRoutes(routes(true, path, '?periodo=7', '#registros'), path).at(-1).route.element
    const redirect = element.type(element.props)
    assert.equal(redirect.type, router.Navigate)
    assert.equal(redirect.props.to, `${target}?periodo=7#registros`)
    assert.equal(redirect.props.replace, true)
  }
})

test('URLs desconhecidas abrem 404; URLs válidas com barra final continuam válidas', () => {
  for (const path of ['/nao-existe', '/meus-habitos/nao-existe', '/dashboard/nao-existe']) {
    assert.equal(router.matchRoutes(routes(true), path).at(-1).route.element.type.displayName, 'NotFound')
  }
  for (const [path, page] of Object.entries(privatePages)) {
    assert.equal(router.matchRoutes(routes(true), `${path}/`).at(-1).route.element.type.displayName, page)
  }
})

test('rewrite documentado atende URLs SPA e exclui os tipos de assets requisitados', () => {
  const document = readFileSync(new URL('../ROUTING_DEPLOY.md', import.meta.url), 'utf8')
  const json = document.match(/```json\s*([\s\S]*?)```/)[1]
  const rule = JSON.parse(json)
  assert.equal(rule.target, '/index.html')
  assert.equal(rule.status, '200')
  const regex = new RegExp(rule.source.slice(2, -2))
  for (const path of ['/', '/login', '/cadastro', ...Object.keys(privatePages), '/nao-existe']) assert.ok(regex.test(path), path)
  for (const extension of ['css', 'gif', 'ico', 'jpg', 'js', 'png', 'txt', 'svg', 'woff', 'woff2', 'ttf', 'map', 'json', 'webp']) {
    assert.equal(regex.test(`/assets/arquivo.${extension}`), false, extension)
  }
})
