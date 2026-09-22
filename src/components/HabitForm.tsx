import { Link } from 'react-router'
import { useState, type FormEvent } from 'react'
import type { Habit, HabitInput } from '../lib/types'
import Field from './Field'

export default function HabitForm({ habit, onSave }: { habit?: Habit; onSave: (input: HabitInput) => void }) {
  const [error, setError] = useState('')
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const input = {
      title: String(data.get('title') || '').trim(),
      category: String(data.get('category') || 'Outros'),
      description: String(data.get('description') || '').trim(),
      weeklyGoal: Number(data.get('weeklyGoal')),
      estimatedMinutes: data.get('estimatedMinutes') ? Number(data.get('estimatedMinutes')) : undefined,
      color: String(data.get('color') || 'purple') as Habit['color'],
    }
    if (!input.title) return setError('Informe o nome do hábito.')
    if (!Number.isInteger(input.weeklyGoal) || input.weeklyGoal < 1 || input.weeklyGoal > 7) return setError('Escolha uma meta entre 1 e 7 dias por semana.')
    try { onSave(input) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível salvar o hábito. Tente novamente.') }
  }
  return <form className="panel max-w-2xl space-y-5" onChange={() => setError('')} onSubmit={submit}>
    <h2 className="text-xl font-bold">{habit ? 'Editar hábito' : 'Criar novo hábito'}</h2>
    <Field label="Nome do hábito" name="title" defaultValue={habit?.title} required maxLength={100} autoFocus placeholder="Ex.: Ler por 20 minutos" />
    <label className="block text-sm font-semibold">Descrição (opcional)<textarea name="description" defaultValue={habit?.description || ''} maxLength={500} rows={3} placeholder="O que você quer realizar?" className="mt-2 block w-full" /></label>
    <label className="block text-sm font-semibold">Categoria<select name="category" defaultValue={habit?.category || 'Saúde'} className="mt-2 block w-full">{[...new Set(['Saúde', 'Estudo', 'Trabalho', 'Exercício', 'Leitura', 'Bem-estar', 'Outro', ...(habit ? [habit.category] : [])])].map(c => <option key={c}>{c}</option>)}</select></label>
    <label className="block text-sm font-semibold">Meta semanal<select name="weeklyGoal" defaultValue={habit?.weeklyGoal || 7} className="mt-2 block w-full">{[1, 2, 3, 4, 5, 6, 7].map(days => <option key={days} value={days}>{days} {days === 1 ? 'dia por semana' : 'dias por semana'}</option>)}</select></label>
    <p className="muted">A meta acompanha seu ritmo semanal. O streak conta dias consecutivos com conclusão, independentemente da meta.</p>
    <Field name="estimatedMinutes" label="Duração estimada em minutos (opcional)" type="number" min={1} max={1440} step={1} defaultValue={habit?.estimatedMinutes} placeholder="Ex.: 20" />
    <label className="block text-sm font-semibold">Cor de identificação<select name="color" defaultValue={habit?.color ?? 'purple'} className="mt-2 block w-full"><option value="purple">Roxo</option><option value="violet">Violeta</option><option value="indigo">Azul-arroxeado</option><option value="gray">Cinza</option></select></label>
    {error && <p role="alert" className="notice notice-error">{error}</p>}
    <div className="flex items-center gap-5"><button className="primary" type="submit">Salvar hábito</button><Link to="/meus-habitos" className="text-slate-500">Cancelar</Link></div>
  </form>
}
