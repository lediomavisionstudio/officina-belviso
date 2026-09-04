export const homeNavigation = [
  { id: 'home', label: 'Home' },
  { id: 'chi-siamo', label: 'Chi siamo' },
  { id: 'servizi', label: 'Servizi' },
  { id: 'galleria', label: 'I nostri lavori' },
  { id: 'richiedi-preventivo', label: 'Descrivi problema' },
  { id: 'lavora-con-noi', label: 'Lavora con noi' },
] as const

export type HomeSectionId = (typeof homeNavigation)[number]['id']

export const NAV_ACTIVE_DEBUG = false

export function isHomeSectionId(value: unknown): value is HomeSectionId {
  return (
    typeof value === 'string' &&
    homeNavigation.some((item) => item.id === value)
  )
}
