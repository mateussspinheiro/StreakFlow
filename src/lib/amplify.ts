import { Amplify } from 'aws-amplify'

let configured = false
export function configureAuth(env = import.meta.env) {
  if (configured) return
  const userPoolId = env.VITE_COGNITO_USER_POOL_ID?.trim()
  const userPoolClientId = env.VITE_COGNITO_CLIENT_ID?.trim()
  if (!userPoolId || !userPoolClientId) {
    throw new Error(env.DEV
      ? 'Configure VITE_COGNITO_USER_POOL_ID e VITE_COGNITO_CLIENT_ID em StreakFlow/.env.local e reinicie o Vite.'
      : 'O acesso à conta ainda não está configurado. Tente novamente mais tarde.')
  }
  Amplify.configure({ Auth: { Cognito: { userPoolId, userPoolClientId, loginWith: { email: true } } } })
  configured = true
}
