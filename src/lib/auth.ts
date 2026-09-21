import type { Profile } from './types'
import { read, save } from './storage'

type Account = { profile: Profile; salt: number[]; verifier: string }

async function derive(password: string, salt: number[]) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new Uint8Array(salt), iterations: 100000, hash: 'SHA-256' }, key, 256)
  return Array.from(new Uint8Array(bits), byte => byte.toString(16).padStart(2, '0')).join('')
}

// Validação local para a demonstração, sem armazenar a senha em texto puro.
export async function registerAccount(profile: Profile, password: string) {
  const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)))
  save('account', { profile, salt, verifier: await derive(password, salt) })
}

export async function validateAccount(email: string, password: string): Promise<Profile | null> {
  const account = read<Account | null>('account', null)
  if (!account || account.profile.email !== email.trim().toLowerCase()) return null
  return await derive(password, account.salt) === account.verifier ? account.profile : null
}
