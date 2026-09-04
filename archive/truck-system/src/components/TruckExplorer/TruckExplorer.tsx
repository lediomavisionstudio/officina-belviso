import { useEffect, useRef, type RefObject } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { truckExperienceMotion } from '../../config/truckExperienceMotion'
import {
  getTruckCameraFocus,
  TRUCK_CAMERA_RESET,
  type TruckCameraViewport,
} from '../../config/truckCameraFocus'
import { TRUCK_EXPLORER_DEBUG } from '../../config/truckComponents'
import { useTruckRenderRect } from '../../hooks/useTruckRenderRect'
import type {
  TruckExplorerComponent,
  TruckExplorerState,
} from '../../types/truckExplorer'
import { TruckExplorerCloseButton } from './TruckExplorerCloseButton'
import { TruckExplorerNavigation } from './TruckExplorerNavigation'
import { TruckExplorerPanel } from './TruckExplorerPanel'
import { TruckHotspotLayer } from './TruckHotspotLayer'
import './truck-explorer.css'

gsap.registerPlugin(useGSAP)

type TruckExplorerProps = Readonly<{
  canvasRef: RefObject<HTMLCanvasElement | null>
  onClearSelection: () => void
  onClose: () => void
  onFocusComponent: (componentId: string | null) => void
  onHoverComponent: (componentId: string | null) => void
  onSelectComponent: (componentId: string) => void
  selectedComponent: TruckExplorerComponent | null
  setIsTransitioning: (transitioning: boolean) => void
  state: TruckExplorerState
}>

function canScrollPanel(target: EventTarget | null, deltaY: number) {
  if (!(target instanceof Element)) return false

  const panelBody = target.closest<HTMLElement>('.truck-explorer-panel__body')
  if (!panelBody) return false

  if (deltaY < 0) return panelBody.scrollTop > 0
  if (deltaY > 0) {
    return panelBody.scrollTop + panelBody.clientHeight < panelBody.scrollHeight
  }
  return true
}

