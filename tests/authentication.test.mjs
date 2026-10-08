import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import * as React from 'react'
import * as jsx from 'react/jsx-runtime'
import * as router from 'react-router'
import { app } from './helpers/store.mjs'

function compile(path, dependencies, globals = {}) {
  const source = readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8').replaceAll('import.meta.env', 'testEnv')
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText
  const context = { exports: {}, ...globals, require: dependencies }
  vm.runInNewContext(compiled, context)
  return context.exports
}
const errors = compile('lib/authErrors.ts', () => ({}))
function fixture(overrides = {}, initial = []) {
  const local = app(initial)
  let signedIn = false
  let hub
  const calls = []
  const sdk = {
    fetchAuthSession: async () => signedIn ? { tokens: {} } : {},
    getCurrentUser: async () => ({ userId: 'cognito-sub', username: 'cognito-user' }),
    fetchUserAttributes: async () => ({ name: 'Pessoa Teste', email: 'pessoa@example.com' }),
    signIn: async input => { calls.push(['signIn', input]); signedIn = true; return { isSignedIn: true, nextStep: { signInStep: 'DONE' } } },
    signOut: async () => { signedIn = false },
    signInWithRedirect: async input => { calls.push(['signInWithRedirect', input]) },
    signUp: async input => { calls.push(['signUp', input]); return { nextStep: { signUpStep: 'CONFIRM_SIGN_UP' } } },
    confirmSignUp: async input => { calls.push(['confirmSignUp', input]); return { isSignUpComplete: true } },
    resendSignUpCode: async input => { calls.push(['resend', input]) },
    resetPassword: async input => { calls.push(['reset', input]); return { nextStep: { resetPasswordStep: 'CONFIRM_RESET_PASSWORD_WITH_CODE', codeDeliveryDetails: { destination: 'p***@example.com' } } } },
    confirmResetPassword: async input => { calls.push(['confirmReset', input]) },
    ...overrides,
  }
  const auth = compile('lib/auth.ts', name => {
    if (name === 'aws-amplify/auth') return sdk
    if (name === 'aws-amplify/utils') return { Hub: { listen: (_, callback) => { hub = callback } } }
    if (name === './amplify') return { configureAuth: () => {} }
    if (name === './streakflow') return local.store
    if (name === './authErrors') return errors
    throw new Error(name)
  }, { window: { addEventListener() {}, setInterval() {} } })
  return { ...local, auth, calls, sdk, emit: (event, data) => hub({ payload: { event, data } }) }
}
function page(path, fixture, routeState = {}) {
  const values = [], destinations = [], effects = []
  let cursor = 0
  const hooks = {
    ...React, useEffect(effect) { effects.push(effect) },
    useState(initial) { const i = cursor++; if (!(i in values)) values[i] = typeof initial === 'function' ? initial() : initial; return [values[i], next => { values[i] = typeof next === 'function' ? next(values[i]) : next }] },
    useRef(initial) { const i = cursor++; if (!(i in values)) values[i] = { current: initial }; return values[i] },
  }
  function require(name) {
    if (name === 'react/jsx-runtime') return jsx
    if (name === 'react') return hooks
    if (name === 'react-router') return { ...router, useLocation: () => ({ pathname: '/progresso', search: '?periodo=7', hash: '#grafico', state: routeState }), useNavigate: () => (to, options) => destinations.push({ to, ...options }) }
    if (name.endsWith('/useAuth')) return { useAuth: () => ({ ...fixture.auth.getAuthState(), ...fixture.auth }) }
    if (name.endsWith('/useStreakFlow')) return { useStreakFlow: () => fixture.store.getState() }
    if (name.endsWith('/useTheme')) return { useTheme() {} }
    if (name.endsWith('/useAuthRequest')) return compile('lib/useAuthRequest.ts', require)
    if (name.endsWith('/authErrors')) return errors
    const child = () => null
    child.displayName = name.split('/').at(-1)
    return { __esModule: true, default: child }
  }
  const Component = compile(path, require, { FormData: class { constructor(data) { this.data = data } get(key) { return this.data[key] } } }).default
  const render = props => { cursor = 0; return Component(props) }
  return { render, values, destinations, effects }
}
function find(node, predicate) {
  if (!React.isValidElement(node)) return undefined
  if (predicate(node)) return node
  return React.Children.toArray(node.props.children).map(child => find(child, predicate)).find(Boolean)
}
const form = tree => find(tree, node => node.type === 'form')
const submit = async (tree, data = {}) => {
  await form(tree).props.onSubmit({ preventDefault() {}, currentTarget: data })
  await new Promise(resolve => setImmediate(resolve))
}

