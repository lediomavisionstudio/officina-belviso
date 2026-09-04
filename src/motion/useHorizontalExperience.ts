import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { RefObject } from 'react'
import {
  ENABLE_HORIZONTAL_EXPERIENCE,
  HORIZONTAL_EXPERIENCE_ACTIVE_EVENT,
  HORIZONTAL_EXPERIENCE_DESKTOP_QUERY,
  HORIZONTAL_EXPERIENCE_NAVIGATE_EVENT,
  horizontalExperienceConfig,
  type HorizontalActiveDetail,
  type HorizontalDirection,
  type HorizontalNavigateDetail,
} from '../config/horizontalExperience'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const interactiveSelector =
  'input, textarea, select, [contenteditable="true"], .premium-carousel'

function emitActive(sectionId: string, direction: HorizontalDirection) {
  document.dispatchEvent(
    new CustomEvent<HorizontalActiveDetail>(HORIZONTAL_EXPERIENCE_ACTIVE_EVENT, {
      detail: { sectionId, direction },
    }),
  )
}

function getHashSection(panelIds: string[]) {
  const hash = window.location.hash.slice(1)
  return panelIds.includes(hash) ? hash : panelIds[0]
}

function updateHash(sectionId: string) {
  const nextHash = sectionId === 'home' ? '#home' : `#${sectionId}`
  if (window.location.hash !== nextHash) {
    window.history.replaceState(null, '', nextHash)
  }
}