export function TruckExplorer({
  canvasRef,
  onClearSelection,
  onClose,
  onFocusComponent,
  onHoverComponent,
  onSelectComponent,
  selectedComponent,
  setIsTransitioning,
  state,
}: TruckExplorerProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const cameraTimelineRef = useRef<gsap.core.Timeline | null>(null)
  const applyCameraRef = useRef<(() => void) | null>(null)
  const cameraHasFocusRef = useRef(false)
  const renderRect = useTruckRenderRect(canvasRef)
  const {
    explorerOpen,
    hoveredComponentId,
    isTransitioning,
    keyboardFocusedComponentId,
    panelOpen,
    selectedComponentId,
  } = state
  const panelSide = selectedComponent?.panelSide ?? 'left'
  const cameraStateRef = useRef({
    explorerOpen,
    selectedComponentId,
  })

  useGSAP(
    () => {
      const root = rootRef.current
      const stage = root?.closest<HTMLElement>('[data-truck-sequence]')
      const hero = root?.closest<HTMLElement>('.hero')
      const heroCopy = hero?.querySelector<HTMLElement>('.hero-copy')
      const cta = stage?.querySelector<HTMLElement>('.hero-explore-cta')
      const navigation = root?.querySelector<HTMLElement>(
        '.truck-explorer-navigation',
      )
      const panel = root?.querySelector<HTMLElement>('.truck-explorer-panel')
      const close = root?.querySelector<HTMLElement>('.truck-explorer-close')

      if (!root || !heroCopy || !cta || !navigation || !panel || !close) return

      const reducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches
      const duration = reducedMotion
        ? 0
        : truckExperienceMotion.explorer.enterDuration
      const timeline = gsap.timeline({
        onStart: () => setIsTransitioning(true),
        onComplete: () => {
          setIsTransitioning(false)
          if (explorerOpen) {
            closeButtonRef.current?.focus({ preventScroll: true })
          } else {
            cta.focus({ preventScroll: true })
          }
        },
      })

      if (explorerOpen) {
        timeline
          .to(
            cta,
            {
              autoAlpha: 0,
              y: 8,
              duration: reducedMotion ? 0 : 0.28,
              ease: 'power2.out',
            },
            0,
          )
          .to(
            heroCopy,
            {
              autoAlpha: 0.1,
              y: reducedMotion ? 0 : -10,
              duration,
              ease: 'power3.inOut',
            },
            0,
          )
          .fromTo(
            root,
            { autoAlpha: 0 },
            {
              autoAlpha: 1,
              duration,
              ease: 'power3.out',
            },
            reducedMotion ? 0 : 0.12,
          )
          .fromTo(
            [navigation, close],
            {
              autoAlpha: 0,
              y: -6,
            },
            {
              autoAlpha: 1,
              y: 0,
              duration: reducedMotion ? 0 : 0.38,
              ease: truckExperienceMotion.easing.entrance,
              clearProps: 'opacity,visibility,transform',
            },
            reducedMotion
              ? 0
              : truckExperienceMotion.explorer.navigationDelay,
          )
          .fromTo(
            panel,
            {
              autoAlpha: 0,
              y: 10,
            },
            {
              autoAlpha: 1,
              y: 0,
              duration: reducedMotion ? 0 : 0.44,
              ease: truckExperienceMotion.easing.entrance,
              clearProps: 'opacity,visibility,transform',
            },
            reducedMotion ? 0 : truckExperienceMotion.explorer.panelDelay,
          )
        return () => timeline.kill()
      }

      timeline
        .to([panel, navigation, close], {
          autoAlpha: 0,
          y: 5,
          duration: reducedMotion ? 0 : 0.24,
          ease: truckExperienceMotion.easing.exit,
        })
        .to(root, {
          autoAlpha: 0,
          duration: reducedMotion
            ? 0
            : truckExperienceMotion.explorer.exitDuration,
          ease: truckExperienceMotion.easing.exit,
        })
        .to(
          heroCopy,
          {
            autoAlpha: 1,
            y: 0,
            duration: reducedMotion ? 0 : 0.62,
            ease: truckExperienceMotion.easing.entrance,
            clearProps: 'opacity,visibility,transform',
          },
          reducedMotion ? 0 : 0.12,
        )
        .to(
          cta,
          {
            autoAlpha: 1,
            y: 0,
            duration: reducedMotion ? 0 : 0.48,
            ease: truckExperienceMotion.easing.entrance,
            clearProps: 'opacity,visibility,transform',
          },
          reducedMotion ? 0 : 0.26,
        )

      return () => timeline.kill()
    },
    {
      scope: rootRef,
      dependencies: [explorerOpen, setIsTransitioning],
      revertOnUpdate: true,
    },
  )

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root || !explorerOpen) return

      const hotspots = gsap.utils.toArray<HTMLElement>(
        '.truck-hotspot',
        root,
      )
      const reducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches

      if (reducedMotion) {
        gsap.set(hotspots, {
          autoAlpha: 1,
          scale: 1,
        })
        return
      }

      const revealTimeline = gsap.timeline()
      revealTimeline.fromTo(
        hotspots,
        {
          autoAlpha: 0,
          scale: 0.84,
        },
        {
          autoAlpha: 1,
          scale: 1,
          duration: 0.34,
          stagger: 0.12,
          ease: 'power2.out',
          clearProps: 'opacity,visibility,transform',
        },
      )

      return () => revealTimeline.kill()
    },
    {
      scope: rootRef,
      dependencies: [explorerOpen],
      revertOnUpdate: true,
    },
  )

  useGSAP(
    () => {
      const root = rootRef.current
      const reducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches
      const idleAllowed =
        explorerOpen &&
        !selectedComponentId &&
        !hoveredComponentId &&
        !keyboardFocusedComponentId &&
        !reducedMotion

      if (!root || !idleAllowed) return

      const hotspots = gsap.utils.toArray<HTMLElement>(
        '.truck-hotspot',
        root,
      )
      const idleTimeline = gsap.timeline({ repeat: -1 })

      idleTimeline.to({}, { duration: 1.15 })

      hotspots.forEach((hotspot) => {
        const ring = hotspot.querySelector<HTMLElement>('.truck-hotspot__ring')
        if (!ring) return

        idleTimeline
          .call(() => {
            hotspots.forEach((item) => {
              delete item.dataset.idleActive
            })
            hotspot.dataset.idleActive = 'true'
          })
          .fromTo(
            ring,
            {
              opacity: 0.78,
              scale: 1,
            },
            {
              opacity: 1,
              scale: 1.11,
              duration: 1.45,
              ease: 'sine.inOut',
              repeat: 1,
              yoyo: true,
            },
          )
          .call(() => {
            delete hotspot.dataset.idleActive
          })
          .to({}, { duration: 1.1 })
      })

      return () => {
        idleTimeline.kill()
        hotspots.forEach((hotspot) => {
          delete hotspot.dataset.idleActive
          const ring =
            hotspot.querySelector<HTMLElement>('.truck-hotspot__ring')
          if (ring) {
            gsap.set(ring, {
              clearProps: 'opacity,transform',
            })
          }
        })
      }
    },
    {
      scope: rootRef,
      dependencies: [
        explorerOpen,
        hoveredComponentId,
        keyboardFocusedComponentId,
        selectedComponentId,
      ],
      revertOnUpdate: true,
    },
  )

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root || !explorerOpen || !selectedComponentId) return

      const hotspot = root.querySelector<HTMLElement>(
        `.truck-hotspot[data-component-id="${selectedComponentId}"]`,
      )
      const ring = hotspot?.querySelector<HTMLElement>('.truck-hotspot__ring')
      const point = hotspot?.querySelector<HTMLElement>('.truck-hotspot__point')
      const reducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches

      if (!hotspot || !ring || !point || reducedMotion) return

      const selectionTimeline = gsap.timeline()
      const hotspotStart = truckExperienceMotion.selection.hotspotStart
      selectionTimeline
        .fromTo(
          hotspot,
          { autoAlpha: 0.68 },
          {
            autoAlpha: 1,
            duration: 0.28,
            ease: 'power2.out',
            clearProps: 'opacity,visibility',
          },
          hotspotStart,
        )
        .fromTo(
          ring,
          {
            opacity: 0.62,
            scale: 0.86,
          },
          {
            opacity: 1,
            scale: 1.12,
            duration: 0.17,
            ease: 'power2.out',
          },
          hotspotStart,
        )
        .to(
          ring,
          {
            scale: 1,
            duration: 0.18,
            ease: 'power2.inOut',
            clearProps: 'opacity,transform',
          },
          hotspotStart + 0.17,
        )
        .fromTo(
          point,
          { scale: 0.82 },
          {
            scale: 1.14,
            duration: 0.17,
            ease: 'power2.out',
          },
          hotspotStart,
        )
        .to(
          point,
          {
            scale: 1,
            duration: 0.18,
            ease: 'power2.inOut',
            clearProps: 'transform',
          },
          hotspotStart + 0.17,
        )

      return () => selectionTimeline.kill()
    },
    {
      scope: rootRef,
      dependencies: [explorerOpen, selectedComponentId],
      revertOnUpdate: true,
    },
  )

  useGSAP(
    () => {
      const root = rootRef.current
      const stage = root?.closest<HTMLElement>('[data-truck-sequence]')
      const media = stage?.querySelector<HTMLElement>('.truck-sequence-media')
      const hotspotLayer =
        root?.querySelector<HTMLElement>('.truck-hotspot-layer')

      if (!root || !media || !hotspotLayer) return

      const cameraTargets = [media, hotspotLayer]
      const cameraMedia = gsap.matchMedia()

      cameraMedia.add(
        {
          desktop: '(min-width: 1101px)',
          tablet: '(min-width: 641px) and (max-width: 1100px)',
          mobile: '(max-width: 640px)',
          reducedMotion: '(prefers-reduced-motion: reduce)',
        },
        ({ conditions }) => {
          const viewport: TruckCameraViewport = conditions?.desktop
            ? 'desktop'
            : conditions?.tablet
              ? 'tablet'
              : 'mobile'
          const reducedMotion = Boolean(conditions?.reducedMotion)

          const applyCamera = () => {
            const cameraState = cameraStateRef.current
            const activeComponentId = cameraState.explorerOpen
              ? cameraState.selectedComponentId
              : null
            const preset = reducedMotion
              ? TRUCK_CAMERA_RESET
              : getTruckCameraFocus(activeComponentId, viewport)
            const returningToOverview = !activeComponentId
            const nextHasCameraFocus =
              Boolean(activeComponentId) && !reducedMotion
            const shouldAnimate =
              nextHasCameraFocus || cameraHasFocusRef.current

            cameraTimelineRef.current?.kill()
            root.dataset.cameraComponent =
              activeComponentId ?? 'overview'
            root.dataset.cameraViewport = viewport

            if (!shouldAnimate) {
              delete root.dataset.cameraTransitioning
              gsap.set(cameraTargets, {
                clearProps: 'transform,transformOrigin,willChange',
              })
              return
            }

            cameraHasFocusRef.current = nextHasCameraFocus
            root.dataset.cameraTransitioning = 'true'

            const cameraTimeline = gsap.timeline({
              onComplete: () => {
                delete root.dataset.cameraTransitioning

                if (returningToOverview) {
                  gsap.set(cameraTargets, {
                    clearProps: 'transform,transformOrigin,willChange',
                  })
                } else {
                  gsap.set(cameraTargets, {
                    clearProps: 'willChange',
                  })
                }
              },
              onInterrupt: () => {
                delete root.dataset.cameraTransitioning
              },
            })

            cameraTimeline.to(
              cameraTargets,
              {
                xPercent: preset.offsetX,
                yPercent: preset.offsetY,
                scale: preset.zoom,
                duration: reducedMotion ? 0 : preset.duration,
                ease: preset.easing,
                overwrite: 'auto',
                transformOrigin: '50% 50%',
                willChange: 'transform',
              },
              returningToOverview
                ? 0
                : truckExperienceMotion.selection.cameraStart,
            )

            cameraTimelineRef.current = cameraTimeline
          }

          applyCameraRef.current = applyCamera
          applyCamera()

          return () => {
            if (applyCameraRef.current === applyCamera) {
              applyCameraRef.current = null
            }
            cameraTimelineRef.current?.kill()
            cameraTimelineRef.current = null
            delete root.dataset.cameraTransitioning
          }
        },
      )

      return () => {
        applyCameraRef.current = null
        cameraTimelineRef.current?.kill()
        cameraTimelineRef.current = null
        cameraHasFocusRef.current = false
        cameraMedia.revert()
        delete root.dataset.cameraComponent
        delete root.dataset.cameraViewport
        delete root.dataset.cameraTransitioning
        gsap.set(cameraTargets, {
          clearProps: 'transform,transformOrigin,willChange',
        })
      }
    },
    {
      scope: rootRef,
    },
  )

  useEffect(() => {
    cameraStateRef.current = {
      explorerOpen,
      selectedComponentId,
    }
    applyCameraRef.current?.()
  }, [explorerOpen, selectedComponentId])

  useGSAP(
    () => {
      const root = rootRef.current
      const focus = root?.querySelector<HTMLElement>('.truck-explorer-focus')

      if (!root || !focus) return

      const reducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches
      const focusTimeline = gsap.timeline()

      focusTimeline.to(
        focus,
        {
          opacity: selectedComponent ? 1 : 0,
          duration: reducedMotion ? 0 : 0.45,
          ease: truckExperienceMotion.easing.focus,
        },
        selectedComponent
          ? truckExperienceMotion.selection.lightingStart
          : 0,
      )

      return () => focusTimeline.kill()
    },
    {
      scope: rootRef,
      dependencies: [selectedComponentId],
      revertOnUpdate: true,
    },
  )

  useEffect(() => {
    const root = rootRef.current
    if (!explorerOpen || !root) return

    const lockedScrollY = window.scrollY
    const desktopQuery = window.matchMedia('(min-width: 981px)')
    let restoringScroll = false

    const restoreDesktopScroll = () => {
      if (!desktopQuery.matches || restoringScroll) return
      if (Math.abs(window.scrollY - lockedScrollY) < 1) return

      restoringScroll = true
      window.scrollTo({ top: lockedScrollY, behavior: 'auto' })
      window.requestAnimationFrame(() => {
        restoringScroll = false
      })
    }

    const containWheel = (event: WheelEvent) => {
      if (canScrollPanel(event.target, event.deltaY)) return
      event.preventDefault()
    }

    const containTouch = (event: TouchEvent) => {
      if (
        event.target instanceof Element &&
        event.target.closest('.truck-explorer-panel__body')
      ) {
        return
      }
      event.preventDefault()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        if (selectedComponentId) onClearSelection()
        else onClose()
        return
      }

      if (
        desktopQuery.matches &&
        ['PageDown', 'PageUp', 'Home', 'End'].includes(event.key)
      ) {
        event.preventDefault()
      }
    }

    root.addEventListener('wheel', containWheel, { passive: false })
    root.addEventListener('touchmove', containTouch, { passive: false })
    window.addEventListener('scroll', restoreDesktopScroll, { passive: true })
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      root.removeEventListener('wheel', containWheel)
      root.removeEventListener('touchmove', containTouch)
      window.removeEventListener('scroll', restoreDesktopScroll)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [explorerOpen, onClearSelection, onClose, selectedComponentId])

  const handleDebugCoordinate = (xPercent: number, yPercent: number) => {
    if (!TRUCK_EXPLORER_DEBUG) return
    console.info(
      `[Truck Explorer] xPercent: ${xPercent.toFixed(2)}, yPercent: ${yPercent.toFixed(2)}`,
    )
  }

  return (
    <div
      className="truck-explorer"
      data-explorer-open={explorerOpen}
      data-is-transitioning={isTransitioning || undefined}
      data-panel-open={panelOpen || undefined}
      data-panel-side={panelSide}
      aria-hidden={!explorerOpen}
      ref={rootRef}
    >
      <img
        className="truck-explorer__reduced-frame"
        src="/assets/truck-sequence/0121.webp"
        alt=""
        aria-hidden="true"
        width="1280"
        height="720"
      />
      <TruckHotspotLayer
        debug={TRUCK_EXPLORER_DEBUG}
        hoveredComponentId={hoveredComponentId}
        keyboardFocusedComponentId={keyboardFocusedComponentId}
        onDebugCoordinate={handleDebugCoordinate}
        onFocusComponent={onFocusComponent}
        onHoverComponent={onHoverComponent}
        onSelectComponent={onSelectComponent}
        open={explorerOpen}
        renderRect={renderRect}
        selectedComponent={selectedComponent}
        selectedComponentId={selectedComponentId}
      />
      <TruckExplorerNavigation
        onSelect={onSelectComponent}
        open={explorerOpen}
        selectedComponentId={selectedComponentId}
      />
      <TruckExplorerPanel
        onClearSelection={onClearSelection}
        onRequestAssistance={onClose}
        open={explorerOpen}
        selectedComponent={selectedComponent}
      />
      <TruckExplorerCloseButton
        onClose={onClose}
        open={explorerOpen}
        ref={closeButtonRef}
      />

      {TRUCK_EXPLORER_DEBUG ? (
        <output className="truck-explorer-debug-status">
          {selectedComponent
            ? `${selectedComponent.id} — ${selectedComponent.label}`
            : 'Nessun componente selezionato'}
        </output>
      ) : null}
    </div>
  )
}