test('Cognito: sessão inicial bloqueia conteúdo privado; visitante preserva destino completo', async () => {
  const f = fixture()
  const guard = page('components/ProtectedRoute.tsx', f)
  assert.ok(find(guard.render({ authenticated: false, isLoading: true }), node => node.props.role === 'status'))
  await f.auth.checkSession()
  const result = guard.render({ authenticated: false, isLoading: false, children: 'private' })
  assert.equal(result.type, router.Navigate)
  assert.equal(result.props.to, '/login')
  assert.equal(result.props.state.from, '/progresso?periodo=7#grafico')
})

test('Cognito: login usa SDK, restaura sessão, retorna à rota solicitada e logout bloqueia', async () => {
  const f = fixture()
  await f.auth.checkSession()
  const login = page('pages/Login.tsx', f, { from: '/progresso?periodo=7#grafico' })
  login.values.push(' PESSOA@example.com ', 'Senha123!', '', false, false)
  await submit(login.render())
  assert.equal(f.calls[0][1].username, 'pessoa@example.com')
  assert.equal(login.destinations[0].to, '/progresso?periodo=7#grafico')
  assert.equal(f.auth.getAuthState().user.sub, 'cognito-sub')
  await f.auth.checkSession()
  assert.equal(f.auth.getAuthState().isAuthenticated, true)
  const guard = page('components/ProtectedRoute.tsx', f)
  assert.equal(guard.render({ authenticated: true, children: 'private' }), 'private')
  const habit = f.store.saveHabit({ title: 'Ler', category: 'Estudos', description: '', weeklyGoal: 3 })
  f.store.completeCheckIn(habit.id)
  const before = f.data.get('streakflow_data')
  await f.auth.signOut()
  assert.equal(f.auth.getAuthState().isAuthenticated, false)
  assert.equal(f.store.getState().authenticated, false)
  assert.equal(f.data.get('streakflow_data'), before)
  assert.equal(guard.render({ authenticated: false }).props.to, '/login')
})

test('Cognito: flags locais nunca autenticam e retorno externo é rejeitado', async () => {
  const f = fixture({}, [['streakflow_logged', 'true'], ['token', 'fake']])
  await f.auth.checkSession()
  assert.equal(f.auth.getAuthState().isAuthenticated, false)
  for (const from of ['https://example.com', '//example.com', '/dashboard\\evil', '/login']) assert.equal(errors.returnDestination(from), '/dashboard')
})

test('Cognito: cadastro solicita confirmação sem autenticar nem persistir senha', async () => {
  const f = fixture()
  await f.auth.checkSession()
  const signup = page('pages/Cadastro.tsx', f, { from: '/historico' })
  signup.values.push('Pessoa Teste', 'pessoa@example.com', 'Senha123!', 'Senha123!', '', false, false)
  await submit(signup.render())
  assert.equal(signup.destinations[0].to, '/confirmar-email')
  assert.equal(signup.destinations[0].state.from, '/historico')
  assert.equal(f.calls[0][1].options.userAttributes.name, 'Pessoa Teste')
  assert.equal(f.auth.getAuthState().isAuthenticated, false)
  assert.equal(f.data.size, 0)
})

test('Cognito: confirmação mostra erro amigável, reenvia e retorna ao login com e-mail', async () => {
  const f = fixture({ confirmSignUp: async () => { throw { name: 'CodeMismatchException', message: 'internal SDK' } } })
  await f.auth.checkSession()
  const confirm = page('pages/ConfirmarEmail.tsx', f, { email: 'pessoa@example.com', from: '/historico' })
  await submit(confirm.render(), { code: '123456' })
  assert.match(find(confirm.render(), node => node.props.role === 'alert').props.children, /Código incorreto/)
  const resend = find(confirm.render(), node => node.type === 'button' && node.props.children === 'Reenviar código')
  resend.props.onClick()
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(f.calls.at(-1)[0], 'resend')
  f.sdk.confirmSignUp = async () => ({ isSignUpComplete: true })
  await submit(confirm.render(), { code: '123456' })
  assert.equal(confirm.destinations[0].to, '/login')
  assert.equal(confirm.destinations[0].state.email, 'pessoa@example.com')
  assert.match(confirm.destinations[0].state.message, /Conta confirmada com sucesso/)
})

