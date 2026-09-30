import { useState } from 'react'
import type { Profile } from '../lib/types'
import { validateProfile } from '../lib/streakflow'
import { useAuth } from '../lib/useAuth'
import { useAuthRequest } from '../lib/useAuthRequest'
import Field from './Field'

export default function ProfileForm({ profile, onSaved }: { profile: Profile; onSaved: () => void }) {
  const [confirming, setConfirming] = useState(false)
  const { updateProfile, confirmEmailChange } = useAuth()
  const { busy, error, setError, run } = useAuthRequest()
  return <form className="panel max-w-2xl space-y-5" onSubmit={event => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    if (confirming) {
      void run(async () => { await confirmEmailChange(String(data.get('code'))); setConfirming(false); onSaved() })
      return
    }
    let next: Profile
    try { next = validateProfile({ name: String(data.get('name') || ''), email: String(data.get('email') || '') }) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Confira seu perfil.'); return }
    void run(async () => {
      const needsCode = await updateProfile(next)
      setConfirming(needsCode)
      if (!needsCode) onSaved()
    })
  }}>
    <h2 className="text-xl font-bold">Meu perfil</h2>
    <fieldset disabled={busy} className="space-y-5" aria-describedby={error ? 'profile-error' : undefined}>
      {confirming ? <><p role="status" className="notice">Confirme o código enviado ao novo e-mail para concluir a alteração.</p><Field name="code" label="Código de confirmação" autoComplete="one-time-code" required autoFocus /></> : <>
        <Field name="name" label="Nome completo" defaultValue={profile.name} required minLength={3} maxLength={80} autoComplete="name" />
        <Field name="email" label="E-mail" type="email" defaultValue={profile.email} required maxLength={254} autoComplete="email" />
        <p className="muted">A alteração de e-mail pode exigir confirmação por código. Sua senha será mantida.</p>
      </>}
      {error && <p id="profile-error" role="alert" className="notice notice-error">{error}</p>}
      <button className="primary" type="submit">{busy ? 'Salvando…' : confirming ? 'Confirmar novo e-mail' : 'Salvar alterações'}</button>
    </fieldset>
  </form>
}
