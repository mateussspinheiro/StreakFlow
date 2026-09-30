import { useSyncExternalStore } from 'react'
import * as auth from './auth'

// Uma única store de sessão, compartilhada por todas as telas e pelo guard.
export function useAuth() {
  return { ...useSyncExternalStore(auth.subscribeAuth, auth.getAuthState), ...auth }
}
