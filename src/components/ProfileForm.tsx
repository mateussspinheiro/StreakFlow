import { useState } from 'react'
import type { Profile } from '../lib/types'
import Field from './Field'

export default function ProfileForm({ profile, onSave }: { profile: Profile; onSave: (profile: Profile) => void }) {
  const [error, setError] = useState('')
  return <form className="panel max-w-2xl space-y-5" onChange={() => setError('')} onSubmit={e => { e.preventDefault(); const data = new FormData(e.currentTarget); const name = String(data.get('name')).trim(); const email = String(data.get('email')).trim(); if (name.length < 3 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Informe um nome e um e-mail válidos.'); onSave({ name, email }) }}><h2 className="text-xl font-bold">Meu perfil</h2><Field name="name" label="Nome completo" defaultValue={profile.name} required minLength={3} maxLength={80} /><Field name="email" label="E-mail" type="email" defaultValue={profile.email} required />{error && <p role="alert" className="text-red-600">{error}</p>}<button className="primary">Salvar alterações</button></form>
}
