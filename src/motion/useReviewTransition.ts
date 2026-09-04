import type { Dispatch, RefObject, SetStateAction } from 'react'
import { useCallback, useEffect, useRef } from 'react'
import gsap from 'gsap'
import { motionTokens } from './motionTokens'
import { useReducedMotion } from './useReducedMotion'

export function useReviewTransition(
  scope: RefObject<HTMLElement | null>,
  activeReview: number,
  setActiveReview: Dispatch<SetStateAction<number>>,
) {
  const reducedMotion = useReducedMotion()
  const tweenRef = useRef<gsap.core.Tween | null>(null)
  const animationFrameRef = useRef(0)

  const changeReview = useCallback(
    (nextReview: number) => {
      if (nextReview === activeReview) return

      const direction = nextReview > activeReview ? 1 : -1
      const article = scope.current?.querySelector<HTMLElement>('.google-review')
      tweenRef.current?.kill()
      window.cancelAnimationFrame(animationFrameRef.current)

      if (!article || reducedMotion) {
        setActiveReview(nextReview)
        return
      }

      tweenRef.current = gsap.to(article, {
        autoAlpha: 0,
        x: -direction * motionTokens.distance.review,
        duration: motionTokens.duration.reviewExit,
        ease: motionTokens.ease.exit,
        onComplete: () => {
          setActiveReview(nextReview)
          animationFrameRef.current = window.requestAnimationFrame(() => {
            const nextArticle = scope.current?.querySelector<HTMLElement>('.google-review')
            if (!nextArticle) return

            tweenRef.current = gsap.fromTo(
              nextArticle,
              { autoAlpha: 0, x: direction * motionTokens.distance.review },
              {
                autoAlpha: 1,
                x: 0,
                duration: motionTokens.duration.reviewEnter,
                ease: motionTokens.ease.enter,
                clearProps: 'opacity,visibility,transform',
              },
            )
          })
        },
      })
    },
    [activeReview, reducedMotion, scope, setActiveReview],
  )

  useEffect(
    () => () => {
      window.cancelAnimationFrame(animationFrameRef.current)
      tweenRef.current?.kill()
    },
    [],
  )

  return changeReview
}
