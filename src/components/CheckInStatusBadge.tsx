import type { CheckInStatus } from '../lib/types'
import { STATUS_LABELS } from '../lib/checkins'
import Icon from './Icon'

const icons = { pending: 'pending', partial: 'partial', completed: 'check', postponed: 'postponed', planned_rest: 'rest', skipped: 'postponed' } as const
export default function CheckInStatusBadge({ status = 'pending' }: { status?: CheckInStatus }) {
  return <span className={`badge checkin-status status-${status}`}><Icon name={icons[status]} width={15} height={15} />{STATUS_LABELS[status]}</span>
}
