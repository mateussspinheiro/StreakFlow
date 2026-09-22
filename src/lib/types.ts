export type Profile = { name: string; email: string }

export type User = { profile: Profile; salt: number[]; verifier: string; joinedAt?: string }

export type Habit = {
  id: number
  title: string
  category: string
  description: string
  weeklyGoal: number
  createdAt: string
  estimatedMinutes?: number
  color?: 'purple' | 'violet' | 'indigo' | 'gray'
}

export type HabitInput = Pick<Habit, 'title' | 'category' | 'description' | 'weeklyGoal' | 'estimatedMinutes' | 'color'>
export type CheckInStatus = 'completed' | 'partial' | 'skipped'
export type CheckIn = {
  id: string
  habitId: number
  date: string
  time?: string // Registros migrados não têm horário conhecido.
  status: CheckInStatus
  effort?: 1 | 2 | 3 | 4 | 5
  durationMinutes?: number
  note?: string
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
