import { useState } from 'react'
import type { Settings } from '../lib/types'
import Feedback from './Feedback'

export default function SettingsForm({ settings, onSave }: { settings: Settings; onSave: (settings: Settings) => void }) {
  const [draft, setDraft] = useState(settings)
  const [error, setError] = useState('')
  return <form className="settings-stack" onChange={() => setError('')} onSubmit={event => {
    event.preventDefault()
    try { onSave(draft) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível salvar as preferências.') }
  }}>
    <section className="panel form-stack"><h2>Hábitos</h2><label>Primeiro dia da semana<select value={draft.firstDayOfWeek} onChange={e => setDraft({ ...draft, firstDayOfWeek: Number(e.target.value) as 0 | 1 })}><option value={1}>Segunda-feira</option><option value={0}>Domingo</option></select></label><p className="muted">Define o período das metas semanais em Progresso.</p>
      <label className="setting-row"><span><strong>Lembretes de hábitos</strong><span className="muted block">Tenho interesse em receber lembretes.</span></span><input type="checkbox" role="switch" checked={draft.habitReminders} onChange={e => setDraft({ ...draft, habitReminders: e.target.checked })} /></label>
      <label className="setting-row"><span><strong>Resumo semanal</strong><span className="muted block">Tenho interesse em um resumo da semana.</span></span><input type="checkbox" role="switch" checked={draft.weeklySummary} onChange={e => setDraft({ ...draft, weeklySummary: e.target.checked })} /></label><p className="muted">Apenas preferências nesta versão. Nenhuma notificação ou mensagem será enviada.</p>
    </section>
    <section className="panel form-stack"><h2>Aparência</h2><fieldset><legend>Tema</legend><div className="choice-grid">{([['light', 'Claro'], ['dark', 'Escuro'], ['system', 'Sistema']] as const).map(([value, label]) => <button type="button" key={value} className="choice" aria-pressed={draft.theme === value} onClick={() => setDraft({ ...draft, theme: value })}>{label}</button>)}</div></fieldset><p className="muted">A preferência será aplicada ao salvar. “Sistema” acompanha o tema do dispositivo.</p><label className="setting-row"><span><strong>Visualização compacta</strong><span className="muted block">Menos espaçamento nos cards de hábitos.</span></span><input type="checkbox" role="switch" checked={draft.compact} onChange={e => setDraft({ ...draft, compact: e.target.checked })} /></label></section>
    <Feedback message={error} error onClose={() => setError('')} /><div><button type="submit" className="primary">Salvar preferências</button></div>
  </form>
}
