export const ENABLE_CINEMATIC_PARALLAX = true

export const cinematicParallaxConfig = {
  desktop: {
    hero: { travel: 64, scale: 1.08 },
    about: { travel: 34, scale: 1.035 },
    cards: { travel: 22, scale: 1.03 },
  },
  tablet: {
    hero: { travel: 40, scale: 1.065 },
    about: { travel: 20, scale: 1.025 },
    cards: { travel: 13, scale: 1.022 },
  },
  mobile: {
    hero: { travel: 22, scale: 1.045 },
    about: { travel: 11, scale: 1.018 },
    cards: { travel: 7, scale: 1.015 },
  },
  variations: [1, 0.86, 1.08, 0.93, 1.04, 0.89] as const,
  scrub: 0.85,
} as const

export type CinematicParallaxViewport =
  keyof Pick<typeof cinematicParallaxConfig, 'desktop' | 'tablet' | 'mobile'>