export function useHorizontalExperience(rootRef: RefObject<HTMLElement | null>) {
  useGSAP(
    () => {
      if (!ENABLE_HORIZONTAL_EXPERIENCE) return

      const root = rootRef.current
      const experience = root?.querySelector<HTMLElement>('[data-horizontal-experience]')
      const viewport = experience?.querySelector<HTMLElement>(
        '[data-horizontal-viewport]',
      )
      const track = experience?.querySelector<HTMLElement>('[data-horizontal-track]')
      const panels = experience
        ? Array.from(
            experience.querySelectorAll<HTMLElement>('[data-horizontal-panel]'),
          )
        : []

      if (!root || !experience || !viewport || !track || panels.length === 0) return

      const panelIds = panels.map((panel) => panel.dataset.horizontalPanel ?? '')
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
      const previousScrollRestoration = window.history.scrollRestoration
      window.history.scrollRestoration = 'manual'
      const media = gsap.matchMedia()
      let activeId = getHashSection(panelIds)

      const setPanelState = (sectionId: string, direction: HorizontalDirection) => {
        if (!panelIds.includes(sectionId) || activeId === sectionId) return
        activeId = sectionId
        panels.forEach((panel) => {
          const active = panel.dataset.horizontalPanel === sectionId
          panel.toggleAttribute('inert', !active)
          panel.setAttribute('aria-hidden', String(!active))
        })
        emitActive(sectionId, direction)
        updateHash(sectionId)
      }

      const initializePanelState = () => {
        panels.forEach((panel) => {
          const active = panel.dataset.horizontalPanel === activeId
          panel.toggleAttribute('inert', !active)
          panel.setAttribute('aria-hidden', String(!active))
        })
        emitActive(activeId, 'initial')
      }

      media.add(
        {
          desktop: HORIZONTAL_EXPERIENCE_DESKTOP_QUERY,
          mobile: `(max-width: 960px)`,
          motion: '(prefers-reduced-motion: no-preference)',
        },
        (context) => {
          const { desktop, mobile, motion } = context.conditions ?? {}
          if (!motion || reducedMotion.matches) {
            panels.forEach((panel) => {
              panel.removeAttribute('inert')
              panel.removeAttribute('aria-hidden')
            })
            return
          }

          if (desktop) {
            experience.dataset.horizontalMode = 'desktop'
            experience.scrollLeft = 0
            viewport.scrollLeft = 0
            const initialDocumentScrollBehavior =
              document.documentElement.style.scrollBehavior
            document.documentElement.style.scrollBehavior = 'auto'
            window.scrollTo({ behavior: 'auto', top: 0 })
            const timeline = gsap.timeline({ paused: true })

            panels.forEach((panel, index) => {
              const section = panel.firstElementChild as HTMLElement | null
              const verticalDistance = Math.max(
                0,
                (section?.scrollHeight ?? panel.scrollHeight) - window.innerHeight,
              )
              timeline.addLabel(`panel-${index}`, timeline.duration())

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

              if (index < panels.length - 1) {
                const transitionDuration = Math.max(
                  horizontalExperienceConfig.minimumTransitionDistance,
                  window.innerWidth *
                    horizontalExperienceConfig.transitionViewportRatio,
                )
                timeline.fromTo(
                  track,
                  { xPercent: -(index * 100) / panels.length },
                  {
                    duration: transitionDuration,
                    ease: 'none',
                    immediateRender: false,
                    xPercent: -((index + 1) * 100) / panels.length,
                  },
                )
              }
            })

            const totalDuration = Math.max(1, timeline.duration())
            experience.style.setProperty(
              '--horizontal-scroll-distance',
              String(totalDuration),
            )
            let previousIndex = Math.max(0, panelIds.indexOf(activeId))
            let activeFrame = 0
            let initialAlignmentFrame = 0
            let initialAlignmentTimer = 0
            let finishInitialAlignment: (() => void) | null = null

            const getClosestPanelIndex = () =>
              panels.reduce(
                (closestIndex, panel, panelIndex) =>
                  Math.abs(panel.getBoundingClientRect().left) <
                  Math.abs(panels[closestIndex].getBoundingClientRect().left)
                    ? panelIndex
                    : closestIndex,
                0,
              )

            const updateActiveFromGeometry = () => {
              activeFrame = 0
              const index = getClosestPanelIndex()
              if (index === previousIndex) return
              const direction: HorizontalDirection =
                index > previousIndex ? 'forward' : 'backward'
              previousIndex = index
              setPanelState(panelIds[index], direction)
            }

            const scheduleActiveUpdate = () => {
              window.cancelAnimationFrame(activeFrame)
              activeFrame = window.requestAnimationFrame(updateActiveFromGeometry)
            }

            const scrollToPanel = (
              sectionId: string,
              behavior: ScrollBehavior = 'smooth',
            ) => {
              const index = panelIds.indexOf(sectionId)
              if (index < 0 || !trigger) return

              const destination = trigger.labelToScroll(`panel-${index}`)
              if (behavior === 'auto') {
                const documentElement = document.documentElement
                const previousScrollBehavior = documentElement.style.scrollBehavior
                documentElement.style.scrollBehavior = 'auto'
                trigger.scroll(destination)
                trigger.update()
                trigger.getTween()?.kill()
                timeline.seek(`panel-${index}`, false)
                scheduleActiveUpdate()
                window.requestAnimationFrame(() => {
                  documentElement.style.scrollBehavior = previousScrollBehavior
                })
                return
              }
              window.scrollTo({ top: destination, behavior })
            }

            const trigger = ScrollTrigger.create({
              animation: timeline,
              end: 'bottom bottom',
              invalidateOnRefresh: true,
              onUpdate: scheduleActiveUpdate,
              scrub: horizontalExperienceConfig.scrub,
              start: 0,
            })

            const navigate = (event: Event) => {
              const detail = (event as CustomEvent<HorizontalNavigateDetail>).detail
              if (!detail || !panelIds.includes(detail.sectionId)) return
              const nextIndex = panelIds.indexOf(detail.sectionId)
              const direction: HorizontalDirection =
                nextIndex > previousIndex ? 'forward' : 'backward'
              previousIndex = nextIndex
              setPanelState(detail.sectionId, direction)
              scrollToPanel(detail.sectionId, detail.behavior)
            }

            const keydown = (event: KeyboardEvent) => {
              if (event.defaultPrevented) return
              if (event.target instanceof Element && event.target.closest(interactiveSelector)) {
                return
              }

              const forward = event.key === 'ArrowRight' || event.key === 'PageDown'
              const backward = event.key === 'ArrowLeft' || event.key === 'PageUp'
              if (!forward && !backward) return

              const currentIndex = panelIds.indexOf(activeId)
              const nextIndex = Math.max(
                0,
                Math.min(panelIds.length - 1, currentIndex + (forward ? 1 : -1)),
              )
              if (nextIndex === currentIndex) return
              event.preventDefault()
              document.dispatchEvent(
                new CustomEvent<HorizontalNavigateDetail>(
                  HORIZONTAL_EXPERIENCE_NAVIGATE_EVENT,
                  { detail: { sectionId: panelIds[nextIndex], behavior: 'smooth' } },
                ),
              )
            }

            const handleHashChange = () => {
              const sectionId = getHashSection(panelIds)
              navigate(
                new CustomEvent<HorizontalNavigateDetail>(
                  HORIZONTAL_EXPERIENCE_NAVIGATE_EVENT,
                  { detail: { sectionId, behavior: 'smooth' } },
                ),
              )
            }

            document.addEventListener(HORIZONTAL_EXPERIENCE_NAVIGATE_EVENT, navigate)
            window.addEventListener('keydown', keydown)
            window.addEventListener('hashchange', handleHashChange)
            initializePanelState()
            finishInitialAlignment = () => {
              window.clearTimeout(initialAlignmentTimer)
              window.cancelAnimationFrame(initialAlignmentFrame)
              initialAlignmentFrame = window.requestAnimationFrame(() =>
                scrollToPanel(activeId, 'auto'),
              )
              initialAlignmentTimer = window.setTimeout(() => {
                scrollToPanel(activeId, 'auto')
                document.documentElement.style.scrollBehavior =
                  initialDocumentScrollBehavior
                if (finishInitialAlignment) {
                  ScrollTrigger.removeEventListener(
                    'refresh',
                    finishInitialAlignment,
                  )
                }
              }, 1400)
            }
            ScrollTrigger.addEventListener('refresh', finishInitialAlignment)
            window.addEventListener('load', finishInitialAlignment, { once: true })
            window.addEventListener('pageshow', finishInitialAlignment, {
              once: true,
            })
            void document.fonts?.ready.then(() => finishInitialAlignment?.())
            finishInitialAlignment()

            return () => {
              document.removeEventListener(HORIZONTAL_EXPERIENCE_NAVIGATE_EVENT, navigate)
              window.removeEventListener('keydown', keydown)
              window.removeEventListener('hashchange', handleHashChange)
              window.cancelAnimationFrame(activeFrame)
              window.cancelAnimationFrame(initialAlignmentFrame)
              window.clearTimeout(initialAlignmentTimer)
              document.documentElement.style.scrollBehavior =
                initialDocumentScrollBehavior
              if (finishInitialAlignment) {
                ScrollTrigger.removeEventListener('refresh', finishInitialAlignment)
                window.removeEventListener('load', finishInitialAlignment)
                window.removeEventListener('pageshow', finishInitialAlignment)
              }
              trigger.kill()
              timeline.kill()
              gsap.set(track, { clearProps: 'transform' })
              experience.style.removeProperty('--horizontal-scroll-distance')
              panels.forEach((panel) => {
                const section = panel.firstElementChild as HTMLElement | null
                if (section) gsap.set(section, { clearProps: 'transform' })
              })
              delete experience.dataset.horizontalMode
            }
          }

          if (mobile) {
            experience.dataset.horizontalMode = 'mobile'
            viewport.scrollLeft = 0
            let frame = 0
            let touchStartY = 0
            let touchStartX = 0
            let previousIndex = Math.max(0, panelIds.indexOf(activeId))

            const updateActive = () => {
              frame = 0
              const index = panels.reduce(
                (closestIndex, panel, panelIndex) =>
                  Math.abs(panel.offsetLeft - experience.scrollLeft) <
                  Math.abs(panels[closestIndex].offsetLeft - experience.scrollLeft)
                    ? panelIndex
                    : closestIndex,
                0,
              )
              if (index === previousIndex) return
              const direction: HorizontalDirection =
                index > previousIndex ? 'forward' : 'backward'
              previousIndex = index
              setPanelState(panelIds[index], direction)
            }

            const onScroll = () => {
              if (frame) return
              frame = window.requestAnimationFrame(updateActive)
            }

            const navigate = (event: Event) => {
              const detail = (event as CustomEvent<HorizontalNavigateDetail>).detail
              if (!detail || !panelIds.includes(detail.sectionId)) return
              const index = panelIds.indexOf(detail.sectionId)
              const direction: HorizontalDirection =
                index > previousIndex ? 'forward' : 'backward'
              previousIndex = index
              setPanelState(detail.sectionId, direction)
              experience.scrollTo({
                behavior: detail.behavior ?? 'smooth',
                left: panels[index].offsetLeft,
              })
            }

            const handleHashChange = () => {
              const sectionId = getHashSection(panelIds)
              navigate(
                new CustomEvent<HorizontalNavigateDetail>(
                  HORIZONTAL_EXPERIENCE_NAVIGATE_EVENT,
                  { detail: { sectionId, behavior: 'smooth' } },
                ),
              )
            }

            const lastPanel = panels.at(-1)
            const lastPanelAtBottom = () =>
              lastPanel !== undefined &&
              lastPanel.scrollTop + lastPanel.clientHeight >=
                lastPanel.scrollHeight - 2

            const bridgeWheelToFooter = (event: WheelEvent) => {
              if (
                previousIndex !== panels.length - 1 ||
                event.deltaY <= 0 ||
                !lastPanelAtBottom()
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

            const bridgeTouchToFooter = (event: TouchEvent) => {
              const touch = event.touches[0]
              if (!touch || previousIndex !== panels.length - 1) return
              const deltaX = touch.clientX - touchStartX
              const deltaY = touch.clientY - touchStartY
              if (deltaY >= 0 || Math.abs(deltaY) <= Math.abs(deltaX) || !lastPanelAtBottom()) {
                return
              }
              event.preventDefault()
              window.scrollBy({ top: -deltaY })
              touchStartY = touch.clientY
            }

            experience.addEventListener('scroll', onScroll, { passive: true })
            experience.addEventListener('wheel', bridgeWheelToFooter, {
              passive: false,
            })
            experience.addEventListener('touchstart', rememberTouch, {
              passive: true,
            })
            experience.addEventListener('touchmove', bridgeTouchToFooter, {
              passive: false,
            })
            document.addEventListener(HORIZONTAL_EXPERIENCE_NAVIGATE_EVENT, navigate)
            window.addEventListener('hashchange', handleHashChange)
            initializePanelState()
            const initialIndex = panelIds.indexOf(activeId)
            experience.scrollLeft = panels[Math.max(0, initialIndex)].offsetLeft

            return () => {
              window.cancelAnimationFrame(frame)
              experience.removeEventListener('scroll', onScroll)
              experience.removeEventListener('wheel', bridgeWheelToFooter)
              experience.removeEventListener('touchstart', rememberTouch)
              experience.removeEventListener('touchmove', bridgeTouchToFooter)
              document.removeEventListener(HORIZONTAL_EXPERIENCE_NAVIGATE_EVENT, navigate)
              window.removeEventListener('hashchange', handleHashChange)
              delete experience.dataset.horizontalMode
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
