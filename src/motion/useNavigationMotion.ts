import type { RefObject } from 'react'
import { useEffect, useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { motionTokens } from './motionTokens'
import { useReducedMotion } from './useReducedMotion'

export function useNavigationMotion(
  scope: RefObject<HTMLDivElement | null>,
  activeSection: string,
  menuOpen: boolean,
) {
  const reducedMotion = useReducedMotion()
  const tweenRef = useRef<gsap.core.Tween | null>(null)
  const menuTimelineRef = useRef<gsap.core.Timeline | null>(null)

  useLayoutEffect(() => {
    const root = scope.current
    const navigation = root?.querySelector<HTMLElement>('.story-nav')
    const indicator = root?.querySelector<HTMLElement>('.story-nav__indicator')
    const activeLink = root?.querySelector<HTMLElement>(
      `.story-link[data-section-id="${CSS.escape(activeSection)}"]`,
    )
    if (!navigation || !indicator || !activeLink) return

    const updateIndicator = (animate: boolean) => {
      const navigationBounds = navigation.getBoundingClientRect()
      const linkBounds = activeLink.getBoundingClientRect()
      const values = {
        x: linkBounds.left - navigationBounds.left,
        y: linkBounds.top - navigationBounds.top,
        width: linkBounds.width,
        height: linkBounds.height,
        autoAlpha: 1,
      }

      tweenRef.current?.kill()
      if (!animate || reducedMotion) {
        gsap.set(indicator, values)
        return
      }

      tweenRef.current = gsap.to(indicator, {
        ...values,
        duration: motionTokens.duration.micro,
        ease: motionTokens.ease.state,
        overwrite: 'auto',
      })
    }

    updateIndicator(false)
    const resizeObserver = new ResizeObserver(() => updateIndicator(false))
    resizeObserver.observe(navigation)
    const animationFrame = window.requestAnimationFrame(() => updateIndicator(true))

    return () => {
      window.cancelAnimationFrame(animationFrame)
      resizeObserver.disconnect()
      tweenRef.current?.kill()
    }
  }, [activeSection, menuOpen, reducedMotion, scope])

  useLayoutEffect(() => {
    const root = scope.current
    const navigation = root?.querySelector<HTMLElement>('.story-nav')
    const links = root
      ? Array.from(root.querySelectorAll<HTMLElement>('.story-link'))
      : []
    if (!root || !navigation || window.matchMedia('(min-width: 961px)').matches) {
      return
    }

    menuTimelineRef.current?.kill()
    if (!menuOpen || reducedMotion) {
      gsap.set([navigation, ...links], {
        clearProps: 'opacity,visibility,transform',
      })
      return
    }

    menuTimelineRef.current = gsap
      .timeline({ defaults: { ease: motionTokens.ease.enter } })
      .fromTo(
        navigation,
        { autoAlpha: 0, y: -18, scale: 0.96 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.42,
          clearProps: 'opacity,visibility,transform',
        },
      )
      .fromTo(
        links,
        { autoAlpha: 0, y: -14 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.34,
          stagger: 0.065,
          clearProps: 'opacity,visibility,transform',
        },
        '-=0.18',
      )

    return () => {
      menuTimelineRef.current?.kill()
    }
  }, [menuOpen, reducedMotion, scope])

  useEffect(() => {
    const root = scope.current
    if (!root) return
    const pageRoot = root.closest<HTMLElement>('.home-v2')

    let animationFrame = 0
    let isCompact = false
    const updateCompactState = () => {
      const nextCompact = window.scrollY > 56
      if (nextCompact !== isCompact) {
        isCompact = nextCompact
        root.toggleAttribute('data-scroll-compact', nextCompact)
        pageRoot?.toggleAttribute('data-scroll-compact', nextCompact)
      }
    }
    const scheduleUpdate = () => {
      window.cancelAnimationFrame(animationFrame)
      animationFrame = window.requestAnimationFrame(updateCompactState)
    }

    updateCompactState()
    window.addEventListener('scroll', scheduleUpdate, { passive: true })

    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.removeEventListener('scroll', scheduleUpdate)
      pageRoot?.removeAttribute('data-scroll-compact')
    }
  }, [scope])
}
