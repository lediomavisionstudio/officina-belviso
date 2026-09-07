import type { RefObject } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  cinematicParallaxConfig,
  ENABLE_CINEMATIC_PARALLAX,
  type CinematicParallaxViewport,
} from '../config/cinematicParallax'
import {
  ENABLE_GLOBAL_CINEMATIC_BACKGROUND,
  globalCinematicBackgroundConfig,
} from '../config/globalCinematicBackground'
import {
  ENABLE_WORKSHOP_JOURNEY,
  WORKSHOP_JOURNEY_ACTIVE_EVENT,
  type WorkshopJourneyActiveDetail,
} from '../config/workshopJourney'
import { MOTION_DEBUG, motionTokens, reducedMotionQuery } from './motionTokens'

gsap.registerPlugin(useGSAP, ScrollTrigger)

// Enable only while calibrating the three image reveals below. Keep disabled
// in production so no markers or diagnostic output reach visitors.
const IMAGE_MOTION_DEBUG = false

function debugMotion(message: string) {
  if (MOTION_DEBUG) console.info(`[Motion] ${message}`)
}

function debugImageMotion(message: string) {
  if (IMAGE_MOTION_DEBUG) console.info(`[Image Motion] ${message}`)
}

type SectionTimelineBuilder = (timeline: gsap.core.Timeline) => void

type ReplayableSectionOptions = {
  build: SectionTimelineBuilder
  end?: string
  horizontalSignal?: AbortSignal
  name: string
  start?: string
  trigger: HTMLElement
}

const clearMotionProps =
  'opacity,visibility,transform,clipPath,willChange,filter'

const finalTweenState = {
  opacity: 1,
  x: 0,
  y: 0,
  scale: 1,
  clearProps: clearMotionProps,
}

/**
 * Sections replay only after crossing the opposite edge of a deliberately
 * narrow active range. This means roughly 70–85% of a section must leave the
 * viewport before it is armed again, preventing micro-scroll flicker.
 */
function createReplayableSection({
  build,
  end = 'bottom 16%',
  horizontalSignal,
  name,
  start = 'top 84%',
  trigger,
}: ReplayableSectionOptions) {
  const timeline = gsap.timeline({
    defaults: { ease: motionTokens.ease.enter },
    paused: true,
  })
  build(timeline)

  let isArmed = true

  const play = (direction: 'forward' | 'back') => {
    if (!isArmed) return

    isArmed = false
    debugMotion(`animate in: ${name} (${direction})`)
    timeline.restart()
  }

  const rearm = (edge: 'above' | 'below') => {
    if (isArmed) return

    isArmed = true
    timeline.pause(0)
    debugMotion(`animate out / replay armed: ${name} (${edge})`)
  }

  const panelId = trigger.closest<HTMLElement>('[data-workshop-panel]')
    ?.dataset.workshopPanel
  if (panelId && horizontalSignal) {
    const handlePanelChange = (event: Event) => {
      const detail = (event as CustomEvent<WorkshopJourneyActiveDetail>).detail
      if (!detail) return
      if (detail.sectionId === panelId) {
        play(detail.direction === 'backward' ? 'back' : 'forward')
      } else {
        rearm(detail.direction === 'backward' ? 'below' : 'above')
      }
    }

    document.addEventListener(
      WORKSHOP_JOURNEY_ACTIVE_EVENT,
      handlePanelChange,
      { signal: horizontalSignal },
    )
    debugMotion(`horizontal section registered: ${name}`)
    return timeline
  }

  debugMotion(`section registered: ${name}`)
  ScrollTrigger.create({
    trigger,
    start,
    end,
    invalidateOnRefresh: true,
    markers: MOTION_DEBUG || IMAGE_MOTION_DEBUG,
    onEnter: () => play('forward'),
    onEnterBack: () => play('back'),
    onLeave: () => rearm('above'),
    onLeaveBack: () => rearm('below'),
  })

  return timeline
}

function setMotionHint(targets: gsap.TweenTarget) {
  gsap.set(targets, { willChange: 'transform,opacity' })
}

function createSectionParallax(
  trigger: HTMLElement,
  targets: HTMLElement[],
  distance: number,
) {
  if (targets.length === 0) return

  gsap.fromTo(
    targets,
    { y: distance, scale: 1.025 },
    {
      y: -distance,
      scale: 1.025,
      ease: 'none',
      stagger: 0.025,
      scrollTrigger: {
        trigger,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 0.7,
      },
    },
  )
}

type CinematicParallaxOptions = {
  scale: number
  travel: number
  variations?: readonly number[]
}

function createCinematicParallax(
  trigger: HTMLElement,
  targets: HTMLElement[],
  { scale, travel, variations = [1] }: CinematicParallaxOptions,
) {
  if (!ENABLE_CINEMATIC_PARALLAX || targets.length === 0) return

  const distanceFor = (index: number) => {
    const variation = variations[index % variations.length] ?? 1
    return (travel * variation) / 2
  }

  gsap.fromTo(
    targets,
    {
      y: (index: number) => distanceFor(index),
      scale,
      force3D: true,
      transformOrigin: 'center center',
    },
    {
      y: (index: number) => -distanceFor(index),
      scale,
      force3D: true,
      ease: 'none',
      scrollTrigger: {
        trigger,
        start: 'top bottom',
        end: 'bottom top',
        scrub: cinematicParallaxConfig.scrub,
        invalidateOnRefresh: true,
        markers: MOTION_DEBUG,
      },
    },
  )
}

