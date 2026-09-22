import { useState, type FormEvent } from 'react'
import type { CheckIn, CheckInInput, Habit } from '../lib/types'
import { dateKey } from '../lib/habits'
import { EFFORT_LABELS, STATUS_LABELS, formatDate } from '../lib/checkins'
import Modal from './Modal'
import Field from './Field'
import Feedback from './Feedback'

export default function CheckInForm({ habit, record, onSave, onRemove, onClose }: { habit: Habit; record?: CheckIn; onSave: (input: CheckInInput) => void; onRemove: (id: string) => void; onClose: () => void }) {
  const [status, setStatus] = useState<CheckIn['status']>(record?.status ?? 'completed')
  const [effort, setEffort] = useState<CheckIn['effort']>(record?.effort)
  const [note, setNote] = useState(record?.note ?? '')
  const [error, setError] = useState('')
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [now] = useState(() => new Date())
  const date = record?.date ?? dateKey(now)
  const time = record ? record.time : `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    try {
      onSave({ habitId: habit.id, date, time: String(data.get('time') || '') || undefined, status, effort, durationMinutes: data.get('duration') ? Number(data.get('duration')) : undefined, note })
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível salvar.') }
  }
  return <Modal title={record ? 'Editar check-in' : 'Registrar check-in'} onClose={onClose}>
    <div className="checkin-heading"><span className="eyebrow">{formatDate(date)}</span><h3>{habit.title}</h3><p className="muted">Registre o que foi possível hoje.</p></div>
    <form onSubmit={submit} className="form-stack" onChange={() => setError('')}>
      <fieldset><legend>Status</legend><div className="choice-grid">{(Object.keys(STATUS_LABELS) as CheckIn['status'][]).map(value => <button type="button" key={value} aria-pressed={status === value} className="choice" onClick={() => setStatus(value)}>{STATUS_LABELS[value]}</button>)}</div></fieldset>
      <p className="muted">Somente “Concluído” conta para o streak e a meta semanal.</p>
      <fieldset><legend>Como foi hoje? <span className="muted">(opcional)</span></legend><div className="effort-grid">{EFFORT_LABELS.map((label, index) => <button type="button" className="choice" key={label} aria-pressed={effort === index + 1} onClick={() => setEffort(effort === index + 1 ? undefined : (index + 1) as CheckIn['effort'])}><strong>{index + 1}</strong><span>{label}</span></button>)}</div></fieldset>
      <div className="form-columns"><Field name="time" label="Horário" type="time" defaultValue={time} /><Field name="duration" label="Duração em minutos (opcional)" type="number" min={1} max={1440} step={1} defaultValue={record?.durationMinutes} placeholder={habit.estimatedMinutes ? `Estimativa: ${habit.estimatedMinutes}` : 'Ex.: 20'} /></div>
      <label>Observação (opcional)<textarea rows={3} maxLength={500} value={note} onChange={event => setNote(event.target.value)} placeholder="Como foi essa realização?" /><span className="muted character-count">{note.length}/500</span></label>
      <Feedback message={error} error onClose={() => setError('')} />
      <div className="form-actions"><button className="primary" type="submit">Salvar check-in</button><button className="secondary" type="button" onClick={onClose}>Cancelar</button></div>
      {record && <div className="remove-record">{confirmRemove ? <><p>Remover este check-in e recalcular seu progresso?</p><div className="form-actions"><button type="button" className="danger-button" onClick={() => { try { onRemove(record.id) } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível remover.') } }}>Confirmar remoção</button><button type="button" className="secondary" onClick={() => setConfirmRemove(false)}>Manter registro</button></div></> : <button type="button" className="quiet-button danger-text" onClick={() => setConfirmRemove(true)}>Desfazer check-in</button>}</div>}
    </form>
  </Modal>
}
