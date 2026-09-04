export const reducedMotionQuery = '(prefers-reduced-motion: reduce)'

// Toggle locally when calibrating ScrollTrigger positions. Never enable in production.
export const MOTION_DEBUG = false

export const motionTokens = {
  duration: {
    hover: 0.32,
    micro: 0.36,
    reveal: 0.86,
    section: 1,
    heroBackground: 1.45,
    carousel: 0.58,
    reviewExit: 0.24,
    reviewEnter: 0.36,
  },
  ease: {
    standard: 'power2.out',
    enter: 'power3.out',
    state: 'power2.inOut',
    exit: 'power2.in',
  },
  stagger: {
    tight: 0.08,
    normal: 0.12,
    mobile: 0.08,
    maximumSpan: 0.62,
  },
  distance: {
    hero: 50,
    reveal: 58,
    mobileReveal: 30,
    footer: 44,
    review: 20,
  },
  hover: {
    lift: -10,
    scale: 1.025,
    imageScale: 1.08,
  },
} as const

export type MotionTokens = typeof motionTokens