test('Cognito: recuperação envia código, valida nova senha e confirma redefinição', async () => {
  const f = fixture()
  await f.auth.checkSession()
  const reset = page('pages/RecuperarSenha.tsx', f, { email: 'pessoa@example.com' })
  await submit(reset.render())
  assert.equal(f.calls[0][0], 'reset')
  await submit(reset.render(), { code: '123456', password: 'curta', confirmation: 'curta' })
  assert.equal(f.calls.length, 1)
  await submit(reset.render(), { code: '123456', password: 'NovaSenha123!', confirmation: 'NovaSenha123!' })
  assert.equal(f.calls[1][0], 'confirmReset')
  assert.equal(f.calls[1][1].newPassword, 'NovaSenha123!')
  assert.equal(reset.destinations[0].to, '/login')
})

test('Cognito: erros de login não autenticam, conta não confirmada abre confirmação', async () => {
  for (const name of ['NotAuthorizedException', 'UserNotConfirmedException', 'NetworkError', 'LimitExceededException']) {
    const f = fixture({ signIn: async () => { throw { name, message: 'internal' } } })
    await f.auth.checkSession()
    const login = page('pages/Login.tsx', f)
    login.values.push('pessoa@example.com', 'Senha123!', '', false, false)
    await submit(login.render())
    assert.equal(f.auth.getAuthState().isAuthenticated, false)
    if (name === 'UserNotConfirmedException') assert.equal(login.destinations[0].to, '/confirmar-email')
    else assert.ok(find(login.render(), node => node.props.role === 'alert'))
  }
})

test('Cognito: configuração ausente é compreensível; configure ocorre uma única vez', () => {
  let count = 0
  const config = compile('lib/amplify.ts', () => ({ Amplify: { configure: () => { count++ } } }), { testEnv: {} })
  assert.throws(() => config.configureAuth({ DEV: true }), /VITE_COGNITO_USER_POOL_ID/)
  assert.throws(() => config.configureAuth({}), /ainda não está configurado/)
  const env = { VITE_COGNITO_USER_POOL_ID: 'test-pool', VITE_COGNITO_CLIENT_ID: 'test-client' }
  config.configureAuth(env); config.configureAuth(env)
  assert.equal(count, 1)
})

test('Cognito: falha de refresh e signedOut encerram acesso sem apagar dados', async () => {
  const f = fixture()
  f.auth.initializeAuth()
  await f.auth.signIn('pessoa@example.com', 'Senha123!')
  f.emit('tokenRefresh_failure')
  assert.equal(f.auth.getAuthState().isAuthenticated, false)
  assert.equal(f.store.getState().authenticated, false)
})

test('Cognito: resposta de sessão atrasada não reabre acesso após logout', async () => {
  const f = fixture()
  await f.auth.signIn('pessoa@example.com', 'Senha123!')
  let resolve
  f.sdk.fetchUserAttributes = () => new Promise(done => { resolve = done })
  const pending = f.auth.checkSession()
  await new Promise(done => setImmediate(done))
  await f.auth.signOut()
  resolve({ email: 'pessoa@example.com' })
  await pending
  assert.equal(f.auth.getAuthState().isAuthenticated, false)
})

test('Cognito: sessão existente é restaurada na inicialização sem novo login', async () => {
  const f = fixture({ fetchAuthSession: async () => ({ tokens: {} }) })
  assert.equal(f.auth.getAuthState().isLoading, true)
  await f.auth.checkSession()
  assert.equal(f.auth.getAuthState().isLoading, false)
  assert.equal(f.auth.getAuthState().isAuthenticated, true)
  assert.equal(f.store.getState().authenticated, true)
  assert.equal(f.calls.length, 0)
})

test('Cognito: envio duplo de login não dispara duas chamadas ao SDK', async () => {
  let count = 0
  let resolve
  const f = fixture({ signIn: () => { count++; return new Promise(done => { resolve = done }) } })
  await f.auth.checkSession()
  const login = page('pages/Login.tsx', f)
  login.values.push('pessoa@example.com', 'Senha123!', '', false, false)
  const tree = login.render()
  const first = submit(tree)
  const second = submit(tree)
  assert.equal(count, 1)
  resolve({ isSignedIn: false, nextStep: { signInStep: 'CONFIRM_SIGN_UP' } })
  await Promise.all([first, second])
  assert.equal(login.destinations.length, 1)
})

