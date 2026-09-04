import { useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import {
  getTruckCallout,
  type TruckCalloutLayout,
  type TruckCalloutViewport,
} from '../../config/truckCallouts'
import { truckExperienceMotion } from '../../config/truckExperienceMotion'
import type { TruckExplorerComponent } from '../../types/truckExplorer'
import './truck-callout.css'

gsap.registerPlugin(useGSAP)

type TruckTechnicalCalloutProps = Readonly<{
  selectedComponent: TruckExplorerComponent | null
  stageRef: RefObject<HTMLDivElement | null>
}>

type CalloutStyle = CSSProperties & {
  '--callout-label-x-desktop': string
  '--callout-label-y-desktop': string
  '--callout-label-x-tablet': string
  '--callout-label-y-tablet': string
  '--callout-label-x-mobile': string
  '--callout-label-y-mobile': string
  '--callout-label-shift-desktop': string
  '--callout-label-shift-tablet': string
  '--callout-label-shift-mobile': string
  '--callout-start-x-desktop': string
  '--callout-start-y-desktop': string
  '--callout-start-x-tablet': string
  '--callout-start-y-tablet': string
  '--callout-start-x-mobile': string
  '--callout-start-y-mobile': string
}

const labelShift = (layout: TruckCalloutLayout) => {
  if (layout.labelAlign === 'start') return '0%'
  if (layout.labelAlign === 'end') return '-100%'
  return '-50%'
}

const pathData = (layout: TruckCalloutLayout) =>
  `M ${layout.start.x} ${layout.start.y} L ${layout.bend.x} ${layout.bend.y} L ${layout.end.x} ${layout.end.y}`

export function TruckTechnicalCallout({
  selectedComponent,
  stageRef,
}: TruckTechnicalCalloutProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [portalHost, setPortalHost] = useState<HTMLElement | null>(null)
  const definition = getTruckCallout(selectedComponent?.id ?? null)

  useLayoutEffect(() => {
    const host = stageRef.current?.querySelector<HTMLElement>(
      '.truck-hotspot-layer',
    )
    setPortalHost(host ?? null)
  }, [selectedComponent?.id, stageRef])

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root || !definition) return

      const anchor = root.querySelector<HTMLElement>(
        '.truck-technical-callout__anchor',
      )
      const lines = gsap.utils.toArray<SVGPathElement>(
        '.truck-technical-callout__line',
        root,
      )
      const label = root.querySelector<HTMLElement>(
        '.truck-technical-callout__label',
      )

      if (!anchor || !label || lines.length === 0) return

      const reducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches

      gsap.set(lines, {
        strokeDasharray: 1,
        strokeDashoffset: reducedMotion ? 0 : 1,
      })

      if (reducedMotion) {
        gsap.set([anchor, label], {
          autoAlpha: 1,
          clearProps: 'transform',
        })
        return
      }

      const timeline = gsap.timeline()
      const calloutStart = truckExperienceMotion.selection.calloutStart
      timeline
        .fromTo(
          anchor,
          { autoAlpha: 0, scale: 0.72 },
          {
            autoAlpha: 1,
            scale: 1,
            duration: 0.14,
            ease: 'power2.out',
          },
          calloutStart,
        )
        .to(
          lines,
          {
            strokeDashoffset: 0,
            duration: 0.28,
            ease: 'power2.inOut',
          },
          calloutStart + 0.08,
        )
        .fromTo(
          label,
          { autoAlpha: 0, y: 4 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.18,
            ease: 'power2.out',
            clearProps: 'transform',
          },
          calloutStart + 0.34,
        )

      return () => timeline.kill()
    },
    {
      scope: rootRef,
      dependencies: [portalHost, selectedComponent?.id],
      revertOnUpdate: true,
    },
  )

  if (!portalHost || !definition || !selectedComponent) return null

  const style: CalloutStyle = {
    '--callout-label-x-desktop': `${definition.desktop.labelPosition.x}%`,
    '--callout-label-y-desktop': `${definition.desktop.labelPosition.y}%`,
    '--callout-label-x-tablet': `${definition.tablet.labelPosition.x}%`,
    '--callout-label-y-tablet': `${definition.tablet.labelPosition.y}%`,
    '--callout-label-x-mobile': `${definition.mobile.labelPosition.x}%`,
    '--callout-label-y-mobile': `${definition.mobile.labelPosition.y}%`,
    '--callout-label-shift-desktop': labelShift(definition.desktop),
    '--callout-label-shift-tablet': labelShift(definition.tablet),
    '--callout-label-shift-mobile': labelShift(definition.mobile),
    '--callout-start-x-desktop': `${definition.desktop.start.x}%`,
    '--callout-start-y-desktop': `${definition.desktop.start.y}%`,
    '--callout-start-x-tablet': `${definition.tablet.start.x}%`,
    '--callout-start-y-tablet': `${definition.tablet.start.y}%`,
    '--callout-start-x-mobile': `${definition.mobile.start.x}%`,
    '--callout-start-y-mobile': `${definition.mobile.start.y}%`,
  }

  return createPortal(
    <div
      className="truck-technical-callout"
      data-callout-component={selectedComponent.id}
      role="status"
      aria-atomic="true"
      aria-live="polite"
      ref={rootRef}
      style={style}
    >
      <span
        className="truck-technical-callout__anchor"
        aria-hidden="true"
      />
      <svg
        className="truck-technical-callout__drawing"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {(
          ['desktop', 'tablet', 'mobile'] as const satisfies readonly TruckCalloutViewport[]
        ).map((viewport) => (
          <path
            className="truck-technical-callout__line"
            data-callout-viewport={viewport}
            d={pathData(definition[viewport])}
            pathLength="1"
            vectorEffect="non-scaling-stroke"
            key={viewport}
          />
        ))}
      </svg>
      <span className="truck-technical-callout__label">
        {definition.label}
      </span>
    </div>,
    portalHost,
  )
}
