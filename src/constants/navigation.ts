export const homeNavigation = [
  { id: 'home', label: 'Home' },
  { id: 'chi-siamo', label: 'Chi siamo' },
  { id: 'servizi', label: 'Servizi' },
  { id: 'galleria', label: 'I nostri lavori' },
  { id: 'richiedi-preventivo', label: 'Descrivi problema' },
  { id: 'lavora-con-noi', label: 'Lavora con noi' },
] as const

export type HomeSectionId = (typeof homeNavigation)[number]['id']

export const homeAuxiliaryTargets = ['officina-info'] as const
export type HomeScrollTargetId =
  | HomeSectionId
  | (typeof homeAuxiliaryTargets)[number]

export const NAV_ACTIVE_DEBUG = false

export function isHomeSectionId(value: unknown): value is HomeSectionId {
  return (
    typeof value === 'string' &&
    homeNavigation.some((item) => item.id === value)
  )
}

export function isHomeScrollTargetId(
  value: unknown,
): value is HomeScrollTargetId {
  return (
    isHomeSectionId(value) ||
    (typeof value === 'string' &&
      homeAuxiliaryTargets.some((target) => target === value))
  )
}

export function getNavigationSectionId(
  targetId: HomeScrollTargetId,
): HomeSectionId {
  return targetId === 'officina-info' ? 'richiedi-preventivo' : targetId
}
