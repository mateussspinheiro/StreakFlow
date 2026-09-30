import { useId, useMemo, useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent } from 'react'
import { HEATMAP_STATE_LABELS } from '../lib/heatmap'
import type { HeatmapDay } from '../lib/heatmap'
import './HeatmapCalendar.css'

type HeatmapCalendarProps = {
  calendar: { days: HeatmapDay[]; weeks: (HeatmapDay | null)[][] }
  firstDayOfWeek: 0 | 1
  today: string
  onSelect: (date: string) => void
  compact?: boolean
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const STATES: HeatmapDay['state'][] = ['empty', 'low', 'partial', 'completed', 'excellent', 'rest']
const MARKS: Record<HeatmapDay['state'], string> = {
  empty: '−', low: '·', partial: '◐', completed: '✓', excellent: '✓✓', rest: 'Ⅱ',
}
const fullDate = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
})

export default function HeatmapCalendar({ calendar, firstDayOfWeek, today, onSelect, compact = false }: HeatmapCalendarProps) {
  const id = useId()
  const buttonRefs = useRef(new Map<string, HTMLButtonElement>())
  const [tabDate, setTabDate] = useState<string | null>(null)
  const [hoverDate, setHoverDate] = useState<string | null>(null)
  const [focusDate, setFocusDate] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const { days, weeks } = calendar
  const daysByDate = useMemo(() => new Map(days.map(day => [day.date, day])), [days])
  const activeDate = hoverDate ?? focusDate
  const activeDay = !dismissed && activeDate ? daysByDate.get(activeDate) : undefined
  const entryDate = tabDate && daysByDate.has(tabDate) ? tabDate : daysByDate.has(today) ? today : days.at(-1)?.date
  const weekdayOrder = Array.from({ length: 7 }, (_, index) => (index + firstDayOfWeek) % 7)
  const months = useMemo(() => {
    const spans: { key: string; label: string; start: number; length: number }[] = []
    const multipleYears = days[0]?.date.slice(0, 4) !== days.at(-1)?.date.slice(0, 4)
    weeks.forEach((week, index) => {
      const firstDay = week.find(day => day !== null)
      if (!firstDay) return
      const key = firstDay.date.slice(0, 7)
      const previous = spans.at(-1)
      if (previous?.key === key) previous.length += 1
      else {
        const date = new Date(`${firstDay.date}T12:00:00`)
        const month = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
        spans.push({ key, label: multipleYears ? `${month} ${date.getFullYear()}` : month, start: index + 1, length: 1 })
      }
    })
    return spans
  }, [days, weeks])

  function navigate(event: KeyboardEvent<HTMLButtonElement>, date: string) {
    if (event.key === 'Escape') {
      event.preventDefault()
      setDismissed(true)
      return
    }
    const index = days.findIndex(day => day.date === date)
    const offset: Record<string, number> = { ArrowUp: -1, ArrowDown: 1, ArrowLeft: -7, ArrowRight: 7 }
    const target = event.key === 'Home' ? 0 : event.key === 'End' ? days.length - 1 :
      event.key in offset ? Math.max(0, Math.min(days.length - 1, index + offset[event.key])) : null
    if (target === null) return
    event.preventDefault()
    setHoverDate(null)
    setDismissed(false)
    const button = buttonRefs.current.get(days[target].date)
    button?.focus({ preventScroll: true })
    button?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' })
  }

  return <div className={`heatmap-calendar${compact ? ' heatmap-calendar--compact' : ''}${days.length <= 35 ? ' heatmap-calendar--short' : ''}`}
    style={{ '--heatmap-weeks': Math.max(1, weeks.length) } as CSSProperties}>
    <div className="heatmap-interactive" onMouseLeave={() => setHoverDate(null)}>
      <div className="heatmap-board">
        <div className="heatmap-weekdays" aria-hidden="true">{weekdayOrder.map(weekday => <span key={weekday}>{WEEKDAYS[weekday]}</span>)}</div>
        <div className="heatmap-scroll">
          <div className="heatmap-scroll-content">
            <div className="heatmap-months" aria-hidden="true">{months.map(month => <span key={month.key}
              style={{ gridColumn: `${month.start} / span ${month.length}` }} title={month.label}>{month.label}</span>)}</div>
            <div role="grid" aria-label="Calendário de consistência. Cada célula representa um dia."
              aria-describedby={`${id}-instructions`} aria-rowcount={7} aria-colcount={weeks.length}
              className="heatmap-grid">
              {weekdayOrder.map((weekday, row) => <div role="row" aria-label={WEEKDAYS[weekday]} key={weekday} className="heatmap-weekday-row">
                {weeks.map((week, column) => {
                  const day = week[row]
                  return <div role="gridcell" key={column} aria-colindex={column + 1} aria-rowindex={row + 1} className="heatmap-grid-cell">
                    {day ? <button type="button" className={`heatmap-cell heatmap-state-${day.state}${day.date === today ? ' heatmap-cell--today' : ''}`}
                      ref={node => { if (node) buttonRefs.current.set(day.date, node); else buttonRefs.current.delete(day.date) }}
                      tabIndex={day.date === entryDate ? 0 : -1} aria-label={day.label} title={day.label}
                      aria-current={day.date === today ? 'date' : undefined}
                      aria-describedby={activeDay?.date === day.date ? `${id}-tooltip` : undefined}
                      data-active={activeDay?.date === day.date || undefined}
                      onMouseEnter={() => { setHoverDate(day.date); setDismissed(false) }}
                      onFocus={() => { setHoverDate(null); setTabDate(day.date); setFocusDate(day.date); setDismissed(false) }}
                      onBlur={() => setFocusDate(null)} onKeyDown={event => navigate(event, day.date)}
                      onClick={() => onSelect(day.date)}>
                      <span aria-hidden="true" className={`heatmap-mark heatmap-mark-${day.state}`}>{MARKS[day.state]}</span>
                    </button> : <span className="heatmap-padding" aria-hidden="true" />}
                  </div>
                })}
              </div>)}
            </div>
          </div>
        </div>
      </div>
      <div id={`${id}-tooltip`} role={activeDay ? 'tooltip' : undefined} className={`heatmap-day-preview${activeDay ? ' heatmap-day-preview--active' : ''}`}>
        {activeDay ? <>
          <div className="heatmap-preview-heading"><time dateTime={activeDay.date}>{fullDate(activeDay.date)}{activeDay.date === today && <span>Hoje</span>}</time>
            <span className="heatmap-preview-state"><span aria-hidden="true" className={`heatmap-swatch heatmap-state-${activeDay.state}`}>
              <span className={`heatmap-mark heatmap-mark-${activeDay.state}`}>{MARKS[activeDay.state]}</span>
            </span>{HEATMAP_STATE_LABELS[activeDay.state]}</span>
          </div>
          <div className="heatmap-day-counts">
            <span><strong>{activeDay.completed}</strong> concluídos</span><span><strong>{activeDay.partial}</strong> parciais</span>
            <span><strong>{activeDay.postponed}</strong> adiados</span><span><strong>{activeDay.pending}</strong> pendentes</span>
            <span><strong>{activeDay.skipped}</strong> não realizados</span><span><strong>{activeDay.plannedRest}</strong> descansos</span>
          </div>
          <p className="heatmap-preview-rate">{activeDay.completionRate === null ? 'Sem registros avaliáveis para a taxa.' : <><strong>{Math.round(activeDay.completionRate)}%</strong> de conclusão · registros sem descanso</>}</p>
        </> : <div className="heatmap-preview-empty"><span className="heatmap-preview-pointer" aria-hidden="true">↗</span><div>
          <strong>Cada dia conta uma história.</strong><p>Passe o mouse ou foque um dia para ver seu ritmo. Selecione para abrir os registros.</p>
        </div></div>}
      </div>
    </div>
    <div className="heatmap-legend" aria-label="Legenda do calendário">
      {STATES.map(state => <span key={state}><span className={`heatmap-swatch heatmap-state-${state}`} aria-hidden="true">
        <span className={`heatmap-mark heatmap-mark-${state}`}>{MARKS[state]}</span>
      </span>{HEATMAP_STATE_LABELS[state]}</span>)}
      <span className="heatmap-today-key"><span aria-hidden="true" />Hoje</span>
    </div>
    <p id={`${id}-instructions`} className="heatmap-instructions"><span>Setas navegam · Home/End vão aos extremos · Enter abre o dia · Esc oculta o detalhe.</span>
      {weeks.length > 9 && <span>Deslize o calendário para explorar o período.</span>}</p>
  </div>
}
