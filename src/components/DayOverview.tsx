import { getIndicators } from '../lib/streakflow'
import type { CheckIn, Habit } from '../lib/types'
import { Mascot } from './BrandLogo'
import Icon from './Icon'

export function Stat({ label, value, detail, icon = 'chart' }: { label: string; value: string | number; detail: string; icon?: 'target' | 'check' | 'chart' | 'flame' | 'history' }) {
  return <article className="panel stat"><div className="stat-label"><Icon name={icon} width={18} height={18} /><span>{label}</span></div><strong>{value}</strong><span>{detail}</span></article>
}

export default function DayOverview({ habits, records, today, pulse }: { habits: Habit[]; records: CheckIn[]; today: Date; pulse: number }) {
  const { completed, progress, currentStreak, bestStreak } = getIndicators({ habits, completions: records }, today)
  const finished = habits.length > 0 && completed === habits.length
  const remaining = habits.length - completed
  return <>
    <section className="stats-grid day-stats" aria-label="Resumo do dia">
      <Stat icon="target" label="Hábitos ativos" value={habits.length} detail="Na sua rotina" />
      <Stat icon="check" label="Concluídos hoje" value={`${completed}/${habits.length}`} detail="Registros completos" />
      <Stat icon="chart" label="Progresso diário" value={`${progress}%`} detail="Dos hábitos ativos" />
      <Stat icon="flame" label="Streak atual" value={`${currentStreak} dias`} detail="Maior sequência atual" />
      <Stat icon="history" label="Melhor streak" value={`${bestStreak} dias`} detail="Seu recorde registrado" />
    </section>
    <section className={`day-progress panel ${finished ? 'day-finished' : ''}`} aria-label="Progresso de hoje">
      <div className="day-progress-main"><p className="eyebrow">UM PASSO DE CADA VEZ</p><h2>{finished ? 'Dia concluído' : 'Progresso de hoje'}</h2><p className="muted">{finished ? 'Todos os hábitos planejados foram registrados.' : `${completed} de ${habits.length} hábitos concluídos`}</p><div className="progress-label"><span>{remaining === 1 ? 'Falta apenas 1 hábito para completar o dia.' : habits.length ? 'Encontre seu ritmo. O próximo registro conta.' : 'Comece criando seu primeiro hábito.'}</span><strong>{progress}%</strong></div><progress max={100} value={progress} aria-label="Porcentagem concluída hoje" /></div>
      <div className="streak-display"><Mascot key={pulse} size={68} animate={pulse > 0} /><strong>{currentStreak}</strong><span>dias seguidos</span></div>
    </section>
  </>
}
