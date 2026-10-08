import * as cognito from 'aws-amplify/auth'
import { Hub } from 'aws-amplify/utils'
import { configureAuth } from './amplify'
import { setAuthenticatedUser } from './streakflow'
import { authError, returnDestination } from './authErrors'
import type { Profile } from './types'

export type AuthUser = Profile & { sub: string; username: string }
type AuthState = { user: AuthUser | null; isAuthenticated: boolean; isLoading: boolean; error: string; oauthDestination: string | null }
let state: AuthState = { user: null, isAuthenticated: false, isLoading: true, error: '', oauthDestination: null }
let oauthDestination: string | null = null
const listeners = new Set<() => void>()
let revision = 0
let started = false
function publish(user: AuthUser | null, error = '') {
  setAuthenticatedUser(user)
  state = { user, isAuthenticated: !!user, isLoading: false, error, oauthDestination: user ? oauthDestination : null }
  listeners.forEach(listener => listener())
}
export const getAuthState = () => state
export function subscribeAuth(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}
export async function checkSession(forceRefresh = false) {
  const request = ++revision
  try { configureAuth() } catch (error) {
    publish(null, error instanceof Error ? error.message : 'Configuração de acesso indisponível.')
    return null
  }
  try {
    const session = await cognito.fetchAuthSession({ forceRefresh })
    if (!session.tokens) { if (request === revision) publish(null); return null }
    const current = await cognito.getCurrentUser()
    // OAuth com openid/email/profile não autoriza a API GetUser. Os atributos
    // vêm do ID token da sessão obtida pelo SDK, sem persistência manual.
    const scope = session.tokens.accessToken?.payload.scope
    const claims = session.tokens.idToken?.payload
    const attributes = typeof scope === 'string' && !scope.split(' ').includes('aws.cognito.signin.user.admin')
      ? { email: typeof claims?.email === 'string' ? claims.email : undefined, name: typeof claims?.name === 'string' ? claims.name : undefined }
      : await cognito.fetchUserAttributes()
    const user = { sub: current.userId, username: current.username, email: attributes.email ?? current.signInDetails?.loginId ?? '', name: attributes.name?.trim() || attributes.email?.split('@')[0] || 'Minha conta' }
    if (request !== revision) return null
    publish(user)
    return user
  } catch (error) {
    if (request === revision) publish(null, (error as { name?: string })?.name === 'UserUnAuthenticatedException' ? '' : authError(error))
    return null
  }
}
export function initializeAuth() {
  if (started) return
  started = true
  Hub.listen('auth', ({ payload }) => {
    if (payload.event === 'signedOut' || payload.event === 'tokenRefresh_failure') { revision++; oauthDestination = null; publish(null) }
    if (payload.event === 'customOAuthState') oauthDestination = returnDestination(payload.data)
    if (payload.event === 'signInWithRedirect') {
      oauthDestination ??= '/dashboard'
      void checkSession()
    }
    if (payload.event === 'signInWithRedirect_failure') {
      revision++
      oauthDestination = null
      publish(null, authError({ name: 'OAuthRedirectFailure' }))
    }
    if (payload.event === 'signedIn') void checkSession()
  })
  window.addEventListener('focus', () => { void checkSession() })
  window.addEventListener('storage', event => {
    if (event.key === null || event.key.startsWith('CognitoIdentityServiceProvider.')) void checkSession()
  })
  window.setInterval(() => { void checkSession() }, 60_000)
  void checkSession()
}
const username = (email: string) => email.trim().toLowerCase()
export async function signInWithGoogle(from?: unknown) {
  configureAuth()
  await cognito.signInWithRedirect({ provider: 'Google', customState: returnDestination(from) })
}
export function clearOAuthDestination() {
  oauthDestination = null
  state = { ...state, oauthDestination: null }
  listeners.forEach(listener => listener())
}
export async function signIn(email: string, password: string) {
  configureAuth()
  const result = await cognito.signIn({ username: username(email), password })
  if (result.isSignedIn && !await checkSession()) throw new Error('SessionUnavailable')
  return result
}
export async function signUp(profile: Profile, password: string) {
  configureAuth()
  const input = { username: username(profile.email), password }
  const email = username(profile.email)
  try {
    return await cognito.signUp({ ...input, options: { userAttributes: { email, name: profile.name.trim() } } })
  } catch (error) {
    // O Cognito rejeitou os atributos antes de criar a conta. Nome é opcional;
    // não repetir em erros de rede, senha ou conta existente.
    const cause = error as { name?: string; message?: string }
    if (cause?.name !== 'NotAuthorizedException' || !/write unauthorized attribute/i.test(cause.message ?? '')) throw error
    return cognito.signUp({ ...input, options: { userAttributes: { email } } })
  }
}
export function confirmSignUp(email: string, code: string) {
  configureAuth()
  return cognito.confirmSignUp({ username: username(email), confirmationCode: code.trim() })
}
export function resendConfirmationCode(email: string) {
  configureAuth()
  return cognito.resendSignUpCode({ username: username(email) })
}
export async function signOut() {
  configureAuth()
  await cognito.signOut()
  revision++
  oauthDestination = null
  publish(null)
}
export function resetPassword(email: string) {
  configureAuth()
  return cognito.resetPassword({ username: username(email) })
}
export function confirmResetPassword(email: string, code: string, password: string) {
  configureAuth()
  return cognito.confirmResetPassword({ username: username(email), confirmationCode: code.trim(), newPassword: password })
}
export async function updateProfile(profile: Profile) {
  configureAuth()
  const attributes: { name?: string; email?: string } = {}
  if (profile.name !== state.user?.name) attributes.name = profile.name.trim()
  if (username(profile.email) !== state.user?.email) attributes.email = username(profile.email)
  if (!Object.keys(attributes).length) return false
  let result
  try { result = await cognito.updateUserAttributes({ userAttributes: attributes }) }
  catch (error) {
    const cause = error as { name?: string; message?: string }
    if (cause?.name === 'NotAuthorizedException' && /write unauthorized attribute/i.test(cause.message ?? '')) {
      throw Object.assign(new Error(), { name: 'ProfileAttributeNotAllowed' })
    }
    throw error
  }
  await checkSession()
  return result.email?.nextStep.updateAttributeStep === 'CONFIRM_ATTRIBUTE_WITH_CODE'
}
export async function confirmEmailChange(code: string) {
  configureAuth()
  await cognito.confirmUserAttribute({ userAttributeKey: 'email', confirmationCode: code.trim() })
  await checkSession()
}
