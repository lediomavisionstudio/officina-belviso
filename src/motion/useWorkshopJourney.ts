import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { RefObject } from 'react'
import {
  ENABLE_WORKSHOP_JOURNEY,
  WORKSHOP_JOURNEY_ACTIVE_EVENT,
  WORKSHOP_JOURNEY_DEBUG,
  WORKSHOP_JOURNEY_MOBILE_QUERY,
  WORKSHOP_JOURNEY_NAVIGATE_EVENT,
  WORKSHOP_JOURNEY_PANEL_IDS,
  isWorkshopJourneyPanel,
  workshopJourneyConfig,
  type WorkshopJourneyActiveDetail,
  type WorkshopJourneyDirection,
  type WorkshopJourneyNavigateDetail,
  type WorkshopJourneyPanelId,
} from '../config/workshopJourney'
import { scrollWindowTo } from '../utils/scrollWindowTo'

gsap.registerPlugin(ScrollTrigger, useGSAP)
ScrollTrigger.config({ ignoreMobileResize: true })

const interactiveSelector =
  'input, textarea, select, [contenteditable="true"], [data-premium-carousel]'

function emitActive(
  sectionId: WorkshopJourneyPanelId,
  direction: WorkshopJourneyDirection,
) {
  document.dispatchEvent(
    new CustomEvent<WorkshopJourneyActiveDetail>(
      WORKSHOP_JOURNEY_ACTIVE_EVENT,
      { detail: { sectionId, direction } },
    ),
  )
}

function getHashPanel(): WorkshopJourneyPanelId {
  const hash = window.location.hash.slice(1)
  return isWorkshopJourneyPanel(hash) ? hash : 'home'
}

function updateHash(sectionId: WorkshopJourneyPanelId) {
  const nextHash = `#${sectionId}`
  if (window.location.hash !== nextHash) {
    window.history.replaceState(null, '', nextHash)
  }
}