test('Cognito: erro de recuperação permanece na etapa e permite nova tentativa', async () => {
  const f = fixture({ confirmResetPassword: async () => { throw { name: 'ExpiredCodeException' } } })
  await f.auth.checkSession()
  const reset = page('pages/RecuperarSenha.tsx', f, { email: 'pessoa@example.com' })
  await submit(reset.render())
  await submit(reset.render(), { code: '123456', password: 'NovaSenha123!', confirmation: 'NovaSenha123!' })
  assert.match(find(reset.render(), node => node.props.role === 'alert').props.children, /expirou/)
  assert.equal(reset.destinations.length, 0)
  assert.equal(find(reset.render(), node => node.type === 'fieldset').props.disabled, false)
})

test('Cognito: nome sem permissão não impede cadastro por e-mail', async () => {
  const inputs = []
  const f = fixture({ signUp: async input => {
    inputs.push(input)
    if (input.options.userAttributes.name) throw { name: 'NotAuthorizedException', message: 'A client attempted to write unauthorized attribute' }
    return { nextStep: { signUpStep: 'CONFIRM_SIGN_UP' } }
  } })
  const result = await f.auth.signUp({ name: 'Pessoa Teste', email: 'pessoa@example.com' }, 'Senha123!')
  assert.equal(result.nextStep.signUpStep, 'CONFIRM_SIGN_UP')
  assert.equal(inputs.length, 2)
  assert.equal(inputs[1].options.userAttributes.name, undefined)
  assert.equal(inputs[1].options.userAttributes.email, 'pessoa@example.com')
})

test('Cognito: erro de perfil não encerra sessão nem altera hábitos', async () => {
  const f = fixture({ updateUserAttributes: async () => { throw { name: 'NotAuthorizedException', message: 'A client attempted to write unauthorized attribute' } } })
  await f.auth.signIn('pessoa@example.com', 'Senha123!')
  const before = JSON.stringify(f.store.getState())
  await assert.rejects(f.auth.updateProfile({ name: 'Outro nome', email: 'pessoa@example.com' }), error => {
    assert.match(errors.authError(error), /continuar usando sua conta/)
    return true
  })
  assert.equal(f.auth.getAuthState().isAuthenticated, true)
  assert.equal(JSON.stringify(f.store.getState()), before)
})

test('Cognito: perfil salva somente atributos alterados e confirma novo e-mail', async () => {
  const inputs = []
  let email = 'pessoa@example.com'
  const f = fixture({
    fetchUserAttributes: async () => ({ name: 'Pessoa Teste', email }),
    updateUserAttributes: async input => { inputs.push(input); return { email: { nextStep: { updateAttributeStep: 'CONFIRM_ATTRIBUTE_WITH_CODE' } } } },
    confirmUserAttribute: async input => { inputs.push(input); email = 'novo@example.com' },
  })
  await f.auth.signIn(email, 'Senha123!')
  assert.equal(await f.auth.updateProfile({ name: 'Pessoa Teste', email: 'novo@example.com' }), true)
  assert.equal(inputs[0].userAttributes.name, undefined)
  await f.auth.confirmEmailChange('123456')
  assert.equal(inputs[1].userAttributeKey, 'email')
  assert.equal(f.auth.getAuthState().user.email, 'novo@example.com')
})

test('Cognito: cadastro inválido é bloqueado antes de chamar o SDK', async () => {
  for (const [name, email, password, confirmation] of [
    ['Ab', 'pessoa@example.com', 'Senha123!', 'Senha123!'],
    ['Pessoa', 'invalido', 'Senha123!', 'Senha123!'],
    ['Pessoa', 'pessoa@example.com', 'curta', 'curta'],
    ['Pessoa', 'pessoa@example.com', 'Senha123!', 'OutraSenha123!'],
  ]) {
    const f = fixture()
    await f.auth.checkSession()
    const signup = page('pages/Cadastro.tsx', f)
    signup.values.push(name, email, password, confirmation, '', false, false)
    await submit(signup.render())
    assert.equal(f.calls.length, 0)
    assert.ok(find(signup.render(), node => node.props.role === 'alert'))
  }
})

test('Google: botão acessível chama redirect com provider e destino, sem alterar login tradicional', async () => {
  const f = fixture()
  await f.auth.checkSession()
  const login = page('pages/Login.tsx', f, { from: '/progresso?periodo=7#grafico' })
  const tree = login.render()
  const button = find(tree, node => node.type === 'button' && React.Children.toArray(node.props.children).includes('Continuar com Google'))
  assert.equal(button.props.type, 'button')
  assert.equal(button.props.disabled, false)
  assert.ok(find(tree, node => node.props.autoComplete === 'current-password'))
  button.props.onClick()
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(f.calls[0][0], 'signInWithRedirect')
  assert.equal(f.calls[0][1].provider, 'Google')
  assert.equal(f.calls[0][1].customState, '/progresso?periodo=7#grafico')
  assert.equal(f.auth.getAuthState().isAuthenticated, false)
})

