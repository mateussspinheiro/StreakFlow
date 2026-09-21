import { Link, useNavigate, useOutletContext } from 'react-router'
import { useEffect, useState } from 'react'
import type { Habit } from '../lib/types'
import type { DashboardContext } from '../lib/dashboard'
import { read, save } from '../lib/storage'
import HabitForm from '../components/HabitForm'
import ProfileForm from '../components/ProfileForm'

const menu = [['dashboard', '▦', 'Dashboard'], ['habitos', '✓', 'Meus hábitos'], ['historico', '↻', 'Histórico'], ['progresso', '▥', 'Progresso'], ['perfil', '◯', 'Meu perfil'], ['configuracoes', '⚙', 'Configurações']]
const initialHabits: Habit[] = ['Beber 2L de água', 'Estudar programação', 'Praticar exercícios', 'Ler por 30 minutos', 'Meditar'].map((title, id) => ({ id, title, category: ['Saúde', 'Estudos', 'Fitness', 'Desenvolvimento', 'Bem-estar'][id], completed: false }))

export default function DashboardContent({ route }: { route: string }) {
  const { profile, onProfileChange } = useOutletContext<DashboardContext>()
  const navigate = useNavigate()
  const [habits, setHabits] = useState<Habit[]>(() => read('habits', initialHabits))
  const [notice, setNotice] = useState('')
  useEffect(() => { save('habits', habits) }, [habits])
 useEffect(() => {
    document.title = `${menu.find(item => item[0] === route)?.[2] || 'StreakFlow'} | StreakFlow`
  }, [route])
  const completed = habits.filter(h => h.completed).length
  const progress = habits.length ? Math.round(completed / habits.length * 100) : 0
  const editing = route.startsWith('editar-habito/') ? habits.find(h => h.id === Number(route.split('/')[1])) : undefined
  const go = (page: string) => { navigate('/dashboard/' + page) }
  const toggle = (id: number) => setHabits(current => current.map(h => h.id === id ? { ...h, completed: !h.completed } : h))
  return (
      <div className="mx-auto max-w-[1500px] space-y-7 p-5 sm:p-8">
        {notice && <p role="status" className="rounded-xl bg-violet-100 p-4">{notice} <button aria-label="Fechar aviso" onClick={() => setNotice('')}>×</button></p>}
        {route === 'dashboard' && <section className="flex flex-wrap items-center justify-between gap-6 rounded-[28px] bg-[#111827] p-8 text-white"><div><p className="mb-4 text-sm text-violet-300">Olá, {profile.name} 👋</p><h2 className="max-w-xl text-4xl font-bold">Seus hábitos constroem o seu <span className="text-violet-400">futuro.</span></h2><p className="mt-4 text-slate-400">Complete seus hábitos de hoje para manter o ritmo.</p></div><div className="rounded-full border-8 border-violet-500 p-7 text-center"><strong className="text-3xl">{progress}%</strong><p className="text-xs">{completed}/{habits.length} concluídos</p></div></section>}
        {['dashboard', 'progresso'].includes(route) && <section className="grid gap-4 sm:grid-cols-3" aria-label="Resumo do progresso">{[['🎯', 'Hábitos ativos', habits.length], ['✅', 'Concluídos hoje', completed], ['⚡', 'Taxa de conclusão', `${progress}%`]].map(([icon, label, value]) => <article className="panel" key={label}><span className="text-2xl">{icon}</span><p className="mt-4 text-sm text-slate-500">{label}</p><p className="text-3xl font-bold">{value}</p></article>)}</section>}
        {['dashboard', 'habitos'].includes(route) && <section className="panel"><div className="mb-6 flex justify-between"><h2 className="text-lg font-bold">Hábitos de hoje</h2>{route === 'dashboard' && <Link className="text-sm font-bold text-violet-600" to="/dashboard/habitos">Ver todos →</Link>}</div><div className="space-y-3">{habits.length === 0 && <p className="text-slate-500">Nenhum hábito cadastrado. Crie seu primeiro hábito!</p>}{habits.map(h => <article key={h.id} className={`flex items-center gap-3 rounded-2xl border p-4 ${h.completed ? 'border-emerald-100 bg-emerald-50/40' : 'border-slate-100'}`}><input aria-label={`Concluir ${h.title}`} type="checkbox" checked={h.completed} onChange={() => toggle(h.id)} className="h-6 w-6 accent-violet-600" /><div className="min-w-0 flex-1"><p className={`break-words font-semibold ${h.completed ? 'text-slate-400 line-through' : ''}`}>{h.title}</p><p className="text-xs text-slate-400">{h.category}</p></div><Link aria-label={`Editar ${h.title}`} to={`/dashboard/editar-habito/${h.id}`} className="p-2 text-violet-600">✎</Link><button aria-label={`Excluir ${h.title}`} className="p-2 text-red-500" onClick={() => { if (window.confirm(`Excluir “${h.title}”?`)) setHabits(current => current.filter(item => item.id !== h.id)) }}>×</button></article>)}</div><Link to="/dashboard/novo-habito" className="mt-4 block rounded-2xl border-2 border-dashed border-slate-200 p-4 text-center text-sm font-semibold text-violet-600">+ Adicionar novo hábito</Link></section>}
        {['dashboard', 'historico'].includes(route) && <section className="panel"><h2 className="mb-2 text-lg font-bold">Conclusões desta sessão</h2><p className="mb-4 text-sm text-slate-500">Hábitos marcados como concluídos na demonstração.</p>{completed === 0 ? <p>Nenhum hábito concluído ainda.</p> : habits.filter(h => h.completed).map(h => <p key={h.id} className="border-b border-slate-100 py-3">✅ {h.title}<span className="float-right text-xs text-emerald-600">CONCLUÍDO</span></p>)}</section>}
        {route === 'progresso' && <section className="panel"><h2 className="mb-4 text-lg font-bold">Seu progresso atual</h2><progress aria-label="Percentual de hábitos concluídos" value={progress} max="100" className="h-5 w-full accent-violet-600" /><p className="mt-4">{completed} de {habits.length} hábitos concluídos. {progress === 100 ? 'Parabéns! Você concluiu todos os hábitos.' : 'Cada pequeno passo conta.'}</p></section>}
        {(route === 'novo-habito' || editing) && <HabitForm key={route} habit={editing} onSave={(title, category) => { setHabits(current => editing ? current.map(h => h.id === editing.id ? { ...h, title, category } : h) : [...current, { id: Date.now(), title, category, completed: false }]); go('habitos') }} />}
        {route === 'perfil' && <ProfileForm profile={profile} onSave={next => { onProfileChange(next); setNotice('Perfil atualizado com sucesso.') }} />}
        {route === 'configuracoes' && <section className="panel"><h2 className="text-lg font-bold">Sobre esta demonstração</h2><p className="mt-3 text-slate-600">Os hábitos e o perfil ficam disponíveis nesta aba durante a sessão. As senhas não são armazenadas. O acesso com Google e a recuperação de senha dependem de um serviço de autenticação.</p><Link to="/dashboard/perfil" className="mt-5 inline-block font-semibold text-violet-600">Editar meu perfil →</Link></section>}
        {!menu.some(item => item[0] === route) && route !== 'novo-habito' && !editing && <section className="panel"><h2 className="text-xl font-bold">Página ou hábito não encontrado</h2><Link to="/dashboard" className="text-violet-600">Voltar ao dashboard</Link></section>}
      </div>
  )
}
