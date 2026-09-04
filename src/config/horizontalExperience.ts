export const ENABLE_HORIZONTAL_EXPERIENCE = true

export const HORIZONTAL_EXPERIENCE_ACTIVE_EVENT =
  'officina:horizontal-active-change'
export const HORIZONTAL_EXPERIENCE_NAVIGATE_EVENT =
  'officina:horizontal-navigate'

export const HORIZONTAL_EXPERIENCE_DESKTOP_QUERY = '(min-width: 961px)'

export const horizontalExperienceConfig = {
  scrub: 0.9,
  transitionViewportRatio: 0.78,
  minimumTransitionDistance: 640,
} as const

export type HorizontalDirection = 'forward' | 'backward' | 'initial'

export type HorizontalActiveDetail = {
  sectionId: string
  direction: HorizontalDirection
}

export type HorizontalNavigateDetail = {
  sectionId: string
  behavior?: ScrollBehavior
}
