import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { Flip } from 'gsap/Flip'
import gsap from 'gsap'
import { StoryNav } from './StoryNav'

const INTRO_STORAGE_KEY = 'officina-belviso-intro-seen'
const INTRO_FAILSAFE_MS = 4800
const INTRO_DURATION_SECONDS = '4.15'

gsap.registerPlugin(Flip, useGSAP)

function introAlreadyPlayed() {
  try {
    return window.sessionStorage.getItem(INTRO_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

function rememberIntro() {
  try {
    window.sessionStorage.setItem(INTRO_STORAGE_KEY, 'true')
  } catch {
    // Storage can be unavailable in hardened browsing modes.
  }
}

function forceIntroInDevelopment() {
  const isLocalDevelopment =
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

  return isLocalDevelopment && new URLSearchParams(window.location.search).has('intro')
}

export function FloatingBrandNavigation() {
  const logoFrameRef = useRef<HTMLAnchorElement>(null)
  const logoImageRef = useRef<HTMLImageElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const logoFrame = logoFrameRef.current
      const logoImage = logoImageRef.current
      const overlay = overlayRef.current
      const navigation = document.querySelector<HTMLElement>('[data-intro-navigation]')
      const heroItems = Array.from(
        document.querySelectorAll<HTMLElement>('[data-hero-reveal]'),
      )
      const heroTruck = document.querySelector<HTMLElement>('[data-hero-truck]')
      const heroTruckLight = document.querySelector<HTMLElement>('[data-hero-truck-light]')

      if (
        !logoFrame ||
        !logoImage ||
        !overlay ||
        !navigation ||
        !heroTruck ||
        !heroTruckLight
      ) {
        return
      }

      const root = document.documentElement
      const revealTargets = [
        logoFrame,
        navigation,
        ...heroItems,
        heroTruck,
        heroTruckLight,
      ]
      let introTimeline: gsap.core.Timeline | undefined
      let returnTimeline: gsap.core.Timeline | undefined
      let failSafeTimer: number | undefined
      let imageLoadHandler: (() => void) | undefined
      let imageErrorHandler: (() => void) | undefined
      let introCancelled = false

      const clearFailSafe = () => {
        if (failSafeTimer !== undefined) {
          window.clearTimeout(failSafeTimer)
          failSafeTimer = undefined
        }
      }

      const detachImageListeners = () => {
        if (imageLoadHandler) logoImage.removeEventListener('load', imageLoadHandler)
        if (imageErrorHandler) logoImage.removeEventListener('error', imageErrorHandler)
        imageLoadHandler = undefined
        imageErrorHandler = undefined
      }

      const stopTruckBreathing = () => {
        heroTruck.classList.remove('hero-truck--alive')
        heroTruckLight.classList.remove('hero-truck-light--alive')
      }

      const startTruckBreathing = () => {
        heroTruck.classList.add('hero-truck--alive')
        heroTruckLight.classList.add('hero-truck-light--alive')
      }

      const releasePageInteraction = () => {
        root.classList.remove('intro-running')
      }

      const applyFinalState = () => {
        clearFailSafe()
        logoImage.classList.remove('brand-logo-image--intro')
        logoFrame.dataset.introState = 'complete'
        root.classList.remove('intro-running')
        gsap.set([logoFrame, logoImage, ...revealTargets], { clearProps: 'all' })
        gsap.set(overlay, { clearProps: 'all' })
      }

      const cancelIntro = () => {
        introCancelled = true
        detachImageListeners()
        introTimeline?.kill()
        if (introTimeline) {
          rememberIntro()
          logoFrame.dataset.introDuration = INTRO_DURATION_SECONDS
        }
        applyFinalState()
        if (introTimeline) startTruckBreathing()
      }

      const finishIntro = () => {
        introCancelled = true
        detachImageListeners()
        rememberIntro()
        logoFrame.dataset.introDuration = INTRO_DURATION_SECONDS
        applyFinalState()
        startTruckBreathing()
      }

      const showReturningState = () => {
        introCancelled = true
        stopTruckBreathing()
        applyFinalState()
        returnTimeline = gsap
          .timeline({ onComplete: startTruckBreathing })
          .fromTo(
            navigation,
            { autoAlpha: 0 },
            {
              autoAlpha: 1,
              duration: 0.5,
              ease: 'power2.out',
              clearProps: 'all',
            },
            0,
          )
          .fromTo(
            heroItems,
            { autoAlpha: 0, y: 14 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.7,
              ease: 'power3.out',
              stagger: 0.07,
              clearProps: 'all',
            },
            0.62,
          )
          .fromTo(
            heroTruck,
            {
              autoAlpha: 0,
              scale: 0.985,
              filter: 'blur(5px) contrast(0.94)',
            },
            {
              autoAlpha: 1,
              scale: 1,
              filter: 'blur(0px) contrast(1)',
              duration: 1.6,
              ease: 'power3.out',
              clearProps: 'all',
            },
            1.38,
          )
          .fromTo(
            heroTruckLight,
            { autoAlpha: 0, scale: 0.84 },
            {
              autoAlpha: 0.62,
              scale: 1.08,
              duration: 0.72,
              ease: 'power2.out',
            },
            1.22,
          )
          .to(
            heroTruckLight,
            {
              autoAlpha: 0.14,
              scale: 0.98,
              duration: 1,
              ease: 'power2.inOut',
              clearProps: 'all',
            },
            2.02,
          )
      }

      const prepareIntro = () => {
        stopTruckBreathing()
        root.classList.add('intro-running')
        logoFrame.dataset.introState = 'running'
        delete logoFrame.dataset.introDuration
        logoImage.classList.add('brand-logo-image--intro')

        gsap.set(overlay, {
          display: 'block',
          autoAlpha: 1,
          willChange: 'opacity',
        })
        gsap.set(navigation, {
          autoAlpha: 0,
          y: 14,
          filter: 'blur(3px)',
          willChange: 'transform, opacity, filter',
        })
        gsap.set(heroItems, {
          autoAlpha: 0,
          y: 18,
          filter: 'blur(4px)',
          willChange: 'transform, opacity, filter',
        })
        gsap.set(heroTruck, {
          autoAlpha: 0,
          scale: 0.985,
          filter: 'blur(5px) contrast(0.94)',
          transformOrigin: '50% 50%',
          willChange: 'transform, opacity, filter',
        })
        gsap.set(heroTruckLight, {
          autoAlpha: 0,
          scale: 0.84,
          transformOrigin: '50% 50%',
          willChange: 'transform, opacity',
        })
        gsap.set(logoImage, {
          autoAlpha: 0,
          filter: 'blur(12px) contrast(0.9)',
          willChange: 'transform, opacity, filter',
        })

        failSafeTimer = window.setTimeout(cancelIntro, INTRO_FAILSAFE_MS)
      }

      const startIntro = () => {
        if (introCancelled) return

        try {
          const centeredState = Flip.getState(logoImage)
          logoImage.classList.remove('brand-logo-image--intro')

          const logoTransition = Flip.from(centeredState, {
            absolute: true,
            duration: 1.05,
            ease: 'power4.inOut',
            paused: true,
            scale: true,
            simple: true,
          })

          introTimeline = gsap
            .timeline({ onComplete: finishIntro })
            .addLabel('silence', 0)
            .to(overlay, { duration: 0.3 })
            .addLabel('brand', 0.3)
            .to(logoImage, {
              autoAlpha: 1,
              filter: 'blur(0px) contrast(1)',
              duration: 0.9,
              ease: 'power3.out',
            })
            .to(logoImage, { duration: 0.35 })
            .addLabel('page', 1.55)
            .add(logoTransition, 'page')
            .to(
              overlay,
              {
                autoAlpha: 0,
                duration: 0.72,
                ease: 'power3.inOut',
              },
              'page+=0.08',
            )
            .to(
              navigation,
              {
                autoAlpha: 1,
                y: 0,
                filter: 'blur(0px)',
                duration: 0.55,
                ease: 'power3.out',
              },
              'page+=0.14',
            )
            .to(
              heroItems,
              {
                autoAlpha: 1,
                y: 0,
                filter: 'blur(0px)',
                duration: 0.62,
                ease: 'power3.out',
                stagger: 0.08,
              },
              'page+=0.25',
            )
            .to(
              heroTruckLight,
              {
                autoAlpha: 0.62,
                scale: 1.08,
                duration: 0.72,
                ease: 'power2.out',
              },
              'page+=0.85',
            )
            .to(
              heroTruck,
              {
                autoAlpha: 1,
                scale: 1,
                filter: 'blur(0px) contrast(1)',
                duration: 1.6,
                ease: 'power3.out',
              },
              'page+=1',
            )
            .to(
              heroTruckLight,
              {
                autoAlpha: 0.14,
                scale: 0.98,
                duration: 0.9,
                ease: 'power2.inOut',
              },
              'page+=1.7',
            )
            .set(overlay, { pointerEvents: 'none' }, 'page+=0.8')
            .call(releasePageInteraction, [], 'page+=0.8')
            .call(startTruckBreathing, [], 'page+=2.6')
        } catch {
          cancelIntro()
        }
      }

      const media = gsap.matchMedia()

      media.add(
        {
          reduceMotion: '(prefers-reduced-motion: reduce)',
          allowMotion: '(prefers-reduced-motion: no-preference)',
        },
        ({ conditions }) => {
          if (conditions?.reduceMotion) {
            cancelIntro()
            stopTruckBreathing()
            return
          }

          if (introAlreadyPlayed() && !forceIntroInDevelopment()) {
            showReturningState()
            return
          }

          prepareIntro()
          imageLoadHandler = startIntro
          imageErrorHandler = cancelIntro

          if (logoImage.complete) {
            if (logoImage.naturalWidth > 0) startIntro()
            else cancelIntro()
          } else {
            logoImage.addEventListener('load', imageLoadHandler, { once: true })
            logoImage.addEventListener('error', imageErrorHandler, { once: true })
          }

          return () => {
            if (imageLoadHandler) logoImage.removeEventListener('load', imageLoadHandler)
            if (imageErrorHandler) logoImage.removeEventListener('error', imageErrorHandler)
          }
        },
      )

      return () => {
        introCancelled = true
        detachImageListeners()
        clearFailSafe()
        introTimeline?.kill()
        returnTimeline?.kill()
        stopTruckBreathing()
        media.revert()
        logoImage.classList.remove('brand-logo-image--intro')
        root.classList.remove('intro-running')
        gsap.set([logoFrame, logoImage, ...revealTargets, overlay], {
          clearProps: 'all',
        })
      }
    },
    { dependencies: [] },
  )

  return (
    <>
      <a
        className="brand-logo-frame"
        href="#home"
        aria-label="Officina Belviso — vai all'inizio della pagina"
        data-intro-root
        data-intro-state="complete"
        ref={logoFrameRef}
      >
        <img
          className="brand-logo-image"
          src="/assets/logo-officina-belviso-ufficiale.png"
          alt="Officina Belviso"
          width="1536"
          height="1024"
          decoding="async"
          draggable="false"
          fetchPriority="high"
          ref={logoImageRef}
        />
      </a>
      <StoryNav />
      <div className="intro-overlay" aria-hidden="true" ref={overlayRef} />
    </>
  )
}
