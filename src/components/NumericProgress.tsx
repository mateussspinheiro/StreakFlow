import { calculateProgressPercentage } from '../lib/tracking'
import type { TrackingConfig } from '../lib/types'

const format = (value: number) => value.toLocaleString('pt-BR', { maximumFractionDigits: 6 })
export default function NumericProgress({ config, value = 0, label }: { config: TrackingConfig; value?: number; label: string }) {
  const { percentage, visualPercentage } = calculateProgressPercentage(value, config.target!)
  return <div className="numeric-progress"><div><span>{format(value)} / {format(config.target!)} {config.unit}</span><strong>{format(percentage)}%</strong></div><progress value={visualPercentage} max={100} aria-label={`Progresso de ${label}`} aria-valuetext={`${format(value)} de ${format(config.target!)} ${config.unit}, ${format(percentage)}%`} /></div>
}