export function useWorkshopJourney(rootRef: RefObject<HTMLElement | null>) {
  useGSAP(
    () => {
      if (!ENABLE_WORKSHOP_JOURNEY) return

      const root = rootRef.current
      const journey = root?.querySelector<HTMLElement>('[data-workshop-journey]')
      const viewport = journey?.querySelector<HTMLElement>(
        '[data-workshop-viewport]',
      )
      const track = journey?.querySelector<HTMLElement>('[data-workshop-track]')
      const line = journey?.querySelector<HTMLElement>('[data-workshop-line]')
      const debug = journey?.querySelector<HTMLOutputElement>(
        '[data-workshop-debug]',
      )
      const panels = journey
        ? Array.from(
            journey.querySelectorAll<HTMLElement>('[data-workshop-panel]'),
          )
        : []

      if (!root || !journey || !viewport || !track || !line || panels.length !== 3) {
        return
      }

      const previousScrollRestoration = window.history.scrollRestoration
      window.history.scrollRestoration = 'manual'
      const media = gsap.matchMedia()
      let activeId = getHashPanel()

      const setPanelState = (
        sectionId: WorkshopJourneyPanelId,
        direction: WorkshopJourneyDirection,
      ) => {
        if (activeId === sectionId) return
        activeId = sectionId
        panels.forEach((panel) => {
          const active = panel.dataset.workshopPanel === sectionId
          panel.toggleAttribute('inert', !active)
          panel.setAttribute('aria-hidden', String(!active))
        })
        emitActive(sectionId, direction)
        updateHash(sectionId)
      }

      const initializePanelState = () => {
        panels.forEach((panel) => {
          const active = panel.dataset.workshopPanel === activeId
          panel.toggleAttribute('inert', !active)
          panel.setAttribute('aria-hidden', String(!active))
        })
        emitActive(activeId, 'initial')
      }

      const installImageMicroInteraction = (signal: AbortSignal) => {
        if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

        const mediaTargets = Array.from(
          journey.querySelectorAll<HTMLElement>(
            '.home-hero__placeholder .placeholder-image__media, .home-about__image .placeholder-image__media',
          ),
        )

        mediaTargets.forEach((mediaTarget) => {
          const moveX = gsap.quickTo(mediaTarget, 'x', {
            duration: 0.7,
            ease: 'power3.out',
          })
          const moveY = gsap.quickTo(mediaTarget, 'y', {
            duration: 0.7,
            ease: 'power3.out',
          })
          const scale = gsap.quickTo(mediaTarget, 'scale', {
            duration: 0.65,
            ease: 'power3.out',
          })

          mediaTarget.addEventListener(
            'pointermove',
            (event) => {
              const bounds = mediaTarget.getBoundingClientRect()
              const x = (event.clientX - bounds.left) / bounds.width - 0.5
              const y = (event.clientY - bounds.top) / bounds.height - 0.5
              moveX(x * 10)
              moveY(y * 10)
              scale(1.015)
            },
            { signal },
          )
          mediaTarget.addEventListener(
            'pointerleave',
            () => {
              moveX(0)
              moveY(0)
              scale(1)
            },
            { signal },
          )
        })
      }

      media.add(
        {
          desktop: workshopJourneyConfig.desktopQuery,
          compact: '(max-width: 960px)',
          reduceMotion: '(prefers-reduced-motion: reduce)',
        },
        (context) => {
          const { desktop, compact, reduceMotion } = context.conditions ?? {}
          const controller = new AbortController()

          if (desktop && !reduceMotion) {
            journey.dataset.workshopMode = 'desktop'
            journey.scrollLeft = 0
            viewport.scrollLeft = 0
            const timeline = gsap.timeline({ paused: true })
            const transitionDistance = Math.max(
              workshopJourneyConfig.minimumTransitionDistance,
              window.innerWidth * workshopJourneyConfig.transitionViewportRatio,
            )
            const heroPanel = panels[0]
            const aboutPanel = panels[1]
            const servicesPanel = panels[2]
            const heroImage = heroPanel.querySelector<HTMLElement>(
              '.home-hero__placeholder .placeholder-image__media img',
            )
            const heroCopy = heroPanel.querySelector<HTMLElement>('.home-hero__copy')
            const heroActions = heroPanel.querySelector<HTMLElement>(
              '.home-hero__actions',
            )
            const aboutImage = aboutPanel.querySelector<HTMLElement>(
              '.home-about__image',
            )
            const aboutMedia = aboutPanel.querySelector<HTMLElement>(
              '.home-about__image .placeholder-image__media',
            )
            const aboutHeading = aboutPanel.querySelector<HTMLElement>(
              '.section-heading',
            )
            const aboutBody = aboutPanel.querySelector<HTMLElement>(
              '.home-about__body',
            )
            const serviceCards = Array.from(
              servicesPanel.querySelectorAll<HTMLElement>(
                '.premium-carousel__slide',
              ),
            ).slice(0, 3)
            const orderedServiceCards = [
              serviceCards[1],
              serviceCards[2],
              serviceCards[0],
            ].filter((card): card is HTMLElement => card !== undefined)

            panels.forEach((panel, index) => {
              const section = panel.firstElementChild as HTMLElement | null
              const verticalDistance = Math.max(
                0,
                (section?.scrollHeight ?? panel.scrollHeight) - window.innerHeight,
              )
              timeline.addLabel(`panel-${index}`)

              if (section && verticalDistance > 0) {
                timeline.fromTo(
                  section,
                  { y: 0 },
                  {
                    duration: verticalDistance,
                    ease: 'none',
                    immediateRender: false,
                    y: -verticalDistance,
                  },
                )
              }

              if (index >= panels.length - 1) return

              const transitionLabel = `transition-${index}`
              timeline.addLabel(transitionLabel)
              timeline.fromTo(
                track,
                { xPercent: -(index * 100) / panels.length },
                {
                  duration: transitionDistance,
                  ease: 'none',
                  immediateRender: false,
                  xPercent: -((index + 1) * 100) / panels.length,
                },
                transitionLabel,
              )
              timeline.fromTo(
                panels[index],
                { opacity: 1, scale: 1 },
                {
                  duration: transitionDistance,
                  ease: 'none',
                  immediateRender: false,
                  opacity: 0.86,
                  scale: workshopJourneyConfig.panelExitScale,
                },
                transitionLabel,
              )
              timeline.fromTo(
                panels[index + 1],
                {
                  opacity: 0.9,
                  scale: workshopJourneyConfig.panelEntryScale,
                },
                {
                  duration: transitionDistance,
                  ease: 'none',
                  immediateRender: false,
                  opacity: 1,
                  scale: 1,
                },
                transitionLabel,
              )

              if (index === 0) {
                if (heroImage) {
                  timeline.fromTo(
                    heroImage,
                    { scale: 1 },
                    {
                      duration: transitionDistance,
                      ease: 'none',
                      immediateRender: false,
                      scale: 1.035,
                    },
                    transitionLabel,
                  )
                }
                if (heroCopy) {
                  timeline.fromTo(
                    heroCopy,
                    { opacity: 1 },
                    {
                      duration: transitionDistance,
                      ease: 'none',
                      immediateRender: false,
                      opacity: 0.68,
                    },
                    transitionLabel,
                  )
                }
                if (heroActions) {
                  timeline.fromTo(
                    heroActions,
                    { opacity: 1 },
                    {
                      duration: transitionDistance,
                      ease: 'none',
                      immediateRender: false,
                      opacity: 0.58,
                    },
                    transitionLabel,
                  )
                }
                if (aboutImage) {
                  timeline.fromTo(
                    aboutImage,
                    { clipPath: 'inset(0 100% 0 0 round 28px)' },
                    {
                      clipPath: 'inset(0 0% 0 0 round 28px)',
                      duration: transitionDistance * 0.72,
                      ease: 'power2.out',
                      immediateRender: false,
                    },
                    `${transitionLabel}+=${transitionDistance * 0.2}`,
                  )
                }
                if (aboutHeading) {
                  timeline.fromTo(
                    aboutHeading,
                    { opacity: 0.35, y: 34 },
                    {
                      duration: transitionDistance * 0.58,
                      ease: 'power2.out',
                      immediateRender: false,
                      opacity: 1,
                      y: 0,
                    },
                    `${transitionLabel}+=${transitionDistance * 0.28}`,
                  )
                }
                if (aboutBody) {
                  timeline.fromTo(
                    aboutBody,
                    { opacity: 0.3, y: 22 },
                    {
                      duration: transitionDistance * 0.48,
                      ease: 'power2.out',
                      immediateRender: false,
                      opacity: 1,
                      y: 0,
                    },
                    `${transitionLabel}+=${transitionDistance * 0.42}`,
                  )
                }
              } else {
                if (aboutMedia) {
                  timeline.fromTo(
                    aboutMedia,
                    { scale: 1 },
                    {
                      duration: transitionDistance,
                      ease: 'none',
                      immediateRender: false,
                      scale: 1.018,
                    },
                    transitionLabel,
                  )
                }
                if (aboutHeading || aboutBody) {
                  timeline.fromTo(
                    [aboutHeading, aboutBody].filter(Boolean),
                    { opacity: 1 },
                    {
                      duration: transitionDistance,
                      ease: 'none',
                      immediateRender: false,
                      opacity: 0.7,
                    },
                    transitionLabel,
                  )
                }
                if (orderedServiceCards.length > 0) {
                  timeline.fromTo(
                    orderedServiceCards,
                    {
                      opacity: 0.58,
                      scale: (itemIndex) => (itemIndex === 0 ? 1.025 : 1.012),
                      y: (itemIndex) => [26, 42, 52][itemIndex] ?? 36,
                    },
                    {
                      duration: transitionDistance * 0.58,
                      ease: 'power2.out',
                      immediateRender: false,
                      opacity: 1,
                      scale: 1,
                      stagger: transitionDistance * 0.025,
                      y: 0,
                    },
                    `${transitionLabel}+=${transitionDistance * 0.3}`,
                  )
                }
              }
            })

            const totalDuration = Math.max(1, timeline.duration())
            journey.style.setProperty(
              '--workshop-scroll-distance',
              String(totalDuration),
            )
            timeline.fromTo(
              line,
              { scaleX: 0.12 },
              {
                duration: totalDuration,
                ease: 'none',
                immediateRender: false,
                scaleX: 1,
              },
              0,
            )

            let previousIndex = Math.max(
              0,
              WORKSHOP_JOURNEY_PANEL_IDS.indexOf(activeId),
            )
            let activeFrame = 0

            const updateActive = () => {
              activeFrame = 0
              const activeLine = window.innerWidth * 0.4
              const panelPositions = panels.map((panel) => ({
                bounds: panel.getBoundingClientRect(),
                panel,
              }))
              const containingIndex = panelPositions.findIndex(
                ({ bounds }) =>
                  bounds.left <= activeLine && bounds.right > activeLine,
              )
              const index =
                containingIndex >= 0
                  ? containingIndex
                  : panelPositions.reduce((closestIndex, candidate, panelIndex) => {
                      const closest = panelPositions[closestIndex]
                      const closestDistance = Math.min(
                        Math.abs(closest.bounds.left - activeLine),
                        Math.abs(closest.bounds.right - activeLine),
                      )
                      const candidateDistance = Math.min(
                        Math.abs(candidate.bounds.left - activeLine),
                        Math.abs(candidate.bounds.right - activeLine),
                      )

                      return candidateDistance < closestDistance
                        ? panelIndex
                        : closestIndex
                    }, 0)
              const sectionId = WORKSHOP_JOURNEY_PANEL_IDS[index]
              if (index !== previousIndex) {
                const direction: WorkshopJourneyDirection =
                  index > previousIndex ? 'forward' : 'backward'
                previousIndex = index
                setPanelState(sectionId, direction)
              }
              if (WORKSHOP_JOURNEY_DEBUG && debug) {
                debug.textContent = `panel: ${sectionId} · progress: ${trigger.progress.toFixed(3)} · track: ${Math.round(track.getBoundingClientRect().left)}px`
              }
            }

            const trigger = ScrollTrigger.create({
              animation: timeline,
              end: 'bottom bottom',
              invalidateOnRefresh: true,
              markers: WORKSHOP_JOURNEY_DEBUG,
              onEnter: () => gsap.set(line, { autoAlpha: 1 }),
              onEnterBack: () => gsap.set(line, { autoAlpha: 1 }),
              onLeave: () => gsap.set(line, { autoAlpha: 0 }),
              onUpdate: () => {
                window.cancelAnimationFrame(activeFrame)
                activeFrame = window.requestAnimationFrame(updateActive)
              },
              scrub: workshopJourneyConfig.scrub,
              start: 'top top',
              trigger: journey,
            })

            const navigate = (event: Event) => {
              const detail = (event as CustomEvent<WorkshopJourneyNavigateDetail>)
                .detail
              if (!detail || !isWorkshopJourneyPanel(detail.sectionId)) return
              const index = WORKSHOP_JOURNEY_PANEL_IDS.indexOf(detail.sectionId)
              const direction: WorkshopJourneyDirection =
                index > previousIndex ? 'forward' : 'backward'
              previousIndex = index
              setPanelState(detail.sectionId, direction)
              window.scrollTo({
                behavior: detail.behavior ?? 'smooth',
                top: trigger.labelToScroll(`panel-${index}`),
              })
            }

            const keydown = (event: KeyboardEvent) => {
              if (
                event.defaultPrevented ||
                (event.target instanceof Element &&
                  event.target.closest(interactiveSelector))
              ) {
                return
              }
              const forward = event.key === 'ArrowRight' || event.key === 'PageDown'
              const backward = event.key === 'ArrowLeft' || event.key === 'PageUp'
              if (!forward && !backward) return
              const currentIndex = WORKSHOP_JOURNEY_PANEL_IDS.indexOf(activeId)
              const nextIndex = Math.max(
                0,
                Math.min(2, currentIndex + (forward ? 1 : -1)),
              )
              if (nextIndex === currentIndex) return
              event.preventDefault()
              navigate(
                new CustomEvent<WorkshopJourneyNavigateDetail>(
                  WORKSHOP_JOURNEY_NAVIGATE_EVENT,
                  {
                    detail: {
                      sectionId: WORKSHOP_JOURNEY_PANEL_IDS[nextIndex],
                      behavior: 'smooth',
                    },
                  },
                ),
              )
            }

            const handleHashChange = () => {
              const sectionId = window.location.hash.slice(1)
              if (!isWorkshopJourneyPanel(sectionId)) return
              navigate(
                new CustomEvent<WorkshopJourneyNavigateDetail>(
                  WORKSHOP_JOURNEY_NAVIGATE_EVENT,
                  { detail: { sectionId, behavior: 'smooth' } },
                ),
              )
            }

            document.addEventListener(WORKSHOP_JOURNEY_NAVIGATE_EVENT, navigate)
            window.addEventListener('keydown', keydown)
            window.addEventListener('hashchange', handleHashChange)
            initializePanelState()
            installImageMicroInteraction(controller.signal)

            const initialIndex = WORKSHOP_JOURNEY_PANEL_IDS.indexOf(activeId)
            if (initialIndex > 0) {
              window.requestAnimationFrame(() => {
                window.scrollTo({
                  behavior: 'auto',
                  top: trigger.labelToScroll(`panel-${initialIndex}`),
                })
              })
            }

            return () => {
              controller.abort()
              document.removeEventListener(WORKSHOP_JOURNEY_NAVIGATE_EVENT, navigate)
              window.removeEventListener('keydown', keydown)
              window.removeEventListener('hashchange', handleHashChange)
              window.cancelAnimationFrame(activeFrame)
              trigger.kill()
              timeline.kill()
              journey.style.removeProperty('--workshop-scroll-distance')
              gsap.set([track, line, ...panels], { clearProps: 'all' })
              panels.forEach((panel) => {
                const section = panel.firstElementChild as HTMLElement | null
                if (section) gsap.set(section, { clearProps: 'transform' })
              })
              delete journey.dataset.workshopMode
            }
          }

          if (compact && reduceMotion) {
            journey.dataset.workshopMode = 'mobile-static'
            panels.forEach((panel) => {
              panel.removeAttribute('inert')
              panel.removeAttribute('aria-hidden')
            })
            gsap.set([track, line, ...panels], { clearProps: 'all' })

            return () => {
              controller.abort()
              gsap.set([track, line, ...panels], { clearProps: 'all' })
              panels.forEach((panel) => {
                panel.removeAttribute('inert')
                panel.removeAttribute('aria-hidden')
              })
              delete journey.dataset.workshopMode
            }
          }

          if (compact) {
            journey.dataset.workshopMode = 'mobile-narrative'
            const mobileOptimized = window.matchMedia(
              WORKSHOP_JOURNEY_MOBILE_QUERY,
            ).matches
            const sections = panels.map(
              (panel) => panel.firstElementChild as HTMLElement,
            )
            let refreshFrame = 0
            let refreshTimer = 0
            let cancelNavigationTween: (() => void) | null = null
            let pendingPreservedIndex: number | null = null
            let measuredViewportWidth = viewport.clientWidth || window.innerWidth
            let previousIndex = Math.max(
              0,
              WORKSHOP_JOURNEY_PANEL_IDS.indexOf(activeId),
            )
            let geometry = {
              panelOffsets: [0, window.innerWidth, window.innerWidth * 2],
              panelStarts: [0, window.innerWidth, window.innerWidth * 2],
              totalDistance: window.innerWidth * 2,
              transitionDistance: window.innerWidth,
              verticalDistances: [0, 0, 0],
            }
            const setSectionY = sections.map((section) =>
              gsap.quickSetter(section, 'y', 'px'),
            )
            const setTrackX = gsap.quickSetter(track, 'x', 'px')
            const setPanelOpacity = panels.map((panel) =>
              gsap.quickSetter(panel, 'opacity'),
            )
            const setPanelScale = panels.map((panel) =>
              gsap.quickSetter(panel, 'scale'),
            )
            const previousSectionY = sections.map(() => Number.NaN)
            const previousPanelOpacity = panels.map(() => Number.NaN)
            const previousPanelScale = panels.map(() => Number.NaN)
            let previousTrackX = Number.NaN
            gsap.set([track, ...sections], { force3D: true })

            const measure = () => {
              const viewportWidth = viewport.clientWidth || window.innerWidth
              const panelOffsets = panels.map((panel) => panel.offsetLeft)
              const horizontalDistance = Math.max(
                0,
                track.scrollWidth - viewportWidth,
              )
              const transitionDistance =
                horizontalDistance / Math.max(1, panels.length - 1)
              const verticalDistances = sections.map((section, index) =>
                Math.max(
                  0,
                  section.scrollHeight -
                    (panels[index].clientHeight || window.innerHeight),
                ),
              )
              const panelStarts: number[] = []
              let cursor = 0

              panels.forEach((_, index) => {
                panelStarts.push(cursor)
                cursor += verticalDistances[index]
                if (index < panels.length - 1) cursor += transitionDistance
              })

              geometry = {
                panelOffsets,
                panelStarts,
                totalDistance: Math.max(1, cursor),
                transitionDistance,
                verticalDistances,
              }
              journey.style.setProperty(
                '--workshop-scroll-distance',
                String(geometry.totalDistance),
              )
            }

            const render = (progress: number) => {
              const clampedProgress = gsap.utils.clamp(0, 1, progress)
              const distance = clampedProgress * geometry.totalDistance
              let trackX = 0
              let transitionIndex = -1
              let transitionProgress = 0

              sections.forEach((_, index) => {
                const localDistance = distance - geometry.panelStarts[index]
                const y = -Math.max(
                  0,
                  Math.min(geometry.verticalDistances[index], localDistance),
                )
                if (y !== previousSectionY[index]) {
                  previousSectionY[index] = y
                  setSectionY[index](y)
                }
              })

              for (let index = 0; index < panels.length - 1; index += 1) {
                const transitionStart =
                  geometry.panelStarts[index] + geometry.verticalDistances[index]
                const transitionEnd = geometry.panelStarts[index + 1]

                if (distance >= transitionEnd) {
                  trackX = -geometry.panelOffsets[index + 1]
                  continue
                }
                if (distance >= transitionStart) {
                  transitionIndex = index
                  transitionProgress =
                    (distance - transitionStart) /
                    Math.max(1, geometry.transitionDistance)
                  trackX = gsap.utils.interpolate(
                    -geometry.panelOffsets[index],
                    -geometry.panelOffsets[index + 1],
                    transitionProgress,
                  )
                }
                break
              }

              if (trackX !== previousTrackX) {
                previousTrackX = trackX
                setTrackX(trackX)
              }

              const nextPanelOpacity = panels.map(() => 1)
              const nextPanelScale = panels.map(() => 1)

              if (transitionIndex >= 0) {
                nextPanelOpacity[transitionIndex] =
                  1 - transitionProgress * 0.14
                nextPanelScale[transitionIndex] =
                  1 - transitionProgress * 0.03
                nextPanelOpacity[transitionIndex + 1] =
                  0.9 + transitionProgress * 0.1
                nextPanelScale[transitionIndex + 1] =
                  workshopJourneyConfig.panelEntryScale -
                    transitionProgress *
                      (workshopJourneyConfig.panelEntryScale - 1)
              }

              panels.forEach((_, index) => {
                if (nextPanelOpacity[index] !== previousPanelOpacity[index]) {
                  previousPanelOpacity[index] = nextPanelOpacity[index]
                  setPanelOpacity[index](nextPanelOpacity[index])
                }
                if (nextPanelScale[index] !== previousPanelScale[index]) {
                  previousPanelScale[index] = nextPanelScale[index]
                  setPanelScale[index](nextPanelScale[index])
                }
              })

              const activeIndex = geometry.panelStarts.reduce(
                (currentIndex, panelStart, index) => {
                  if (index === 0) return currentIndex
                  const activationPoint =
                    panelStart - geometry.transitionDistance * 0.5
                  return distance >= activationPoint ? index : currentIndex
                },
                0,
              )

              if (activeIndex !== previousIndex) {
                const direction: WorkshopJourneyDirection =
                  activeIndex > previousIndex ? 'forward' : 'backward'
                previousIndex = activeIndex
                setPanelState(WORKSHOP_JOURNEY_PANEL_IDS[activeIndex], direction)
              }

              line.style.transform = `scaleX(${0.12 + clampedProgress * 0.88})`
              if (WORKSHOP_JOURNEY_DEBUG && debug) {
                debug.textContent = `panel: ${WORKSHOP_JOURNEY_PANEL_IDS[activeIndex]} · progress: ${clampedProgress.toFixed(3)} · track: ${Math.round(trackX)}px`
              }
            }

            measure()
            const trigger = ScrollTrigger.create({
              end: 'bottom bottom',
              invalidateOnRefresh: true,
              markers: WORKSHOP_JOURNEY_DEBUG,
              onEnter: () => gsap.set(line, { autoAlpha: 1 }),
              onEnterBack: () => gsap.set(line, { autoAlpha: 1 }),
              onLeave: () => {
                render(1)
                gsap.set(line, { autoAlpha: 0 })
              },
              onLeaveBack: () => {
                render(0)
                gsap.set(line, { autoAlpha: 0 })
              },
              onRefresh: (self) => render(self.progress),
              onUpdate: (self) => render(self.progress),
              start: 'top top',
              trigger: journey,
            })

            const navigate = (event: Event) => {
              const detail = (event as CustomEvent<WorkshopJourneyNavigateDetail>)
                .detail
              if (!detail || !isWorkshopJourneyPanel(detail.sectionId)) return
              const index = WORKSHOP_JOURNEY_PANEL_IDS.indexOf(detail.sectionId)
              const direction: WorkshopJourneyDirection =
                index > previousIndex ? 'forward' : 'backward'
              previousIndex = index
              setPanelState(detail.sectionId, direction)
              cancelNavigationTween?.()
              if (mobileOptimized) {
                cancelNavigationTween = scrollWindowTo({
                  behavior: 'auto',
                  onComplete: () => {
                    cancelNavigationTween = null
                    detail.onComplete?.()
                  },
                  top: trigger.start + geometry.panelStarts[index],
                })
              } else {
                window.scrollTo({
                  behavior: detail.behavior ?? 'smooth',
                  top: trigger.start + geometry.panelStarts[index],
                })
              }
            }

            const handleHashChange = () => {
              const sectionId = window.location.hash.slice(1)
              if (!isWorkshopJourneyPanel(sectionId)) return
              navigate(
                new CustomEvent<WorkshopJourneyNavigateDetail>(
                  WORKSHOP_JOURNEY_NAVIGATE_EVENT,
                  { detail: { sectionId, behavior: 'smooth' } },
                ),
              )
            }

            const keydown = (event: KeyboardEvent) => {
              if (
                event.defaultPrevented ||
                (event.target instanceof Element &&
                  event.target.closest(interactiveSelector))
              ) {
                return
              }
              const forward = event.key === 'ArrowRight' || event.key === 'PageDown'
              const backward = event.key === 'ArrowLeft' || event.key === 'PageUp'
              if (!forward && !backward) return
              const nextIndex = Math.max(
                0,
                Math.min(2, previousIndex + (forward ? 1 : -1)),
              )
              if (nextIndex === previousIndex) return
              event.preventDefault()
              navigate(
                new CustomEvent<WorkshopJourneyNavigateDetail>(
                  WORKSHOP_JOURNEY_NAVIGATE_EVENT,
                  {
                    detail: {
                      sectionId: WORKSHOP_JOURNEY_PANEL_IDS[nextIndex],
                      behavior: 'smooth',
                    },
                  },
                ),
              )
            }

            const refreshGeometry = () => {
              window.cancelAnimationFrame(refreshFrame)
              refreshFrame = window.requestAnimationFrame(() => {
                const nextViewportWidth = viewport.clientWidth || window.innerWidth
                const preservePanel =
                  Math.abs(nextViewportWidth - measuredViewportWidth) > 2
                const preservedIndex = pendingPreservedIndex ?? previousIndex
                measure()
                ScrollTrigger.refresh()
                measuredViewportWidth = nextViewportWidth
                if (preservePanel) {
                  const direction: WorkshopJourneyDirection =
                    preservedIndex > previousIndex ? 'forward' : 'backward'
                  previousIndex = preservedIndex
                  setPanelState(
                    WORKSHOP_JOURNEY_PANEL_IDS[preservedIndex],
                    direction,
                  )
                  window.scrollTo({
                    behavior: 'auto',
                    top: trigger.start + geometry.panelStarts[preservedIndex],
                  })
                }
                pendingPreservedIndex = null
              })
            }

            const requestRefresh = (force = false) => {
              if (
                mobileOptimized &&
                !force &&
                Math.abs(
                  (viewport.clientWidth || window.innerWidth) -
                    measuredViewportWidth,
                ) <= 2
              ) {
                return
              }

              window.clearTimeout(refreshTimer)
              refreshTimer = window.setTimeout(
                refreshGeometry,
                mobileOptimized ? 120 : 0,
              )
            }

            const resizeObserver = new ResizeObserver(() => requestRefresh())
            if (mobileOptimized) resizeObserver.observe(track)
            else {
              resizeObserver.observe(viewport)
              sections.forEach((section) => resizeObserver.observe(section))
            }
            const preservePanelAndRefresh = () => {
              if (
                Math.abs(
                  (viewport.clientWidth || window.innerWidth) -
                    measuredViewportWidth,
                ) <= 2
              ) {
                return
              }
              pendingPreservedIndex ??= previousIndex
              requestRefresh(true)
            }
            const refreshAfterOrientation = () => {
              pendingPreservedIndex ??= previousIndex
              requestRefresh(true)
            }
            const refreshAfterLoad = () => requestRefresh(true)
            window.addEventListener('resize', preservePanelAndRefresh, {
              passive: true,
            })
            window.addEventListener('orientationchange', refreshAfterOrientation)
            window.addEventListener('load', refreshAfterLoad, { once: true })
            void document.fonts?.ready.then(() => {
              if (!controller.signal.aborted) requestRefresh(true)
            })
            document.addEventListener(WORKSHOP_JOURNEY_NAVIGATE_EVENT, navigate)
            window.addEventListener('keydown', keydown)
            window.addEventListener('hashchange', handleHashChange)
            initializePanelState()
            render(0)

            const initialIndex = WORKSHOP_JOURNEY_PANEL_IDS.indexOf(activeId)
            if (initialIndex > 0) {
              refreshFrame = window.requestAnimationFrame(() => {
                measure()
                ScrollTrigger.refresh()
                window.scrollTo({
                  behavior: 'auto',
                  top: trigger.start + geometry.panelStarts[initialIndex],
                })
              })
            }

            return () => {
              controller.abort()
              resizeObserver.disconnect()
              cancelNavigationTween?.()
              window.cancelAnimationFrame(refreshFrame)
              window.clearTimeout(refreshTimer)
              window.removeEventListener('resize', preservePanelAndRefresh)
              window.removeEventListener(
                'orientationchange',
                refreshAfterOrientation,
              )
              window.removeEventListener('load', refreshAfterLoad)
              document.removeEventListener(WORKSHOP_JOURNEY_NAVIGATE_EVENT, navigate)
              window.removeEventListener('keydown', keydown)
              window.removeEventListener('hashchange', handleHashChange)
              trigger.kill()
              journey.style.removeProperty('--workshop-scroll-distance')
              gsap.set([track, line, ...panels, ...sections], {
                clearProps: 'all',
              })
              panels.forEach((panel) => {
                panel.removeAttribute('inert')
                panel.removeAttribute('aria-hidden')
              })
              delete journey.dataset.workshopMode
            }
          }

          if (reduceMotion) {
            journey.dataset.workshopMode = 'reduced'
            const smoothBehavior: ScrollBehavior = reduceMotion ? 'auto' : 'smooth'
            let frame = 0
            let programmaticIndex: number | null = null
            let touchStartX = 0
            let touchStartY = 0
            let previousIndex = Math.max(
              0,
              WORKSHOP_JOURNEY_PANEL_IDS.indexOf(activeId),
            )

            const updateActive = () => {
              frame = 0
              if (programmaticIndex !== null) {
                const targetLeft = panels[programmaticIndex].offsetLeft
                if (Math.abs(targetLeft - journey.scrollLeft) > 2) return
                programmaticIndex = null
              }
              const index = panels.reduce(
                (closestIndex, panel, panelIndex) =>
                  Math.abs(panel.offsetLeft - journey.scrollLeft) <
                  Math.abs(panels[closestIndex].offsetLeft - journey.scrollLeft)
                    ? panelIndex
                    : closestIndex,
                0,
              )
              if (index === previousIndex) return
              const direction: WorkshopJourneyDirection =
                index > previousIndex ? 'forward' : 'backward'
              previousIndex = index
              setPanelState(WORKSHOP_JOURNEY_PANEL_IDS[index], direction)
            }

            const navigate = (event: Event) => {
              const detail = (event as CustomEvent<WorkshopJourneyNavigateDetail>)
                .detail
              if (!detail || !isWorkshopJourneyPanel(detail.sectionId)) return
              const index = WORKSHOP_JOURNEY_PANEL_IDS.indexOf(detail.sectionId)
              const direction: WorkshopJourneyDirection =
                index > previousIndex ? 'forward' : 'backward'
              programmaticIndex = index
              previousIndex = index
              setPanelState(detail.sectionId, direction)
              const behavior = reduceMotion
                ? 'auto'
                : detail.behavior ?? smoothBehavior
              journey.scrollTo({
                behavior,
                left: panels[index].offsetLeft,
              })
              window.scrollTo({
                behavior,
                top: journey.getBoundingClientRect().top + window.scrollY,
              })
            }

            const handleHashChange = () => {
              const sectionId = window.location.hash.slice(1)
              if (!isWorkshopJourneyPanel(sectionId)) return
              navigate(
                new CustomEvent<WorkshopJourneyNavigateDetail>(
                  WORKSHOP_JOURNEY_NAVIGATE_EVENT,
                  { detail: { sectionId, behavior: smoothBehavior } },
                ),
              )
            }

            const keydown = (event: KeyboardEvent) => {
              if (
                event.defaultPrevented ||
                (event.target instanceof Element &&
                  event.target.closest(interactiveSelector))
              ) {
                return
              }
              const forward = event.key === 'ArrowRight' || event.key === 'PageDown'
              const backward = event.key === 'ArrowLeft' || event.key === 'PageUp'
              if (!forward && !backward) return
              const nextIndex = Math.max(
                0,
                Math.min(2, previousIndex + (forward ? 1 : -1)),
              )
              if (nextIndex === previousIndex) return
              event.preventDefault()
              navigate(
                new CustomEvent<WorkshopJourneyNavigateDetail>(
                  WORKSHOP_JOURNEY_NAVIGATE_EVENT,
                  {
                    detail: {
                      sectionId: WORKSHOP_JOURNEY_PANEL_IDS[nextIndex],
                      behavior: smoothBehavior,
                    },
                  },
                ),
              )
            }

            const servicesPanel = panels[2]
            const servicesAtBottom = () =>
              servicesPanel.scrollTop + servicesPanel.clientHeight >=
              servicesPanel.scrollHeight - 2

            const bridgeWheel = (event: WheelEvent) => {
              if (
                previousIndex !== 2 ||
                event.deltaY <= 0 ||
                !servicesAtBottom()
              ) {
                return
              }
              event.preventDefault()
              window.scrollBy({ top: event.deltaY })
            }

            const rememberTouch = (event: TouchEvent) => {
              touchStartX = event.touches[0]?.clientX ?? 0
              touchStartY = event.touches[0]?.clientY ?? 0
            }

            const bridgeTouch = (event: TouchEvent) => {
              const touch = event.touches[0]
              if (!touch || previousIndex !== 2) return
              const deltaX = touch.clientX - touchStartX
              const deltaY = touch.clientY - touchStartY
              if (
                deltaY >= 0 ||
                Math.abs(deltaY) <= Math.abs(deltaX) ||
                !servicesAtBottom()
              ) {
                return
              }
              event.preventDefault()
              window.scrollBy({ top: -deltaY })
              touchStartY = touch.clientY
            }

            const onScroll = () => {
              if (frame) return
              frame = window.requestAnimationFrame(updateActive)
              const progress = journey.scrollLeft / Math.max(1, journey.scrollWidth - journey.clientWidth)
              line.style.transform = `scaleX(${0.12 + progress * 0.88})`
            }

            journey.addEventListener('scroll', onScroll, { passive: true })
            journey.addEventListener('wheel', bridgeWheel, { passive: false })
            journey.addEventListener('touchstart', rememberTouch, { passive: true })
            journey.addEventListener('touchmove', bridgeTouch, { passive: false })
            document.addEventListener(WORKSHOP_JOURNEY_NAVIGATE_EVENT, navigate)
            window.addEventListener('keydown', keydown)
            window.addEventListener('hashchange', handleHashChange)
            initializePanelState()
            const initialIndex = WORKSHOP_JOURNEY_PANEL_IDS.indexOf(activeId)
            journey.scrollLeft = panels[initialIndex].offsetLeft

            return () => {
              controller.abort()
              window.cancelAnimationFrame(frame)
              journey.removeEventListener('scroll', onScroll)
              journey.removeEventListener('wheel', bridgeWheel)
              journey.removeEventListener('touchstart', rememberTouch)
              journey.removeEventListener('touchmove', bridgeTouch)
              document.removeEventListener(WORKSHOP_JOURNEY_NAVIGATE_EVENT, navigate)
              window.removeEventListener('keydown', keydown)
              window.removeEventListener('hashchange', handleHashChange)
              line.style.removeProperty('transform')
              delete journey.dataset.workshopMode
            }
          }
        },
      )

      return () => {
        media.revert()
        window.history.scrollRestoration = previousScrollRestoration
        panels.forEach((panel) => {
          panel.removeAttribute('inert')
          panel.removeAttribute('aria-hidden')
        })
      }
    },
    { scope: rootRef },
  )
}
