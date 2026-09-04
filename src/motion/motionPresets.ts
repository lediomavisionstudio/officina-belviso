import { motionTokens } from './motionTokens'

export function createRevealPreset(compact = false) {
  return {
    from: {
      autoAlpha: 0,
      y: compact ? motionTokens.distance.mobileReveal : motionTokens.distance.reveal,
    },
    to: {
      autoAlpha: 1,
      y: 0,
      duration: compact ? 0.56 : motionTokens.duration.reveal,
      ease: motionTokens.ease.enter,
      clearProps: 'opacity,visibility,transform,willChange',
    },
  }
}

export function createBoundedStagger(itemCount: number, compact = false) {
  const step = compact ? motionTokens.stagger.mobile : motionTokens.stagger.tight

  return {
    amount: Math.min(Math.max(0, itemCount - 1) * step, motionTokens.stagger.maximumSpan),
    from: 'start' as const,
  }
}

export const heroMotionPreset = {
  copyFrom: { autoAlpha: 0, y: motionTokens.distance.hero },
  copyTo: {
    autoAlpha: 1,
    y: 0,
    ease: motionTokens.ease.enter,
    clearProps: 'opacity,visibility,transform,willChange',
  },
  backgroundFrom: { scale: 1.03 },
  backgroundTo: {
    scale: 1,
    duration: motionTokens.duration.heroBackground,
    ease: motionTokens.ease.enter,
    clearProps: 'transform,willChange',
  },
} as const
