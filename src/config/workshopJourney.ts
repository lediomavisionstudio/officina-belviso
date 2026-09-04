export const ENABLE_WORKSHOP_JOURNEY = true
export const WORKSHOP_JOURNEY_DEBUG = false

export const WORKSHOP_JOURNEY_ACTIVE_EVENT =
  'officina:workshop-journey-active'
export const WORKSHOP_JOURNEY_NAVIGATE_EVENT =
  'officina:workshop-journey-navigate'

export const WORKSHOP_JOURNEY_PANEL_IDS = [
  'home',
  'chi-siamo',
  'servizi',
] as const

export const workshopJourneyConfig = {
  desktopQuery: '(min-width: 961px)',
  scrub: 0.95,
  transitionViewportRatio: 0.82,
  minimumTransitionDistance: 680,
  panelExitScale: 0.97,
  panelEntryScale: 1.03,
} as const

export type WorkshopJourneyPanelId =
  (typeof WORKSHOP_JOURNEY_PANEL_IDS)[number]
export type WorkshopJourneyDirection = 'forward' | 'backward' | 'initial'

export type WorkshopJourneyActiveDetail = {
  sectionId: WorkshopJourneyPanelId
  direction: WorkshopJourneyDirection
}

export type WorkshopJourneyNavigateDetail = {
  sectionId: WorkshopJourneyPanelId
  behavior?: ScrollBehavior
}

export function isWorkshopJourneyPanel(
  sectionId: string,
): sectionId is WorkshopJourneyPanelId {
  return WORKSHOP_JOURNEY_PANEL_IDS.includes(
    sectionId as WorkshopJourneyPanelId,
  )
}
