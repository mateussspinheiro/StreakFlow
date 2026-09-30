import { useRef, useState } from 'react'
import { authError } from './authErrors'

export function useAuthRequest() {
  const locked = useRef(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function run(action: () => Promise<void>) {
    if (locked.current) return
    locked.current = true
    setBusy(true)
    setError('')
    try { await action() } catch (cause) { setError(authError(cause)) }
    finally { locked.current = false; setBusy(false) }
  }
  return { busy, error, setError, run }
}