function hasConstrainedMotionHardware() {
  const device = navigator as Navigator & {
    connection?: { saveData?: boolean }
    deviceMemory?: number
  }

  return (
    device.connection?.saveData === true ||
    (typeof device.deviceMemory === 'number' && device.deviceMemory <= 2) ||
    (typeof device.hardwareConcurrency === 'number' &&
      device.hardwareConcurrency <= 2)
  )
}

function createGlobalCinematicBackground(
  root: HTMLElement,
  viewport: 'desktop' | 'tablet' | 'mobile',
) {
  if (!ENABLE_GLOBAL_CINEMATIC_BACKGROUND || viewport === 'mobile') return

  const about = root.querySelector<HTMLElement>('.home-about')
  const gallery = root.querySelector<HTMLElement>('.home-gallery')
  const image = root.querySelector<HTMLElement>('.cinematic-background__image')
  const overlay = root.querySelector<HTMLElement>('.cinematic-background__overlay')
  if (!about || !gallery || !image || !overlay) return

  const settings = globalCinematicBackgroundConfig[viewport]
  const timeline = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: about,
      endTrigger: gallery,
      start: 'top bottom',
      end: 'bottom top',
      scrub: globalCinematicBackgroundConfig.scrub,
      invalidateOnRefresh: true,
      markers: MOTION_DEBUG,
    },
  })

  timeline.fromTo(
    image,
    {
      y: settings.travel / 2,
      scale: settings.scale,
      force3D: true,
      transformOrigin: 'center center',
    },
    {
      y: -settings.travel / 2,
      scale: settings.scale,
      force3D: true,
    },
    0,
  )
  timeline.fromTo(overlay, { opacity: 0.84 }, { opacity: 0.66 }, 0)
}

function alternatingClip(index: number, compact: boolean) {
  if (compact) return 'inset(100% 0 0 0 round 18px)'
  return index % 2 === 0
    ? 'inset(0 100% 0 0 round 18px)'
    : 'inset(0 0 0 100% round 18px)'
}

function renderKpiValue(
  element: HTMLElement,
  value: number,
  decimals: number,
  suffix: string,
) {
  element.textContent = `${value.toFixed(decimals)}${suffix}`
}

