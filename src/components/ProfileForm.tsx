import { useState } from 'react'
import type { Profile } from '../lib/types'
import { validateProfile } from '../lib/streakflow'
import Field from './Field'

export default function ProfileForm({ profile, onSave }: { profile: Profile; onSave: (profile: Profile) => void }) {
  const [error, setError] = useState('')
  return <form className="panel max-w-2xl space-y-5" onChange={() => setError('')} onSubmit={e => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    try { onSave(validateProfile({ name: String(data.get('name') || ''), email: String(data.get('email') || '') })) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível salvar o perfil.') }
  }}>
    <h2 className="text-xl font-bold">Meu perfil</h2>
    <Field name="name" label="Nome completo" defaultValue={profile.name} required minLength={3} maxLength={80} autoComplete="name" />
    <Field name="email" label="E-mail" type="email" defaultValue={profile.email} required maxLength={254} autoComplete="email" />
    <p className="muted">Ao alterar o e-mail, use o novo endereço no próximo login. Sua senha será mantida.</p>
    {error && <p role="alert" className="notice notice-error">{error}</p>}
    <button className="primary" type="submit">Salvar alterações</button>
  </form>
}
