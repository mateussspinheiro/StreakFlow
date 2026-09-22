import { Link, useNavigate, useOutletContext } from 'react-router'
import { useEffect, useState } from 'react'
import type { CheckIn, CheckInInput, Habit } from '../lib/types'
import type { DashboardContext } from '../lib/dashboard'
import { dateKey } from '../lib/habits'
import { addProgress, completeCheckIn, deleteHabit, exportData as getExportData, getIndicators, getState, removeCheckIn, saveCheckIn, saveHabit, saveSettings } from '../lib/streakflow'
import { getHabitStreaks } from '../lib/consistency'
import { checkInFeedback } from '../lib/tracking'
import { useStreakFlow } from '../lib/useStreakFlow'
import { formatDate } from '../lib/checkins'
import HabitForm from './HabitForm'
import ProfileForm from './ProfileForm'
import SettingsForm from './SettingsForm'
import DayOverview from './DayOverview'
import HabitList from './HabitList'
import HistoryPanel from './HistoryPanel'
import ProgressPanel from './ProgressPanel'
import CheckInForm from './CheckInForm'
import Feedback from './Feedback'
import Modal from './Modal'
import EmptyState from './EmptyState'

const pages: Record<string, [string, string]> = {
  dashboard: ['Visão geral', 'Sua rotina, um dia de cada vez.'],
  habitos: ['Meus hábitos', 'Organize o que importa. Encontre seu ritmo.'],
  historico: ['Histórico', 'O contexto também faz parte do progresso.'],
  progresso: ['Meu progresso', 'Uma visão real da sua consistência.'],
  perfil: ['Meu perfil', 'Sua identidade, sua jornada.'],
  configuracoes: ['Configurações', 'Uma experiência que acompanha seu ritmo.'],
}

