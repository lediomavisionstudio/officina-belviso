export const ENABLE_GLOBAL_CINEMATIC_BACKGROUND = true

export const globalCinematicBackgroundConfig = {
  image: {
    src: '/assets/officina-belviso-workshop.png',
  },
  desktop: {
    scale: 1.08,
    travel: 80,
  },
  tablet: {
    scale: 1.07,
    travel: 40,
  },
  scrub: 1.1,
} as const
