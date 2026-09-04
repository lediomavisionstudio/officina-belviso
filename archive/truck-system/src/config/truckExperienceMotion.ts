export const truckExperienceMotion = Object.freeze({
  easing: {
    entrance: 'power3.out',
    exit: 'power2.inOut',
    focus: 'power3.inOut',
    continuous: 'sine.inOut',
  },
  explorer: {
    enterDuration: 0.74,
    exitDuration: 0.58,
    navigationDelay: 0.28,
    panelDelay: 0.38,
  },
  selection: {
    totalDuration: 0.82,
    cameraStart: 0.05,
    hotspotStart: 0.11,
    lightingStart: 0.16,
    calloutStart: 0.2,
    panelStart: 0.3,
    panelSwapDuration: 0.16,
    panelRevealDuration: 0.24,
    ctaStart: 0.58,
    ctaRevealDuration: 0.2,
  },
  idle: {
    duration: 6.8,
    translateY: -1.5,
    scale: 1.0025,
  },
})
