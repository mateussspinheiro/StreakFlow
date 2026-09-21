import { Link } from 'react-router'
import { useState } from 'react'
import type { Habit } from '../lib/types'
import Field from './Field'

export default function HabitForm({ habit, onSave }: { habit?: Habit; onSave: (title: string, category: string) => void }) {
  const [error, setError] = useState('')
  return <form className="panel max-w-2xl space-y-5" onChange={() => setError('')} onSubmit={e => { e.preventDefault(); const data = new FormData(e.currentTarget); const title = String(data.get('title')).trim(); if (title.length < 3) return setError('Descreva o hábito com pelo menos 3 caracteres.'); onSave(title, String(data.get('category'))) }}><h2 className="text-xl font-bold">{habit ? 'Editar hábito' : 'Criar novo hábito'}</h2><Field label="Nome do hábito" name="title" defaultValue={habit?.title} required minLength={3} maxLength={100} autoFocus /><label className="block text-sm font-semibold">Categoria<select name="category" defaultValue={habit?.category || 'Saúde'} className="mt-2 block w-full rounded-xl border border-slate-200 p-3">{['Saúde', 'Estudos', 'Fitness', 'Desenvolvimento', 'Bem-estar', 'Outros'].map(c => <option key={c}>{c}</option>)}</select></label>{error && <p role="alert" className="text-red-600">{error}</p>}<div className="flex items-center gap-5"><button className="primary">Salvar hábito</button><Link to="/habitos" className="text-slate-500">Cancelar</Link></div></form>
}