test('Google: clique duplicado é bloqueado durante redirect e falha permite tentar novamente', async () => {
  let reject, count = 0
  const f = fixture({ signInWithRedirect: () => { count++; return new Promise((_, fail) => { reject = fail }) } })
  await f.auth.checkSession()
  const login = page('pages/Login.tsx', f)
  const button = find(login.render(), node => node.type === 'button' && React.Children.toArray(node.props.children).includes('Continuar com Google'))
  button.props.onClick(); button.props.onClick()
  assert.equal(count, 1)
  assert.ok(find(login.render(), node => node.props['aria-busy'] === true && node.props.disabled))
  reject({ name: 'OAuthNotConfigureException', message: 'internal SDK details' })
  await new Promise(resolve => setImmediate(resolve))
  assert.match(find(login.render(), node => node.props.role === 'alert').props.children, /Google ainda não está configurado/)
  assert.equal(find(login.render(), node => node.props['aria-busy'] === false).props.disabled, false)
})

const federatedSession = (name = 'Pessoa Google') => ({ tokens: {
  accessToken: { payload: { scope: 'openid email profile' } },
  idToken: { payload: { sub: 'cognito-sub', email: 'google@example.com', name } },
} })

test('Google: callback restaura usuário pelos atributos do token e navega ao destino uma vez', async () => {
  const f = fixture({ fetchAuthSession: async () => federatedSession(), fetchUserAttributes: async () => { throw new Error('GetUser must not run without admin scope') } })
  f.auth.initializeAuth()
  f.emit('customOAuthState', '/historico?periodo=7#registros')
  f.emit('signInWithRedirect')
  f.emit('signedIn')
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(f.auth.getAuthState().user.name, 'Pessoa Google')
  assert.equal(f.auth.getAuthState().user.email, 'google@example.com')
  assert.equal(f.auth.getAuthState().user.sub, 'cognito-sub')
  assert.equal(f.store.getState().authenticated, true)
  const appPage = page('App.tsx', f)
  appPage.render()
  appPage.effects[0]()
  assert.equal(appPage.destinations[0].to, '/historico?periodo=7#registros')
  assert.equal(appPage.destinations[0].replace, true)
  assert.equal(f.auth.getAuthState().oauthDestination, null)
  await f.auth.signOut()
  assert.equal(f.auth.getAuthState().isAuthenticated, false)
  assert.equal(f.store.getState().authenticated, false)
})

test('Google: nome ausente usa e-mail; recarga normal não redireciona a landing', async () => {
  const f = fixture({ fetchAuthSession: async () => federatedSession('') })
  await f.auth.checkSession()
  assert.equal(f.auth.getAuthState().user.name, 'google')
  assert.equal(f.auth.getAuthState().oauthDestination, null)
})

test('Google: destino externo é rejeitado e falha de callback não autentica', async () => {
  const f = fixture()
  f.auth.initializeAuth()
  await f.auth.signInWithGoogle('https://evil.example')
  assert.equal(f.calls[0][1].customState, '/dashboard')
  f.emit('customOAuthState', '//evil.example')
  f.emit('signInWithRedirect_failure', { error: { message: 'raw token or provider error' } })
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(f.auth.getAuthState().isAuthenticated, false)
  assert.equal(f.auth.getAuthState().oauthDestination, null)
  assert.match(f.auth.getAuthState().error, /login com Google/)
})

test('Google: configuração OAuth usa code, hostname e URLs de retorno autorizadas', () => {
  let configured
  const config = compile('lib/amplify.ts', () => ({ Amplify: { configure: value => { configured = value } } }), { testEnv: {} })
  config.configureAuth({ VITE_COGNITO_USER_POOL_ID: 'test-pool', VITE_COGNITO_CLIENT_ID: 'test-client' })
  const loginWith = configured.Auth.Cognito.loginWith
  assert.equal(loginWith.email, true)
  assert.equal(loginWith.oauth.responseType, 'code')
  assert.equal(loginWith.oauth.domain, 'us-east-1ceh8jusxq.auth.us-east-1.amazoncognito.com')
  assert.deepEqual(Array.from(loginWith.oauth.scopes), ['openid', 'email', 'profile'])
  assert.ok(loginWith.oauth.redirectSignIn.includes('http://localhost:5173/'))
  assert.deepEqual(Array.from(loginWith.oauth.redirectSignIn), Array.from(loginWith.oauth.redirectSignOut))
})
