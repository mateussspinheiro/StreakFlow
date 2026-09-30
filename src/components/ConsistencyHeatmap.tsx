import { useId, useMemo, useState } from 'react'
import { Link } from 'react-router'
import type { CheckIn, Habit, Settings } from '../lib/types'
import { buildHeatmapCalendar, getHeatmapRange, summarizeHeatmap } from '../lib/heatmap'
import { formatDate, INTENSITY_LABELS } from '../lib/checkins'
import { getTracking, isNumericTracking, MAX_VALUE } from '../lib/tracking'
import HeatmapCalendar from './HeatmapCalendar'
import CheckInStatusBadge from './CheckInStatusBadge'
import NumericProgress from './NumericProgress'
import Modal from './Modal'
import Icon from './Icon'
import './ConsistencyHeatmap.css'

type Props = {
  habits: Habit[]
  records: CheckIn[]
  settings: Settings
  today: string
  compact?: boolean
}

const PERIODS = [30, 90, 180, 365]

export default function ConsistencyHeatmap({ habits, records, settings, today, compact = false }: Props) {
  const titleId = useId()
  const [period, setPeriod] = useState(90)
  const [habitId, setHabitId] = useState('')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const effectivePeriod = compact ? 30 : period
  const effectiveHabitId = !compact && habits.some(habit => String(habit.id) === habitId) ? Number(habitId) : undefined
  const { calendar, summary, range } = useMemo(() => {
    const range = getHeatmapRange(effectivePeriod, today)
    const calendar = buildHeatmapCalendar(records, { ...range, habitId: effectiveHabitId, firstDayOfWeek: settings.firstDayOfWeek })
    return { calendar, summary: summarizeHeatmap(calendar.days), range }
  }, [records, effectivePeriod, effectiveHabitId, settings.firstDayOfWeek, today])
  const habitNames = useMemo(() => new Map(habits.map(habit => [habit.id, habit.title])), [habits])
  const selectedDay = calendar.days.find(day => day.date === selectedDate)

  return <section className={`panel consistency-heatmap ${compact ? 'consistency-preview' : ''}`} aria-labelledby={titleId}>
    <div className="heatmap-intro">
      <div>
        <p className="eyebrow">{compact ? 'SEU RITMO, DIA A DIA' : 'CADA DIA CONTA'}</p>
        <h2 id={titleId}>{compact ? 'Consistência recente' : 'Seu mapa de consistência'}</h2>
        <p className="muted">{compact ? 'Uma janela para os seus últimos 30 dias.' : 'Pequenos passos deixam marcas. Veja como sua rotina ganha forma.'}</p>
      </div>
      {!compact && <span className="heatmap-heading-icon"><Icon name="chart" width={25} height={25} /></span>}
      {compact && <>
        <p className="heatmap-preview-stat"><strong>{summary.activeDays}<span> / 30</span></strong><span>dias com progresso</span></p>
        <p className="muted">{summary.totalCheckIns} check-ins · {summary.restDays} dias com descanso</p>
        <Link className="text-link" to="/progresso">Explorar meu progresso <span aria-hidden="true">↗</span></Link>
      </>}
    </div>

    <div className="heatmap-body">
      {!compact && <div className="heatmap-filters">
        <fieldset><legend>Período</legend><div className="heatmap-periods">{PERIODS.map(value => <button key={value} type="button" aria-pressed={period === value} onClick={() => { setPeriod(value); setSelectedDate(null) }}>{value} dias</button>)}</div></fieldset>
        <label>Hábito<select value={effectiveHabitId ?? ''} onChange={event => { setHabitId(event.target.value); setSelectedDate(null) }}><option value="">Todos os hábitos</option>{habits.map(habit => <option value={habit.id} key={habit.id}>{habit.title}</option>)}</select></label>
      </div>}

      {!compact && <div className="heatmap-summary" role="status" aria-atomic="true">
        <dl>
          <div><dt>Dias com progresso</dt><dd>{summary.activeDays}<span> / {summary.totalDays}</span></dd><dd className="heatmap-summary-detail">{Math.round(summary.activeRate)}% do período</dd></div>
          <div><dt>Dias com conclusão</dt><dd>{summary.completionDays}</dd><dd className="heatmap-summary-detail">Ao menos um hábito concluído</dd></div>
          <div><dt>Dias com descanso</dt><dd>{summary.restDays}</dd><dd className="heatmap-summary-detail">Inclui dias com outros registros</dd></div>
          <div><dt>Check-ins no período</dt><dd>{summary.totalCheckIns}</dd><dd className="heatmap-summary-detail">Todos os status registrados</dd></div>
        </dl>
      </div>}

      <div className="heatmap-range"><span><time dateTime={range.start}>{formatDate(range.start)}</time><span aria-hidden="true"> — </span><span className="sr-only"> até </span><time dateTime={range.end}>{formatDate(range.end)}</time></span><span className="heatmap-today-label">Ponto = hoje</span></div>
      <HeatmapCalendar key={`${effectivePeriod}:${effectiveHabitId ?? 'all'}:${settings.firstDayOfWeek}`} calendar={calendar} firstDayOfWeek={settings.firstDayOfWeek} today={today} compact={compact} onSelect={setSelectedDate} />

      {!summary.totalCheckIns && <div className="heatmap-empty"><Icon name="target" width={22} height={22} /><div><strong>{records.length ? 'Nenhum registro neste recorte.' : 'Seu próximo passo começa a preencher este mapa.'}</strong><p className="muted">{records.length ? 'Experimente outro período ou hábito para encontrar seus check-ins.' : 'Conclusões, passos parciais e descansos planejados terão seu lugar aqui.'}</p>{!habits.length && <Link className="text-link" to="/dashboard/novo-habito">Criar meu primeiro hábito →</Link>}</div></div>}

      {!compact && <p className="heatmap-method">Dias com progresso têm ao menos uma conclusão ou registro parcial. Descansos têm seu próprio símbolo e não somam conclusões. A taxa diária considera somente check-ins, excluindo descansos.</p>}
    </div>

    {selectedDay && <Modal title={formatDate(selectedDay.date)} onClose={() => setSelectedDate(null)} className="heatmap-day-modal">
      <p className="muted heatmap-day-summary">{selectedDay.label}</p>
      {!selectedDay.total ? <div className="heatmap-empty"><Icon name="history" /><div><strong>Um dia sem registros.</strong><p className="muted">Nenhum check-in encontrado para os filtros selecionados.</p></div></div> : <div className="history-list">{selectedDay.records.map(record => {
        const name = habitNames.get(record.habitId) ?? 'Hábito não encontrado'
        const config = getTracking({}, record)
        const hasNumericProgress = isNumericTracking(config) && typeof config.target === 'number' && config.target >= 0.000001 && config.target <= MAX_VALUE && typeof record.value === 'number' && record.value >= 0 && record.value <= MAX_VALUE
        return <article className="checkin-card" key={record.id}>
          <div className="section-heading"><h3>{name}</h3><CheckInStatusBadge status={record.status} /></div>
          {hasNumericProgress && <NumericProgress config={config} value={record.value} label={name} />}
          {isNumericTracking(config) && !hasNumericProgress && <p className="muted">Medição não informada neste registro.</p>}
          <div className="habit-meta">{record.time && <span>Às {record.time}</span>}{record.durationMinutes !== undefined && <span>{record.durationMinutes} min</span>}{record.intensity && <span>Intensidade: {INTENSITY_LABELS[record.intensity]}</span>}</div>
          {record.note && <p className="checkin-note">{record.note}</p>}
        </article>
      })}</div>}
      <p className="heatmap-method">Os detalhes respeitam o hábito selecionado. Metas e unidades são as salvas no dia do check-in.</p>
    </Modal>}
  </section>
}