export function useHomeMotion(scope: RefObject<HTMLElement | null>) {
  useGSAP(
    () => {
      const root = scope.current
      if (!root) return

      const reduceMotionOnMount = window.matchMedia(reducedMotionQuery).matches
      if (!reduceMotionOnMount) {
        const compactOnMount = window.matchMedia('(max-width: 960px)').matches
        const chromeDistance = compactOnMount ? 0.56 : 1
        const logo = root.querySelector<HTMLElement>('.brand-logo-frame')
        const navigation = root.querySelector<HTMLElement>(
          compactOnMount ? '.menu-toggle' : '.story-nav',
        )
        const chromeTimeline = gsap.timeline({
          defaults: { ease: motionTokens.ease.enter },
        })

        debugMotion('fixed chrome intro registered')
        if (logo) {
          setMotionHint(logo)
          chromeTimeline.fromTo(
            logo,
            { opacity: 0, y: -44 * chromeDistance },
            { ...finalTweenState, duration: 0.9 },
            0.18,
          )
        }

        if (navigation) {
          setMotionHint(navigation)
          chromeTimeline.fromTo(
            navigation,
            { opacity: 0, y: -34 * chromeDistance },
            { ...finalTweenState, duration: 0.86 },
            0.28,
          )
        }
      }

      const media = gsap.matchMedia()
      media.add(
        {
          desktop: '(min-width: 961px)',
          compact: '(max-width: 960px)',
          cinematicDesktop: '(min-width: 1025px)',
          cinematicTablet: '(min-width: 621px) and (max-width: 1024px)',
          cinematicMobile: '(max-width: 620px)',
          reduceMotion: reducedMotionQuery,
        },
        (context) => {
          const conditions = context.conditions as {
            desktop: boolean
            compact: boolean
            cinematicDesktop: boolean
            cinematicTablet: boolean
            cinematicMobile: boolean
            reduceMotion: boolean
          }
          const allTargets = root.querySelectorAll<HTMLElement>(
            '[data-hero-reveal], [data-hero-title-text], [data-reveal], .section-heading > *, .placeholder-image__media, .placeholder-image__media img, .premium-carousel__toolbar, .carousel-card, .brands-grid > *, .google-reviews__heading > *, .google-reviews__carousel, .google-reviews__actions, .contact-form__group, .form-checkbox, .contact-form__footer, .site-footer__logo-frame, .site-footer__brand > p, .site-footer__social, .site-footer__column, .site-footer__bottom',
          )

          if (conditions.reduceMotion) {
            gsap.set(allTargets, { clearProps: clearMotionProps })
            const aboutHeading = root.querySelector<HTMLElement>(
              '.home-about .section-heading',
            )
            if (aboutHeading) gsap.set(aboutHeading, { '--motion-line': 1 })
            debugMotion('reduced motion: static complete state')
            return
          }

          const horizontalMotionActive =
            ENABLE_WORKSHOP_JOURNEY &&
            root.querySelector('[data-workshop-journey]') !== null
          const horizontalMotionController = horizontalMotionActive
            ? new AbortController()
            : null
          const horizontalMotionSignal = horizontalMotionController?.signal

          const compactDistance = conditions.compact ? 0.56 : 1
          const cinematicViewport: CinematicParallaxViewport =
            conditions.cinematicMobile
              ? 'mobile'
              : conditions.cinematicTablet
                ? 'tablet'
                : 'desktop'
          const cinematicSettings = cinematicParallaxConfig[cinematicViewport]
          const allowCinematicCardParallax = !hasConstrainedMotionHardware()
          if (!horizontalMotionActive) {
            createGlobalCinematicBackground(root, cinematicViewport)
          }
          const heroTimeline = gsap.timeline({
            defaults: { ease: motionTokens.ease.enter },
            paused: true,
          })
          const heroSection = root.querySelector<HTMLElement>('.home-hero')
          const heroVisual = root.querySelector<HTMLElement>('.home-hero__visual')
          const heroMedia = root.querySelector<HTMLElement>(
            '.home-hero__placeholder .placeholder-image__media',
          )
          const heroImage = heroMedia?.querySelector<HTMLElement>('img')
          const heroOverlay = root.querySelector<HTMLElement>('.home-hero__overlay')
          const heroEyebrow = root.querySelector<HTMLElement>('.home-hero .eyebrow')
          const heroTitleLines = Array.from(
            root.querySelectorAll<HTMLElement>('[data-hero-title-text]'),
          )
          const heroDescription = root.querySelector<HTMLElement>('.home-hero__description')
          const heroButtons = Array.from(
            root.querySelectorAll<HTMLElement>('.home-hero__actions .button'),
          )

          debugMotion('Hero intro registered')
          if (heroMedia) {
            setMotionHint(heroMedia)
            heroTimeline.fromTo(
              heroMedia,
              {
                clipPath: 'inset(0 0 100% 0)',
                opacity: 0,
                willChange: 'clip-path,opacity',
              },
              {
                clipPath: 'inset(0 0 0% 0)',
                opacity: 1,
                duration: motionTokens.duration.heroBackground,
                clearProps: 'clipPath,opacity,willChange',
              },
              0,
            )
          }

          if (heroImage) {
            setMotionHint(heroImage)
            heroTimeline.fromTo(
              heroImage,
              {
                scale: 1.08,
                y: 18 * compactDistance,
              },
              {
                scale: 1,
                y: 0,
                duration: motionTokens.duration.heroBackground,
                clearProps: 'transform,willChange',
              },
              0,
            )
          } else if (heroVisual) {
            setMotionHint(heroVisual)
            heroTimeline.fromTo(
              heroVisual,
              { scale: conditions.compact ? 1.065 : 1.08 },
              {
                scale: 1,
                duration: motionTokens.duration.heroBackground,
                clearProps: 'transform,willChange',
              },
              0,
            )
          }

          if (heroOverlay) {
            heroTimeline.fromTo(
              heroOverlay,
              { opacity: 0.58 },
              { opacity: 1, duration: 1.05, clearProps: 'opacity' },
              0.08,
            )
          }

          if (heroEyebrow) {
            setMotionHint(heroEyebrow)
            heroTimeline.fromTo(
              heroEyebrow,
              { opacity: 0, y: 38 * compactDistance },
              { ...finalTweenState, duration: 0.78 },
              0.5,
            )
          }

          if (heroTitleLines.length > 0) {
            setMotionHint(heroTitleLines)
            heroTimeline.fromTo(
              heroTitleLines,
              { opacity: 0, yPercent: 115 },
              {
                opacity: 1,
                yPercent: 0,
                duration: conditions.compact ? 0.78 : 1.02,
                stagger: conditions.compact ? 0.1 : 0.15,
                clearProps: clearMotionProps,
              },
              0.58,
            )
          }

          if (heroDescription) {
            setMotionHint(heroDescription)
            heroTimeline.fromTo(
              heroDescription,
              { opacity: 0, y: 48 * compactDistance },
              { ...finalTweenState, duration: 0.86 },
              0.84,
            )
          }

          if (heroButtons.length > 0) {
            setMotionHint(heroButtons)
            heroTimeline.fromTo(
              heroButtons,
              { opacity: 0, y: 42 * compactDistance, scale: 0.92 },
              {
                ...finalTweenState,
                duration: 0.76,
                stagger: conditions.compact ? 0.09 : 0.14,
              },
              1.02,
            )
          }

          if (heroSection) {
            let heroIsArmed = true

            const playHero = (direction: 'initial' | 'forward' | 'back') => {
              if (!heroIsArmed) return

              heroIsArmed = false
              debugMotion(`animate in: Hero (${direction})`)
              heroTimeline.restart()
            }

            const rearmHero = (edge: 'above' | 'below') => {
              if (heroIsArmed) return

              heroIsArmed = true
              heroTimeline.pause(0)
              debugMotion(`animate out / replay armed: Hero (${edge})`)
            }

            if (horizontalMotionSignal) {
              document.addEventListener(
                WORKSHOP_JOURNEY_ACTIVE_EVENT,
                (event) => {
                  const detail = (event as CustomEvent<WorkshopJourneyActiveDetail>).detail
                  if (!detail) return
                  if (detail.sectionId === 'home') {
                    playHero(
                      detail.direction === 'backward' ? 'back' : detail.direction,
                    )
                  } else {
                    rearmHero(detail.direction === 'backward' ? 'below' : 'above')
                  }
                },
                { signal: horizontalMotionSignal },
              )
            } else {
              ScrollTrigger.create({
                trigger: heroSection,
                start: 'top bottom',
                end: 'bottom top',
                invalidateOnRefresh: true,
                markers: MOTION_DEBUG,
                onEnter: () => playHero('forward'),
                onEnterBack: () => playHero('back'),
                onLeave: () => rearmHero('above'),
                onLeaveBack: () => rearmHero('below'),
              })
            }

            const heroBounds = heroSection.getBoundingClientRect()
            if (heroBounds.bottom > 0 && heroBounds.top < window.innerHeight) {
              playHero('initial')
            }
          }

          if (!horizontalMotionActive && heroSection && heroMedia) {
            createCinematicParallax(heroSection, [heroMedia], cinematicSettings.hero)
          }

          const about = root.querySelector<HTMLElement>('.home-about')
          if (about) {
            const heading = about.querySelector<HTMLElement>('.section-heading')
            const eyebrow = about.querySelector<HTMLElement>('.section-heading .eyebrow')
            const title = about.querySelector<HTMLElement>('.section-heading h2')
            const description = about.querySelector<HTMLElement>(
              '.section-heading__description',
            )
            const body = about.querySelector<HTMLElement>('.home-about__body')
            const stats = Array.from(
              about.querySelectorAll<HTMLElement>('.home-about__stats > li'),
            )
            const statValues = Array.from(
              about.querySelectorAll<HTMLElement>('.home-about__stat-value'),
            )
            const imageFigure = about.querySelector<HTMLElement>('.home-about__image')
            const imageMedia = imageFigure?.querySelector<HTMLElement>(
              '.placeholder-image__media',
            )
            const image = imageMedia?.querySelector<HTMLElement>('img')
            const imageCover = imageMedia?.querySelector<HTMLElement>(
              '.placeholder-image__reveal-cover',
            )
            const copy = [eyebrow, title, description, body].filter(
              (target): target is HTMLElement => target !== null,
            )
            setMotionHint([
              ...copy,
              ...stats,
              ...(imageMedia ? [imageMedia] : []),
              ...(image ? [image] : []),
              ...(imageCover ? [imageCover] : []),
            ])

            createReplayableSection({
              horizontalSignal: horizontalMotionSignal,
              trigger: about,
              name: 'Chi siamo',
              build: (timeline) => {
                const imageStart = conditions.compact ? 0.1 : 0.13
                const descriptionStart = conditions.compact ? 0.22 : 0.26
                const statsStart = conditions.compact ? 0.34 : 0.42

                if (heading) timeline.set(heading, { '--motion-line': 0 })
                if (eyebrow) {
                  timeline.fromTo(
                    eyebrow,
                    { opacity: 0, y: 34 * compactDistance },
                    { ...finalTweenState, duration: 0.68 },
                  )
                }
                if (title) {
                  timeline.fromTo(
                    title,
                    {
                      opacity: 0,
                      y: 58 * compactDistance,
                      clipPath: 'inset(100% 0 0 0)',
                    },
                    {
                      opacity: 1,
                      y: 0,
                      clipPath: 'inset(0% 0 0 0)',
                      duration: 0.96,
                      clearProps: clearMotionProps,
                    },
                    0.04,
                  )
                }
                if (heading) {
                  timeline.to(
                    heading,
                    { '--motion-line': 1, duration: 0.72, ease: motionTokens.ease.state },
                    0.18,
                  )
                }
                if (description || body) {
                  timeline.fromTo(
                    [description, body].filter(
                      (target): target is HTMLElement => target !== null,
                    ),
                    { opacity: 0, y: 42 * compactDistance },
                    { ...finalTweenState, duration: 0.78, stagger: 0.11 },
                    descriptionStart,
                  )
                }
                if (imageCover) {
                  timeline.fromTo(
                    imageCover,
                    {
                      scaleX: 1,
                      transformOrigin: 'right center',
                      willChange: 'transform',
                    },
                    {
                      scaleX: 0,
                      duration: conditions.compact ? 0.96 : 1.05,
                      ease: 'power4.inOut',
                      onStart: () => debugImageMotion('ABOUT IMAGE REVEAL START'),
                      clearProps: 'transform,transformOrigin,willChange',
                    },
                    imageStart,
                  )
                }
                if (image) {
                  timeline.fromTo(
                    image,
                    {
                      scale: conditions.compact ? 1.1 : 1.16,
                      x: conditions.compact ? -25 : -45,
                      y: 0,
                      transformOrigin: 'center center',
                      willChange: 'transform',
                    },
                    {
                      scale: 1,
                      x: 0,
                      y: 0,
                      duration: conditions.compact ? 1.1 : 1.22,
                      ease: 'power3.out',
                      clearProps: 'transform,willChange',
                    },
                    imageStart,
                  )
                }
                const statsLabel = 'about-stats'
                const statsStagger = conditions.compact ? 0.08 : 0.14
                timeline.addLabel(statsLabel, statsStart)
                timeline.fromTo(
                  stats,
                  { opacity: 0, y: 50 * compactDistance, scale: 0.92 },
                  {
                    ...finalTweenState,
                    duration: 0.72,
                    stagger: statsStagger,
                  },
                  statsLabel,
                )
                statValues.forEach((element, index) => {
                  const targetValue = Number(element.dataset.kpiValue)
                  const decimals = Number(element.dataset.kpiDecimals ?? 0)
                  const suffix = element.dataset.kpiSuffix ?? ''
                  if (!Number.isFinite(targetValue) || !Number.isFinite(decimals)) return

                  const counter = { value: 0 }
                  timeline.fromTo(
                    counter,
                    { value: 0 },
                    {
                      value: targetValue,
                      duration: 1.05,
                      ease: motionTokens.ease.state,
                      immediateRender: false,
                      onStart: () => renderKpiValue(element, 0, decimals, suffix),
                      onUpdate: () =>
                        renderKpiValue(element, counter.value, decimals, suffix),
                      onComplete: () =>
                        renderKpiValue(element, targetValue, decimals, suffix),
                    },
                    `${statsLabel}+=${index * statsStagger}`,
                  )
                })
              },
            })

            if (imageMedia && !horizontalMotionActive) {
              if (ENABLE_CINEMATIC_PARALLAX) {
                createCinematicParallax(about, [imageMedia], cinematicSettings.about)
              } else {
                createSectionParallax(
                  about,
                  [imageMedia],
                  conditions.compact ? 10 : 24,
                )
              }
            }
          }

          const carouselSections = [
            ['.home-services', 'Servizi', 'services'],
            ['.home-gallery', 'I nostri lavori', 'gallery'],
          ] as const

          carouselSections.forEach(([selector, name, mode]) => {
            const section = root.querySelector<HTMLElement>(selector)
            if (!section) return

            const eyebrow = section.querySelector<HTMLElement>('.section-heading .eyebrow')
            const title = section.querySelector<HTMLElement>('.section-heading h2')
            const description = section.querySelector<HTMLElement>(
              '.section-heading__description',
            )
            const toolbar = section.querySelector<HTMLElement>('.premium-carousel__toolbar')
            const cards = Array.from(section.querySelectorAll<HTMLElement>('.carousel-card'))
            const cardMedia = Array.from(
              section.querySelectorAll<HTMLElement>(
                '.carousel-card .placeholder-image__media',
              ),
            )
            const cardImages = Array.from(
              section.querySelectorAll<HTMLElement>(
                '.carousel-card .placeholder-image__media img',
              ),
            )
            const cardCovers = Array.from(
              section.querySelectorAll<HTMLElement>(
                '.carousel-card .placeholder-image__reveal-cover',
              ),
            )
            const cardBodies = Array.from(
              section.querySelectorAll<HTMLElement>(
                mode === 'services' ? '.service-card__body' : '.work-card__body',
              ),
            )
            const serviceTitles = Array.from(
              section.querySelectorAll<HTMLElement>('.service-card__body h3'),
            )
            const serviceDescriptions = Array.from(
              section.querySelectorAll<HTMLElement>('.service-card__body p'),
            )
            const serviceCtas = Array.from(
              section.querySelectorAll<HTMLElement>('.service-card__body .card-link'),
            )
            setMotionHint([
              ...cards,
              ...cardMedia,
              ...cardImages,
              ...cardCovers,
              ...(toolbar ? [toolbar] : []),
            ])

            createReplayableSection({
              horizontalSignal: horizontalMotionSignal,
              trigger: section,
              name,
              build: (timeline) => {
                const cardStagger = 0.1
                const firstCardStart = mode === 'services' ? 0.14 : 0.1
                const imageDelay = mode === 'services' ? 0.05 : 0.04

                if (mode === 'services') {
                  if (eyebrow || title) {
                    timeline.fromTo(
                      [eyebrow, title].filter(
                        (target): target is HTMLElement => target !== null,
                      ),
                      { opacity: 0, x: -58 * compactDistance },
                      { ...finalTweenState, duration: 0.84, stagger: 0.1 },
                    )
                  }
                  if (description) {
                    timeline.fromTo(
                      description,
                      { opacity: 0, x: 58 * compactDistance },
                      { ...finalTweenState, duration: 0.84 },
                      0.24,
                    )
                  }
                } else {
                  if (eyebrow) {
                    timeline.fromTo(
                      eyebrow,
                      { opacity: 0, y: 36 * compactDistance },
                      { ...finalTweenState, duration: 0.66 },
                    )
                  }
                  if (title) {
                    timeline.fromTo(
                      title,
                      {
                        opacity: 0,
                        y: 64 * compactDistance,
                        clipPath: 'inset(100% 0 0 0)',
                      },
                      {
                        opacity: 1,
                        y: 0,
                        clipPath: 'inset(0% 0 0 0)',
                        duration: 0.96,
                        clearProps: clearMotionProps,
                      },
                      0.06,
                    )
                  }
                  if (description) {
                    timeline.fromTo(
                      description,
                      { opacity: 0, y: 42 * compactDistance },
                      { ...finalTweenState, duration: 0.76 },
                      0.26,
                    )
                  }
                }

                if (toolbar) {
                  timeline.fromTo(
                    toolbar,
                    { opacity: 0, y: 34 * compactDistance },
                    { ...finalTweenState, duration: 0.68 },
                    mode === 'services' ? 0.32 : 0.34,
                  )
                }

                cards.forEach((card, index) => {
                  const cardStart = firstCardStart + index * cardStagger
                  const mediaStart = cardStart + imageDelay
                  const cardImage = cardImages[index]
                  const cardCover = cardCovers[index]
                  const cardBody = cardBodies[index]
                  const serviceTitle = serviceTitles[index]
                  const serviceDescription = serviceDescriptions[index]
                  const serviceCta = serviceCtas[index]

                  timeline.fromTo(
                    card,
                    {
                      opacity: conditions.compact ? 0.9 : 0.84,
                      y: (mode === 'services' ? 30 : 26) * compactDistance,
                      scale: mode === 'services' ? 0.975 : 0.98,
                    },
                    { ...finalTweenState, duration: 0.56 },
                    cardStart,
                  )

                  if (cardCover) {
                    timeline.fromTo(
                      cardCover,
                      mode === 'gallery'
                        ? {
                            xPercent: 0,
                            scaleX: 1.12,
                            skewX: -7,
                            transformOrigin: 'right center',
                            willChange: 'transform',
                          }
                        : {
                            scaleY: 1,
                            transformOrigin: 'top center',
                            willChange: 'transform',
                          },
                      {
                        ...(mode === 'gallery'
                          ? { xPercent: 112, scaleX: 1.12, skewX: -7 }
                          : { scaleY: 0 }),
                        duration:
                          mode === 'gallery'
                            ? conditions.compact
                              ? 1
                              : 1.08
                            : conditions.compact
                              ? 0.9
                              : 0.98,
                        ease: mode === 'gallery' ? 'power4.inOut' : 'power3.inOut',
                        onStart: () =>
                          debugImageMotion(
                            mode === 'gallery'
                              ? 'WORK IMAGE REVEAL START'
                              : 'SERVICE IMAGE REVEAL START',
                          ),
                        clearProps: 'transform,transformOrigin,willChange',
                      },
                      mediaStart,
                    )
                  }

                  if (cardImage) {
                    const imageScale = conditions.compact
                      ? 1.1
                      : mode === 'gallery'
                        ? 1.14
                        : 1.18
                    const horizontalTravel =
                      mode === 'gallery'
                        ? conditions.compact
                          ? 20
                          : 35
                        : 0

                    timeline.fromTo(
                      cardImage,
                      {
                        scale: imageScale,
                        x: horizontalTravel,
                        y:
                          mode === 'gallery'
                            ? 0
                            : conditions.compact
                              ? 25
                              : 45,
                        transformOrigin: 'center center',
                        willChange: 'transform',
                      },
                      {
                        scale: 1,
                        x: 0,
                        y: 0,
                        duration:
                          mode === 'gallery'
                            ? conditions.compact
                              ? 1
                              : 1.12
                            : conditions.compact
                              ? 0.9
                              : 1,
                        ease: mode === 'gallery' ? 'power4.out' : 'power3.out',
                        clearProps: 'transform,willChange',
                      },
                      mediaStart,
                    )
                  }

                  if (mode === 'services') {
                    const serviceCopy = [
                      [serviceTitle, 0.15],
                      [serviceDescription, 0.22],
                      [serviceCta, 0.28],
                    ] as const

                    serviceCopy.forEach(([element, delay]) => {
                      if (!element) return
                      timeline.fromTo(
                        element,
                        { opacity: 0, y: 18 * compactDistance },
                        { ...finalTweenState, duration: 0.58 },
                        cardStart + delay,
                      )
                    })
                  }

                  if (mode === 'gallery' && cardBody) {
                    timeline.fromTo(
                      cardBody,
                      { opacity: 0, y: 34 * compactDistance },
                      { ...finalTweenState, duration: 0.66 },
                      mediaStart + (conditions.compact ? 0.26 : 0.3),
                    )
                  }
                })
              },
            })

            if (!horizontalMotionActive && !ENABLE_GLOBAL_CINEMATIC_BACKGROUND) {
              if (ENABLE_CINEMATIC_PARALLAX) {
                if (allowCinematicCardParallax) {
                  createCinematicParallax(section, cardMedia, {
                    ...cinematicSettings.cards,
                    variations: cinematicParallaxConfig.variations,
                  })
                }
              } else {
                createSectionParallax(
                  section,
                  cardMedia,
                  conditions.compact ? 7 : 15,
                )
              }
            }
          })

          const brands = root.querySelector<HTMLElement>('.home-gallery__brands')
          if (brands) {
            const brandHeader = brands.querySelector<HTMLElement>(
              '.home-gallery__brands-header',
            )
            const brandItems = Array.from(
              brands.querySelectorAll<HTMLElement>('.brands-grid > *'),
            )
            setMotionHint([...(brandHeader ? [brandHeader] : []), ...brandItems])
            createReplayableSection({
              horizontalSignal: horizontalMotionSignal,
              trigger: brands,
              name: 'Marchi assistiti',
              start: 'top 88%',
              end: 'bottom 12%',
              build: (timeline) => {
                if (brandHeader) {
                  timeline.fromTo(
                    brandHeader,
                    { opacity: 0, y: 34 * compactDistance },
                    { ...finalTweenState, duration: 0.72 },
                  )
                }
                timeline.fromTo(
                  brandItems,
                  { opacity: 0, y: 24 * compactDistance, scale: 0.9 },
                  {
                    ...finalTweenState,
                    duration: 0.68,
                    stagger: conditions.compact ? 0.07 : 0.1,
                  },
                  '-=0.38',
                )
              },
            })
          }

          const quoteSection = root.querySelector<HTMLElement>(
            '.contact-section--quote',
          )
          if (quoteSection) {
            const businessHeader = quoteSection.querySelector<HTMLElement>(
              '.business-card__header',
            )
            const businessDetails = Array.from(
              quoteSection.querySelectorAll<HTMLElement>('.business-card__detail'),
            )
            const reviewLabel = quoteSection.querySelector<HTMLElement>(
              '.google-reviews__heading .business-card__label',
            )
            const reviewTitle = quoteSection.querySelector<HTMLElement>(
              '.google-reviews__heading h3',
            )
            const reviewStars = quoteSection.querySelector<HTMLElement>(
              '.google-reviews__score .google-reviews__stars',
            )
            const reviewScore = quoteSection.querySelector<HTMLElement>(
              '.google-reviews__score strong',
            )
            const reviewCount = quoteSection.querySelector<HTMLElement>(
              '.google-reviews__score > span:last-child',
            )
            const reviewCarousel = quoteSection.querySelector<HTMLElement>(
              '.google-reviews__carousel',
            )
            const reviewActions = quoteSection.querySelector<HTMLElement>(
              '.google-reviews__actions',
            )
            const map = quoteSection.querySelector<HTMLElement>('.business-map')
            const form = quoteSection.querySelector<HTMLElement>('.contact-form')
            const formGroups = Array.from(
              quoteSection.querySelectorAll<HTMLElement>(
                '.contact-form__group, .form-checkbox, .contact-form__footer',
              ),
            )
            setMotionHint([
              ...(businessHeader ? [businessHeader] : []),
              ...businessDetails,
              ...(reviewCarousel ? [reviewCarousel] : []),
              ...(form ? [form] : []),
              ...formGroups,
            ])

            createReplayableSection({
              horizontalSignal: horizontalMotionSignal,
              trigger: quoteSection,
              name: 'Recensioni e preventivo',
              start: 'top 82%',
              end: 'bottom 18%',
              build: (timeline) => {
                if (businessHeader) {
                  timeline.fromTo(
                    businessHeader,
                    { opacity: 0, x: -58 * compactDistance },
                    { ...finalTweenState, duration: 0.9 },
                  )
                }
                timeline.fromTo(
                  businessDetails,
                  { opacity: 0, x: -44 * compactDistance, y: 24 * compactDistance },
                  {
                    ...finalTweenState,
                    duration: 0.72,
                    stagger: conditions.compact ? 0.07 : 0.11,
                  },
                  '-=0.48',
                )
                timeline.fromTo(
                  [reviewStars, reviewScore, reviewCount, reviewLabel, reviewTitle].filter(
                    (target): target is HTMLElement => target !== null,
                  ),
                  { opacity: 0, y: 28 * compactDistance, scale: 0.94 },
                  {
                    ...finalTweenState,
                    duration: 0.64,
                    stagger: conditions.compact ? 0.06 : 0.09,
                  },
                  '-=0.36',
                )
                if (reviewCarousel) {
                  timeline.fromTo(
                    reviewCarousel,
                    { opacity: 0, y: 38 * compactDistance },
                    { ...finalTweenState, duration: 0.72 },
                    '-=0.38',
                  )
                }
                if (reviewActions) {
                  timeline.fromTo(
                    reviewActions,
                    { opacity: 0, y: 30 * compactDistance },
                    { ...finalTweenState, duration: 0.66 },
                    '-=0.42',
                  )
                }
                if (map) {
                  timeline.fromTo(
                    map,
                    { opacity: 0, y: 42 * compactDistance },
                    { ...finalTweenState, duration: 0.72 },
                    0.16,
                  )
                }
                if (form) {
                  timeline.fromTo(
                    form,
                    { opacity: 0, x: 64 * compactDistance },
                    { ...finalTweenState, duration: 0.92 },
                    0.18,
                  )
                }
                timeline.fromTo(
                  formGroups,
                  { opacity: 0, y: 42 * compactDistance },
                  {
                    ...finalTweenState,
                    duration: 0.7,
                    stagger: conditions.compact ? 0.07 : 0.12,
                  },
                  0.42,
                )
              },
            })
          }

          const careerSection = root.querySelector<HTMLElement>(
            '.contact-section--career',
          )
          if (careerSection) {
            const careerCopy = Array.from(
              careerSection.querySelectorAll<HTMLElement>(
                '.contact-section__intro > .eyebrow, .contact-section__intro > h2, .contact-section__description, .contact-section__notes',
              ),
            )
            const careerImageMedia = careerSection.querySelector<HTMLElement>(
              '.contact-section__career-image .placeholder-image__media',
            )
            const careerImage = careerImageMedia?.querySelector<HTMLElement>('img')
            const careerForm = careerSection.querySelector<HTMLElement>('.contact-form')
            const careerFormGroups = Array.from(
              careerSection.querySelectorAll<HTMLElement>(
                '.contact-form__group, .form-checkbox, .contact-form__footer',
              ),
            )
            setMotionHint([
              ...careerCopy,
              ...(careerImageMedia ? [careerImageMedia] : []),
              ...(careerImage ? [careerImage] : []),
              ...(careerForm ? [careerForm] : []),
              ...careerFormGroups,
            ])

            createReplayableSection({
              horizontalSignal: horizontalMotionSignal,
              trigger: careerSection,
              name: 'Lavora con noi',
              start: 'top 82%',
              end: 'bottom 18%',
              build: (timeline) => {
                timeline.fromTo(
                  careerCopy,
                  { opacity: 0, x: -56 * compactDistance, y: 24 * compactDistance },
                  {
                    ...finalTweenState,
                    duration: 0.78,
                    stagger: conditions.compact ? 0.08 : 0.12,
                  },
                )
                if (careerImageMedia) {
                  timeline.fromTo(
                    careerImageMedia,
                    { clipPath: alternatingClip(0, conditions.compact) },
                    {
                      clipPath: 'inset(0 0 0 0 round 18px)',
                      duration: 0.94,
                      clearProps: 'clipPath,willChange',
                    },
                    '-=0.48',
                  )
                }
                if (careerImage) {
                  timeline.fromTo(
                    careerImage,
                    { scale: 1.1 },
                    { scale: 1, duration: 1, clearProps: 'transform,willChange' },
                    '<',
                  )
                }
                if (careerForm) {
                  timeline.fromTo(
                    careerForm,
                    { opacity: 0, x: 64 * compactDistance },
                    { ...finalTweenState, duration: 0.92 },
                    0.14,
                  )
                }
                timeline.fromTo(
                  careerFormGroups,
                  { opacity: 0, y: 42 * compactDistance },
                  {
                    ...finalTweenState,
                    duration: 0.7,
                    stagger: conditions.compact ? 0.07 : 0.12,
                  },
                  0.38,
                )
              },
            })

            if (
              careerImageMedia &&
              !horizontalMotionActive &&
              !ENABLE_CINEMATIC_PARALLAX
            ) {
              createSectionParallax(
                careerSection,
                [careerImageMedia],
                conditions.compact ? 8 : 18,
              )
            }
          }

          const footer = root.querySelector<HTMLElement>('.site-footer')
          if (footer) {
            const footerLogo = footer.querySelector<HTMLElement>(
              '.site-footer__logo-frame',
            )
            const footerBrandCopy = footer.querySelector<HTMLElement>(
              '.site-footer__brand > p',
            )
            const socialItems = Array.from(
              footer.querySelectorAll<HTMLElement>('.site-footer__social > li'),
            )
            const footerColumns = Array.from(
              footer.querySelectorAll<HTMLElement>('.site-footer__column'),
            )
            const footerDetails = Array.from(
              footer.querySelectorAll<HTMLElement>(
                '.site-footer__business-data > div, .site-footer__contacts address > div, .site-footer__links > li',
              ),
            )
            const footerBottom = footer.querySelector<HTMLElement>('.site-footer__bottom')
            setMotionHint([
              ...(footerLogo ? [footerLogo] : []),
              ...(footerBrandCopy ? [footerBrandCopy] : []),
              ...socialItems,
              ...footerColumns,
              ...footerDetails,
              ...(footerBottom ? [footerBottom] : []),
            ])

            createReplayableSection({
              horizontalSignal: horizontalMotionSignal,
              trigger: footer,
              name: 'Footer',
              start: 'top 92%',
              end: 'bottom 8%',
              build: (timeline) => {
                if (footerLogo) {
                  timeline.fromTo(
                    footerLogo,
                    { opacity: 0, y: 34 * compactDistance, scale: 0.9 },
                    { ...finalTweenState, duration: 0.82 },
                  )
                }
                if (footerBrandCopy) {
                  timeline.fromTo(
                    footerBrandCopy,
                    { opacity: 0, y: 30 * compactDistance },
                    { ...finalTweenState, duration: 0.68 },
                    '-=0.44',
                  )
                }
                timeline.fromTo(
                  socialItems,
                  { opacity: 0, y: 22 * compactDistance, scale: 0.88 },
                  {
                    ...finalTweenState,
                    duration: 0.58,
                    stagger: conditions.compact ? 0.06 : 0.09,
                  },
                  '-=0.34',
                )
                timeline.fromTo(
                  footerColumns,
                  {
                    opacity: 0,
                    x: (index: number) =>
                      (index % 2 === 0 ? -1 : 1) * 46 * compactDistance,
                  },
                  {
                    ...finalTweenState,
                    duration: 0.82,
                    stagger: conditions.compact ? 0.08 : 0.12,
                  },
                  '-=0.48',
                )
                timeline.fromTo(
                  footerDetails,
                  { opacity: 0, y: 22 * compactDistance },
                  {
                    ...finalTweenState,
                    duration: 0.58,
                    stagger: 0.055,
                  },
                  '-=0.54',
                )
                if (footerBottom) {
                  timeline.fromTo(
                    footerBottom,
                    { opacity: 0, y: 30 * compactDistance },
                    { ...finalTweenState, duration: 0.7 },
                    '-=0.24',
                  )
                }
              },
            })
          }

          return () => horizontalMotionController?.abort()
        },
      )

      let refreshFrame = window.requestAnimationFrame(() => {
        refreshFrame = window.requestAnimationFrame(() => ScrollTrigger.refresh())
      })
      const refreshAfterLoad = () => ScrollTrigger.refresh()
      window.addEventListener('load', refreshAfterLoad, { once: true })

      return () => {
        window.cancelAnimationFrame(refreshFrame)
        window.removeEventListener('load', refreshAfterLoad)
        media.revert()
      }
    },
    { scope },
  )
}

