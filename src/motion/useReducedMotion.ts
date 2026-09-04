import { useSyncExternalStore } from 'react'
import { reducedMotionQuery } from './motionTokens'

function subscribe(callback: () => void) {
  const mediaQuery = window.matchMedia(reducedMotionQuery)
  mediaQuery.addEventListener('change', callback)
  return () => mediaQuery.removeEventListener('change', callback)
}

function getSnapshot() {
  return window.matchMedia(reducedMotionQuery).matches
}

export function useReducedMotion() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}