export default function DashboardContent({ route }: { route: string }) {
  const { profile, onProfileChange } = useOutletContext<DashboardContext>()
  const navigate = useNavigate()
  const { habits, completions, settings, user } = useStreakFlow()
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [now, setNow] = useState(() => new Date())
  const [checkIn, setCheckIn] = useState<{ habit: Habit; record?: CheckIn } | null>(null)
  const [deleting, setDeleting] = useState<Habit | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [pulse, setPulse] = useState(0)
  useEffect(() => {
    const update = () => setNow(new Date())
    const timer = window.setInterval(update, 30000)
    window.addEventListener('focus', update)
    return () => { window.clearInterval(timer); window.removeEventListener('focus', update) }
  }, [])
  useEffect(() => { document.title = `${pages[route]?.[0] || 'Hábito'} | StreakFlow` }, [route])
  const today = dateKey(now)
  const { bestStreak, checkIns } = getIndicators({ habits, completions }, now)
  const editing = route.startsWith('editar-habito/') ? habits.find(h => h.id === Number(route.split('/')[1])) : undefined
  const greeting = now.getHours() < 12 ? 'Bom dia' : now.getHours() < 18 ? 'Boa tarde' : 'Boa noite'
  function recordSaved(record: CheckIn, before: number) {
    const currentTime = new Date()
    const after = getHabitStreaks(getState().completions, record.habitId, currentTime).current
    if (after > before) setPulse(value => value + 1)
    setCheckIn(null)
    setNow(currentTime)
    setError('')
    setNotice(checkInFeedback(record))
  }
  function saveRecord(input: CheckInInput) {
    const before = getHabitStreaks(getState().completions, input.habitId).current
    recordSaved(saveCheckIn(input), before)
  }
  function quickCheckIn(habitId: number, delta?: number) {
    try {
      const before = getHabitStreaks(getState().completions, habitId).current
      recordSaved(delta === undefined ? completeCheckIn(habitId) : addProgress(habitId, delta), before)
    } catch (cause) { setNotice(''); setError(cause instanceof Error ? cause.message : 'Não foi possível registrar o progresso.') }
  }
  function exportData() {
    try {
      const url = URL.createObjectURL(new Blob([JSON.stringify(getExportData(), null, 2)], { type: 'application/json' }))
      const anchor = document.createElement('a')
      anchor.href = url; anchor.download = `streakflow-${today}.json`; anchor.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      setNotice('Arquivo de dados exportado.')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível exportar.') }
  }
  return <div className={`page-content ${settings.compact ? 'compact' : ''}`}>
    <header className="page-heading"><div><p className="eyebrow">{route === 'dashboard' ? formatDate(today) : 'STREAKFLOW / SEU ESPAÇO'}</p><h1>{route === 'dashboard' ? `${greeting}, ${profile.name.split(' ')[0]}.` : pages[route]?.[0] || (editing ? 'Editar hábito' : route === 'novo-habito' ? 'Novo hábito' : 'Página não encontrada')}</h1><p className="muted">{pages[route]?.[1] || 'Uma ação simples, um passo possível.'}</p></div>{['dashboard', 'habitos'].includes(route) && <Link className="primary" to="/dashboard/novo-habito">+ Novo hábito</Link>}</header>
    <Feedback message={notice} onClose={() => setNotice('')} />
    <Feedback message={error} error onClose={() => setError('')} />
    {route === 'dashboard' && <DayOverview habits={habits} records={completions} today={now} pulse={pulse} />}
    {['dashboard', 'habitos'].includes(route) && <HabitList habits={habits} records={completions} today={today} summary={route === 'dashboard'} onQuickCheckIn={quickCheckIn} onCheckIn={(habit, record) => setCheckIn({ habit, record })} onDelete={habit => { setDeleteError(''); setDeleting(habit) }} />}
    {route === 'historico' && <HistoryPanel habits={habits} records={completions} today={today} onEdit={(habit, record) => setCheckIn({ habit, record })} />}
    {route === 'progresso' && <ProgressPanel habits={habits} records={completions} settings={settings} today={today} />}
    {(route === 'novo-habito' || editing) && <HabitForm key={route} habit={editing} onSave={input => { saveHabit(input, editing?.id); navigate('/meus-habitos') }} />}
    {route === 'perfil' && <div className="profile-grid"><section className="panel profile-card"><div className="avatar">{profile.name.slice(0, 1).toUpperCase()}</div><h2>{profile.name}</h2><p className="muted break-all">{profile.email}</p><span className="badge">{user?.joinedAt ? `Por aqui desde ${formatDate(user.joinedAt)}` : 'Conta anterior · data de entrada não registrada'}</span><div className="profile-numbers"><div><strong>{habits.length}</strong><span>hábitos</span></div><div><strong>{checkIns}</strong><span>registros</span></div><div><strong>{bestStreak}</strong><span>melhor streak</span></div></div></section><ProfileForm profile={profile} onSave={next => { onProfileChange(next); setNotice('Perfil atualizado. Use o e-mail atualizado no próximo acesso.') }} /></div>}
    {route === 'configuracoes' && <div className="settings-stack"><section className="panel"><h2>Conta</h2><p className="muted mt-3">{profile.name} · {profile.email}</p><Link className="text-link" to="/dashboard/perfil">Editar dados básicos →</Link></section><SettingsForm key={JSON.stringify(settings)} settings={settings} onSave={next => { saveSettings(next); setNotice('Preferências salvas.') }} /><section className="panel"><h2>Sobre seus dados</h2><p className="muted mt-3 mb-5">Seus dados estão armazenados neste navegador nesta versão do StreakFlow. Não há sincronização entre dispositivos. Exporte uma cópia do perfil, hábitos, check-ins e preferências. Credenciais não são incluídas.</p><button className="secondary" onClick={exportData}>Exportar meus dados</button><br /><Link className="text-link" to="/privacidade">Privacidade e armazenamento →</Link></section></div>}
    {!pages[route] && route !== 'novo-habito' && !editing && <section className="panel"><EmptyState title="Página ou hábito não encontrado" text="O endereço pode ter mudado ou o hábito pode ter sido excluído." /><Link className="text-link" to="/meus-habitos">Voltar aos hábitos →</Link></section>}
    {checkIn && <CheckInForm habit={checkIn.habit} record={checkIn.record} onClose={() => setCheckIn(null)} onSave={saveRecord} onRemove={id => { removeCheckIn(id); setCheckIn(null); setNotice('Check-in removido. Seu progresso foi recalculado.') }} />}
    {deleting && <Modal title="Excluir hábito?" onClose={() => setDeleting(null)}><p className="muted">“{deleting.title}” e todos os seus check-ins serão removidos. Esta ação não pode ser desfeita.</p><Feedback message={deleteError} error onClose={() => setDeleteError('')} /><div className="form-actions mt-5"><button className="secondary" onClick={() => setDeleting(null)}>Manter hábito</button><button className="danger-button" onClick={() => { try { deleteHabit(deleting.id); setDeleting(null); setNotice('Hábito excluído.') } catch (cause) { setDeleteError(cause instanceof Error ? cause.message : 'Não foi possível excluir.') } }}>Excluir hábito</button></div></Modal>}
    <footer className="page-footer">StreakFlow · Um dia de cada vez.</footer>
  </div>
}
