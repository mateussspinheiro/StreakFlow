import type { Profile } from './types'

export interface DashboardContext {
  profile: Profile
  onProfileChange: (profile: Profile) => void
}
