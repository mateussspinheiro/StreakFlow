import { useSyncExternalStore } from 'react'
import { getState, subscribe } from './streakflow'

export function useStreakFlow() {
  return useSyncExternalStore(subscribe, getState)
}
