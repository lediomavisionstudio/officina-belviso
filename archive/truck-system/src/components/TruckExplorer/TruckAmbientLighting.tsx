import { useRef, type CSSProperties } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { truckExperienceMotion } from '../../config/truckExperienceMotion'
import {
  getTruckLighting,
  TRUCK_LIGHTING_NEUTRAL,
  type TruckLightingPreset,
} from '../../config/truckLighting'

gsap.registerPlugin(useGSAP)

type TruckAmbientLightingProps = Readonly<{
  explorerOpen: boolean
  selectedComponentId: string | null
}>

type LightingStyle = CSSProperties & {
  '--truck-light-primary': string
  '--truck-light-secondary': string
  '--truck-light-x': string
  '--truck-light-y': string
  '--truck-light-size': string
  '--truck-light-opacity': number
  '--truck-light-vignette': number
  '--truck-light-depth': number
}

function toLightingStyle(preset: TruckLightingPreset): LightingStyle {
  return {
    '--truck-light-primary': preset.primaryColor,
    '--truck-light-secondary': preset.secondaryColor,
    '--truck-light-x': `${preset.glowPosition.x}%`,
    '--truck-light-y': `${preset.glowPosition.y}%`,
    '--truck-light-size': `${preset.glowSize}%`,
    '--truck-light-opacity': preset.glowOpacity,
    '--truck-light-vignette': preset.vignetteStrength,
    '--truck-light-depth': preset.backgroundDepth,
  }
}

export function TruckAmbientLighting({
  explorerOpen,
  selectedComponentId,
}: TruckAmbientLightingProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const targetPreset = explorerOpen
    ? getTruckLighting(selectedComponentId)
    : TRUCK_LIGHTING_NEUTRAL

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root) return

      const reducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches
      const duration = reducedMotion ? 0 : targetPreset.transitionDuration
      const timeline = gsap.timeline()

      timeline.to(
        root,
        {
          ...toLightingStyle(targetPreset),
          autoAlpha: explorerOpen ? 1 : 0.48,
          duration,
          ease: truckExperienceMotion.easing.focus,
          overwrite: 'auto',
        },
        explorerOpen
          ? truckExperienceMotion.selection.lightingStart
          : 0,
      )

      return () => timeline.kill()
    },
    {
      scope: rootRef,
      dependencies: [explorerOpen, selectedComponentId],
      revertOnUpdate: false,
    },
  )

  return (
    <div
      className="truck-ambient-lighting"
      data-lighting-component={selectedComponentId ?? 'overview'}
      aria-hidden="true"
      ref={rootRef}
      style={toLightingStyle(TRUCK_LIGHTING_NEUTRAL)}
    >
      <span className="truck-ambient-lighting__key" />
      <span className="truck-ambient-lighting__depth" />
    </div>
  )
}
