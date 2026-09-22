// Um documento versionado mantém alterações de hábitos e conclusões atômicas.
export const STORAGE_KEYS = {
  data: 'streakflow_data',
  session: 'streakflow_logged',
} as const

export const LEGACY_KEYS = {
  account: 'streakflow:account',
  profile: 'streakflow:profile',
  habits: 'streakflow:habits',
  compact: 'streakflow:compact',
  session: 'streakflow:session',
} as const

export function readStored(key: keyof typeof STORAGE_KEYS): unknown {
  const raw = localStorage.getItem(STORAGE_KEYS[key])
  return raw === null ? null : JSON.parse(raw)
}

export function writeStored(key: keyof typeof STORAGE_KEYS, value: unknown) {
  try { localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(value)) }
  catch { throw new Error('Não foi possível salvar. Verifique o espaço e a permissão de armazenamento do navegador.') }
}

export function removeSession() {
  try { localStorage.removeItem(STORAGE_KEYS.session) }
  catch { throw new Error('Não foi possível encerrar a sessão neste navegador. Tente novamente.') }
}

export function readLegacy(key: keyof typeof LEGACY_KEYS): unknown {
  const raw = sessionStorage.getItem(LEGACY_KEYS[key])
  return raw === null ? null : JSON.parse(raw)
}
