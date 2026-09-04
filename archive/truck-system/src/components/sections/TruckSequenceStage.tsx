import { useEffect, useRef, useState } from 'react'
import { TruckTechnicalCallout } from '../TruckCallout/TruckTechnicalCallout'
import { TruckAmbientLighting } from '../TruckExplorer/TruckAmbientLighting'
import { TruckExplorer } from '../TruckExplorer/TruckExplorer'
import { truckSequenceConfig } from '../../config/truck-sequence.config'
import { useTruckExplorer } from '../../hooks/useTruckExplorer'
import { TruckAnimationEngine } from '../../lib/truck-sequence/TruckAnimationEngine'

const FINAL_FRAME_DELAY_MS = 275
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

export function TruckSequenceStage() {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ctaRef = useRef<HTMLButtonElement>(null)
  const [finalFrameVisible, setFinalFrameVisible] = useState(false)
  const explorer = useTruckExplorer()
  const {
    explorerOpen,
    hoveredComponentId,
    isTransitioning,
    keyboardFocusedComponentId,
    selectedComponentId,
  } = explorer.state
  const experienceIdle =
    explorerOpen &&
    !isTransitioning &&
    !selectedComponentId &&
    !hoveredComponentId &&
    !keyboardFocusedComponentId

  useEffect(() => {
    if (
      new URLSearchParams(window.location.search).get('truck-engine-verify') ===
      'isolated'
    ) {
      return
    }

    const root = rootRef.current
    const canvas = canvasRef.current
    const trigger = root?.closest<HTMLElement>('.hero-truck-stage')

    if (!root || !canvas || !trigger) return

    const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY)
    let engine: TruckAnimationEngine | null = null
    let introObserver: MutationObserver | null = null
    let monitorFrame: number | null = null
    let finalFrameTimer: number | null = null
    let engineReady = false
    let destroyed = false

    const clearFinalFrameTimer = () => {
      if (finalFrameTimer === null) return
      window.clearTimeout(finalFrameTimer)
      finalFrameTimer = null
    }

    const setFinalFrameState = (visible: boolean) => {
      root.dataset.finalFrame = visible ? 'visible' : 'hidden'
      root
        .closest<HTMLElement>('[data-hero-truck]')
        ?.classList.toggle('hero-truck--interactive', visible)
      setFinalFrameVisible((current) => (current === visible ? current : visible))
    }

    const stopMonitoring = () => {
      if (monitorFrame === null) return
      window.cancelAnimationFrame(monitorFrame)
      monitorFrame = null
    }

    const monitorFinalFrame = () => {
      if (destroyed || !engineReady || !engine) return

      const lastFrameIndex = truckSequenceConfig.frameCount - 1
      const currentFrameIndex = engine.getCurrentFrameIndex()
      root.dataset.currentFrame = String(currentFrameIndex ?? '')
      const isAtLastFrame = currentFrameIndex === lastFrameIndex

      if (isAtLastFrame) {
        if (
          root.dataset.finalFrame !== 'visible' &&
          finalFrameTimer === null
        ) {
          finalFrameTimer = window.setTimeout(() => {
            finalFrameTimer = null

            if (
              !destroyed &&
              engine?.getCurrentFrameIndex() === lastFrameIndex
            ) {
              setFinalFrameState(true)
            }
          }, FINAL_FRAME_DELAY_MS)
        }
      } else {
        clearFinalFrameTimer()
        setFinalFrameState(false)
      }

      monitorFrame = window.requestAnimationFrame(monitorFinalFrame)
    }

    const applyMotionPreference = () => {
      clearFinalFrameTimer()
      stopMonitoring()

      if (reducedMotion.matches) {
        setFinalFrameState(true)
        return
      }

      setFinalFrameState(false)

      if (engineReady) {
        monitorFrame = window.requestAnimationFrame(monitorFinalFrame)
      }
    }

    const startEngine = () => {
      if (engine || destroyed) return

      engine = new TruckAnimationEngine({
        canvas,
        trigger,
      })

      void engine
        .init()
        .then((result) => {
          if (destroyed) return
          engineReady = true
          root.dataset.sequenceState =
            result.mode === 'sequence' ? 'ready' : 'fallback'
          applyMotionPreference()
        })
        .catch((error: unknown) => {
          if (
            destroyed ||
            (error instanceof DOMException && error.name === 'AbortError')
          ) {
            return
          }

          root.dataset.sequenceState = 'fallback'
          setFinalFrameState(reducedMotion.matches)
        })
    }

    applyMotionPreference()

    const introRoot = document.querySelector<HTMLElement>('[data-intro-root]')

    if (introRoot?.dataset.introState === 'running') {
      introObserver = new MutationObserver(() => {
        if (introRoot.dataset.introState !== 'complete') return
        introObserver?.disconnect()
        introObserver = null
        startEngine()
      })
      introObserver.observe(introRoot, {
        attributes: true,
        attributeFilter: ['data-intro-state'],
      })
    } else {
      startEngine()
    }

    reducedMotion.addEventListener('change', applyMotionPreference)

    return () => {
      destroyed = true
      introObserver?.disconnect()
      reducedMotion.removeEventListener('change', applyMotionPreference)
      clearFinalFrameTimer()
      stopMonitoring()
      root
        .closest<HTMLElement>('[data-hero-truck]')
        ?.classList.remove('hero-truck--interactive')
      engine?.destroy()
      engine = null
    }
  }, [])

  const openExplorer = () => {
    const stage = rootRef.current?.closest<HTMLElement>('.hero-truck-stage')

    if (stage) {
      const stageTop = stage.getBoundingClientRect().top + window.scrollY
      const endMatch = /^\+=([\d.]+)%$/.exec(truckSequenceConfig.scroll.end)
      const pinDistance = endMatch
        ? window.innerHeight * (Number(endMatch[1]) / 100)
        : window.innerHeight * 5
      const stickyEnd = stageTop + pinDistance

      if (window.scrollY >= stickyEnd - 1) {
        const root = document.documentElement
        const previousBehavior = root.style.scrollBehavior
        root.style.scrollBehavior = 'auto'
        window.scrollTo(0, Math.max(stageTop, stickyEnd - 2))
        root.style.scrollBehavior = previousBehavior
      }
    }

    explorer.openExplorer()
  }

  return (
    <div
      className="truck-sequence-stage"
      data-experience-idle={experienceIdle || undefined}
      data-explorer-open={explorerOpen}
      data-final-frame="hidden"
      data-sequence-state="loading"
      data-truck-sequence
      ref={rootRef}
    >
      <div
        className="truck-sequence-media"
        role="img"
        aria-label="Camion industriale Officina Belviso"
      >
        <img
          className="truck-sequence-fallback"
          src="/assets/camion-officina-belviso.png"
          alt=""
          width="1280"
          height="720"
          decoding="async"
          fetchPriority="high"
          aria-hidden="true"
        />
        <canvas
          className="truck-sequence-canvas"
          width="1280"
          height="720"
          aria-hidden="true"
          ref={canvasRef}
        />
        <div className="truck-sequence-sheen" aria-hidden="true" />
      </div>

      <TruckAmbientLighting
        explorerOpen={explorerOpen}
        selectedComponentId={selectedComponentId}
      />

      <button
        className="hero-explore-cta"
        type="button"
        aria-label="Esplora il camion"
        disabled={!finalFrameVisible || explorerOpen}
        onClick={openExplorer}
        ref={ctaRef}
      >
        <span>Esplora il camion</span>
        <span className="hero-explore-cta__mark" aria-hidden="true">
          {'\u2197'}
        </span>
      </button>

      <TruckExplorer
        canvasRef={canvasRef}
        onClearSelection={explorer.clearSelection}
        onClose={explorer.closeExplorer}
        onFocusComponent={explorer.setKeyboardFocusedComponentId}
        onHoverComponent={explorer.setHoveredComponentId}
        onSelectComponent={explorer.selectComponent}
        selectedComponent={explorer.selectedComponent}
        setIsTransitioning={explorer.setIsTransitioning}
        state={explorer.state}
      />
      <TruckTechnicalCallout
        selectedComponent={explorer.selectedComponent}
        stageRef={rootRef}
      />
    </div>
  )
}
