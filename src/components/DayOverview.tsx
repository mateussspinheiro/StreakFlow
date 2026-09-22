import { getIndicators } from '../lib/streakflow'
import type { CheckIn, Habit } from '../lib/types'
import { Mascot } from './BrandLogo'
import Icon from './Icon'

export function Stat({ label, value, detail, icon = 'chart' }: { label: string; value: string | number; detail: string; icon?: 'target' | 'check' | 'chart' | 'flame' | 'history' }) {
  return <article className="panel stat"><div className="stat-label"><Icon name={icon} width={18} height={18} /><span>{label}</span></div><strong>{value}</strong><span>{detail}</span></article>
}

export default function DayOverview({ habits, records, today, pulse }: { habits: Habit[]; records: CheckIn[]; today: Date; pulse: number }) {
  const { completed, progress, currentStreak, bestStreak, scheduled, rest } = getIndicators({ habits, completions: records }, today)
  const finished = scheduled > 0 && completed === scheduled
  const resting = habits.length > 0 && scheduled === 0
  const remaining = scheduled - completed
  return <>
    <section className="stats-grid day-stats" aria-label="Resumo do dia">
      <Stat icon="target" label="Hábitos ativos" value={habits.length} detail="Na sua rotina" />
      <Stat icon="check" label="Concluídos hoje" value={`${completed}/${scheduled}`} detail={rest ? `${rest} em descanso planejado` : 'Registros completos'} />
      <Stat icon="chart" label="Progresso diário" value={resting ? '—' : `${progress}%`} detail="Sem descansos planejados" />
      <Stat icon="flame" label="Streak atual" value={`${currentStreak} dias`} detail="Maior sequência atual" />
      <Stat icon="history" label="Melhor streak" value={`${bestStreak} dias`} detail="Seu recorde registrado" />
    </section>
    <section className={`day-progress panel ${finished ? 'day-finished' : ''}`} aria-label="Progresso de hoje">
      <div className="day-progress-main"><p className="eyebrow">UM PASSO DE CADA VEZ</p><h2>{resting ? 'Descanso planejado' : finished ? 'Dia concluído' : 'Progresso de hoje'}</h2><p className="muted">{resting ? 'Hoje todos os hábitos estão em descanso planejado.' : finished ? 'Todos os hábitos planejados foram registrados.' : `${completed} de ${scheduled} hábitos concluídos`}</p><div className="progress-label"><span>{resting ? 'Sua sequência está preservada, sem somar conclusões.' : remaining === 1 ? 'Falta apenas 1 hábito para completar o dia.' : habits.length ? 'Encontre seu ritmo. O próximo registro conta.' : 'Comece criando seu primeiro hábito.'}</span><strong>{progress}%</strong></div><progress max={100} value={progress} aria-label="Porcentagem concluída hoje" /></div>
      <div className="streak-display"><Mascot key={pulse} size={68} animate={pulse > 0} /><strong>{currentStreak}</strong><span>dias seguidos</span></div>
    </section>
  </>
}
