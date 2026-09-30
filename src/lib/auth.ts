import * as cognito from 'aws-amplify/auth'
import { Hub } from 'aws-amplify/utils'
import { configureAuth } from './amplify'
import { setAuthenticatedUser } from './streakflow'
import { authError } from './authErrors'
import type { Profile } from './types'

export type AuthUser = Profile & { sub: string; username: string }
type AuthState = { user: AuthUser | null; isAuthenticated: boolean; isLoading: boolean; error: string }
let state: AuthState = { user: null, isAuthenticated: false, isLoading: true, error: '' }
const listeners = new Set<() => void>()
let revision = 0
let started = false
function publish(user: AuthUser | null, error = '') {
  setAuthenticatedUser(user)
  state = { user, isAuthenticated: !!user, isLoading: false, error }
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
    const attributes = await cognito.fetchUserAttributes()
    const user = { sub: current.userId, username: current.username, email: attributes.email ?? current.signInDetails?.loginId ?? '', name: attributes.name ?? attributes.email?.split('@')[0] ?? 'Minha conta' }
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
    if (payload.event === 'signedOut' || payload.event === 'tokenRefresh_failure') { revision++; publish(null) }
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
