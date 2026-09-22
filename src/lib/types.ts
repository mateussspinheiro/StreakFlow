export type Profile = { name: string; email: string }

export type User = { profile: Profile; salt: number[]; verifier: string; joinedAt?: string }

export type TrackingType = 'binary' | 'quantity' | 'duration' | 'qualitative'
export type TrackingConfig = {
  trackingType: TrackingType
  target?: number
  unit?: string
  allowPlannedRest: boolean
}

export type Habit = {
  id: number
  title: string
  category: string
  description: string
  weeklyGoal: number
  createdAt: string
  estimatedMinutes?: number
  color?: 'purple' | 'violet' | 'indigo' | 'gray'
} & Partial<TrackingConfig>

export type HabitInput = Pick<Habit, 'title' | 'category' | 'description' | 'weeklyGoal' | 'estimatedMinutes' | 'color' | 'trackingType' | 'target' | 'unit' | 'allowPlannedRest'>
export type CheckInStatus = 'pending' | 'partial' | 'completed' | 'postponed' | 'planned_rest' | 'skipped'
export type CheckIn = {
  id: string
  habitId: number
  date: string
  time?: string // Registros migrados não têm horário conhecido.
  status: CheckInStatus
  effort?: 1 | 2 | 3 | 4 | 5
  durationMinutes?: number
  note?: string
  value?: number
  tracking?: TrackingConfig // Meta/unidade vigentes no primeiro registro desse dia.
  intensity?: 'light' | 'moderate' | 'intense'
}
export type CheckInInput = Omit<CheckIn, 'id'>
export type Completion = CheckIn
export type Settings = {
  compact: boolean
  habitReminders: boolean
  weeklySummary: boolean
  firstDayOfWeek: 0 | 1
  theme: 'light' | 'dark' | 'system'
}

export type StreakFlowData = {
  version: 3
  user: User | null
  habits: Habit[]
  completions: Completion[]
  settings: Settings
}

export type StreakFlowState = StreakFlowData & {
  authenticated: boolean
  storageError: string | null
}
