import { useState, type FormEvent } from 'react'
import type { CheckIn, CheckInInput, Habit } from '../lib/types'
import { dateKey } from '../lib/habits'
import { EFFORT_LABELS, INTENSITY_LABELS, STATUS_LABELS, formatDate } from '../lib/checkins'
import { addValues, getCheckInStatus, getQuickSteps, getTracking, isNumericTracking, MAX_VALUE } from '../lib/tracking'
import NumericProgress from './NumericProgress'
import Modal from './Modal'
import Field from './Field'
import Feedback from './Feedback'

export default function CheckInForm({ habit, record, onSave, onRemove, onClose }: { habit: Habit; record?: CheckIn; onSave: (input: CheckInInput) => void; onRemove: (id: string) => void; onClose: () => void }) {
  const tracking = getTracking(habit, record)
  const numeric = isNumericTracking(tracking)
  const [status, setStatus] = useState<CheckIn['status']>(numeric && (!record || record.status === 'completed' || record.status === 'partial') ? 'pending' : record?.status ?? 'completed')
  const [value, setValue] = useState(String(record?.value ?? 0))
  const amount = value.trim() ? Number(value) : 0
  const validAmount = Number.isFinite(amount) && amount >= 0 && amount <= MAX_VALUE
  const options: CheckIn['status'][] = numeric ? ['pending', 'postponed'] : ['pending', 'completed', 'partial', 'postponed']
  if (tracking.allowPlannedRest) options.push('planned_rest')
  if (record?.status === 'skipped') options.push('skipped')
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
      onSave({ habitId: habit.id, date, time: String(data.get('time') || '') || undefined, status, effort, durationMinutes: data.get('duration') ? Number(data.get('duration')) : undefined, note, value: numeric ? amount : undefined, intensity: (String(data.get('intensity') || '') || undefined) as CheckIn['intensity'] })
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível salvar.') }
  }
  return <Modal title={record ? 'Editar check-in' : 'Registrar check-in'} onClose={onClose}>
    <div className="checkin-heading"><span className="eyebrow">{formatDate(date)}</span><h3>{habit.title}</h3><p className="muted">Registre o que foi possível hoje.</p></div>
    <form onSubmit={submit} className="form-stack" onChange={() => setError('')}>
      {numeric && <><label>Valor total do dia ({tracking.unit})<input className="w-full" type="number" min={0} max={MAX_VALUE} step="any" value={value} onChange={event => { setValue(event.target.value); setStatus('pending') }} /></label>{validAmount && <><NumericProgress config={tracking} value={amount} label={habit.title} /><p className="muted">Status ao salvar: {STATUS_LABELS[getCheckInStatus(tracking, amount, status)]}</p></>}<div className="quick-actions">{getQuickSteps(tracking).map(step => <button type="button" className="secondary" key={step.label} onClick={() => { try { setValue(String(addValues(amount, step.value))); setStatus('pending') } catch (cause) { setError(cause instanceof Error ? cause.message : 'Valor inválido.') } }}>{step.label}</button>)}<button type="button" className="secondary" onClick={() => { setValue(String(Math.max(validAmount ? amount : 0, tracking.target!))); setStatus('pending') }}>Atingir meta</button></div><p className="muted">A meta deste registro é {tracking.target?.toLocaleString('pt-BR')} {tracking.unit}. O valor informado substitui o total; os atalhos somam. Salve para confirmar.</p></>}
      <fieldset><legend>{numeric ? 'Situação do dia' : 'Status'}</legend><div className="choice-grid">{options.map(option => <button type="button" key={option} aria-pressed={status === option} className="choice" onClick={() => setStatus(option)}>{numeric && option === 'pending' ? 'Usar valor registrado' : STATUS_LABELS[option]}</button>)}</div></fieldset>
      <p className="muted">Somente conclusões somam à sequência e à meta semanal. Descansos permitidos preservam a sequência sem aumentá-la.</p>
      <fieldset><legend>Como foi hoje? <span className="muted">(opcional)</span></legend><div className="effort-grid">{EFFORT_LABELS.map((label, index) => <button type="button" className="choice" key={label} aria-pressed={effort === index + 1} onClick={() => setEffort(effort === index + 1 ? undefined : (index + 1) as CheckIn['effort'])}><strong>{index + 1}</strong><span>{label}</span></button>)}</div></fieldset>
      <div className="form-columns"><Field name="time" label="Horário" type="time" defaultValue={time} />{tracking.trackingType !== 'duration' && <Field name="duration" label="Duração em minutos (opcional)" type="number" min={1} max={1440} step={1} defaultValue={record?.durationMinutes} placeholder={habit.estimatedMinutes ? `Estimativa: ${habit.estimatedMinutes}` : 'Ex.: 20'} />}</div>
      {(tracking.trackingType === 'qualitative' || record?.intensity) && <label>Intensidade (opcional)<select name="intensity" defaultValue={record?.intensity ?? ''}><option value="">Não informar</option>{Object.entries(INTENSITY_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>}
      <label>Observação (opcional)<textarea rows={3} maxLength={500} value={note} onChange={event => setNote(event.target.value)} placeholder="Como foi essa realização?" /><span className="muted character-count">{note.length}/500</span></label>
      <Feedback message={error} error onClose={() => setError('')} />
      <div className="form-actions"><button className="primary" type="submit">Salvar check-in</button><button className="secondary" type="button" onClick={onClose}>Cancelar</button></div>
      {record && <div className="remove-record">{confirmRemove ? <><p>Remover este check-in e recalcular seu progresso?</p><div className="form-actions"><button type="button" className="danger-button" onClick={() => { try { onRemove(record.id) } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível remover.') } }}>Confirmar remoção</button><button type="button" className="secondary" onClick={() => setConfirmRemove(false)}>Manter registro</button></div></> : <button type="button" className="quiet-button danger-text" onClick={() => setConfirmRemove(true)}>Desfazer check-in</button>}</div>}
    </form>
  </Modal>
}
