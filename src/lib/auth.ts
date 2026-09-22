import type { Profile } from './types'
import { createUser, getUser, validateProfile } from './streakflow'

async function derive(password: string, salt: number[]) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new Uint8Array(salt), iterations: 100000, hash: 'SHA-256' }, key, 256)
  return Array.from(new Uint8Array(bits), byte => byte.toString(16).padStart(2, '0')).join('')
}

// Validação local para a demonstração, sem armazenar a senha em texto puro.
export async function registerAccount(profile: Profile, password: string) {
  const next = validateProfile(profile)
  if (password.trim().length < 6) throw new Error('A senha deve possuir pelo menos 6 caracteres.')
  if (getUser()) throw new Error('Já existe uma conta neste navegador. Entre com seu cadastro existente.')
  const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)))
  createUser({ profile: next, salt, verifier: await derive(password, salt) })
}

export async function validateAccount(email: string, password: string): Promise<Profile | null> {
  const account = getUser()
  if (!account || account.profile.email !== email.trim().toLowerCase()) return null
  return await derive(password, account.salt) === account.verifier ? account.profile : null
}
