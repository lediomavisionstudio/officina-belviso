import { useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { flushSync } from 'react-dom'
import { truckExperienceMotion } from '../../config/truckExperienceMotion'
import type { TruckExplorerComponent } from '../../types/truckExplorer'

type TruckExplorerPanelProps = Readonly<{
  onClearSelection: () => void
  onRequestAssistance: () => void
  open: boolean
  selectedComponent: TruckExplorerComponent | null
}>

export function TruckExplorerPanel({
  onClearSelection,
  onRequestAssistance,
  open,
  selectedComponent,
}: TruckExplorerPanelProps) {
  const rootRef = useRef<HTMLElement>(null)
  const [displayedComponent, setDisplayedComponent] =
    useState<TruckExplorerComponent | null>(selectedComponent)

  useGSAP(
    () => {
      const root = rootRef.current
      const panelBody = root?.querySelector<HTMLElement>(
        '[data-explorer-panel-content]',
      )
      const panelActions = root?.querySelector<HTMLElement>(
        '.truck-explorer-panel__actions',
      )
      const nextComponentId = selectedComponent?.id ?? null
      const displayedComponentId = displayedComponent?.id ?? null

      if (
        !panelBody ||
        !panelActions ||
        nextComponentId === displayedComponentId
      ) {
        return
      }

      const reducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches

      if (reducedMotion) {
        setDisplayedComponent(selectedComponent)
        gsap.set([panelBody, panelActions], {
          autoAlpha: 1,
          clearProps: 'transform',
        })
        return
      }

      const panelTimeline = gsap.timeline()
      const panelStart = nextComponentId
        ? truckExperienceMotion.selection.panelStart
        : 0
      panelTimeline
        .to(
          panelBody,
          {
            autoAlpha: 0,
            y: -3,
            duration: truckExperienceMotion.selection.panelSwapDuration,
            ease: 'power2.in',
          },
          panelStart,
        )
        .to(
          panelActions,
          {
            autoAlpha: 0,
            y: -2,
            duration: 0.12,
            ease: 'power2.in',
          },
          panelStart,
        )
        .call(() => {
          flushSync(() => {
            setDisplayedComponent(selectedComponent)
          })
        }, [], panelStart + truckExperienceMotion.selection.panelSwapDuration)
        .fromTo(
          panelBody,
          {
            autoAlpha: 0,
            y: 4,
          },
          {
            autoAlpha: 1,
            y: 0,
            duration: truckExperienceMotion.selection.panelRevealDuration,
            ease: 'power2.out',
            clearProps: 'opacity,visibility,transform',
          },
          panelStart + truckExperienceMotion.selection.panelSwapDuration,
        )
        .fromTo(
          panelActions,
          {
            autoAlpha: 0,
            y: 5,
          },
          {
            autoAlpha: nextComponentId ? 1 : 0,
            y: 0,
            duration: truckExperienceMotion.selection.ctaRevealDuration,
            ease: truckExperienceMotion.easing.entrance,
            clearProps: nextComponentId ? 'opacity,visibility,transform' : '',
          },
          nextComponentId
            ? truckExperienceMotion.selection.ctaStart
            : panelStart + truckExperienceMotion.selection.panelSwapDuration,
        )

      return () => panelTimeline.kill()
    },
    {
      scope: rootRef,
      dependencies: [selectedComponent?.id],
      revertOnUpdate: true,
    },
  )

  return (
    <aside
      className="truck-explorer-panel"
      aria-label="Dettagli componente"
      data-component-id={displayedComponent?.id ?? 'overview'}
      data-has-selection={Boolean(displayedComponent) || undefined}
      ref={rootRef}
    >
      <span className="truck-explorer-panel__handle" aria-hidden="true" />
      <div
        className="truck-explorer-panel__body"
        data-explorer-panel-content
        aria-atomic="true"
        aria-live="polite"
      >
        <div className="truck-explorer-panel__meta">
          <p className="truck-explorer-panel__eyebrow">
            {displayedComponent ? 'Area tecnica' : 'Truck Explorer'}
          </p>
          <span>
            {displayedComponent
              ? `Area ${String(displayedComponent.order).padStart(2, '0')} / 07`
              : 'Panoramica'}
          </span>
        </div>

        {displayedComponent ? (
          <>
            <h2>{displayedComponent.title}</h2>
            <p className="truck-explorer-panel__subtitle">
              {displayedComponent.subtitle}
            </p>
            <p>{displayedComponent.description}</p>
            <ul>
              {displayedComponent.serviceDetails.map((service) => (
                <li key={service}>{service}</li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <h2>Esplora i sistemi del camion</h2>
            <p>
              Seleziona un punto tecnico sul veicolo oppure scegli un servizio
              dalla navigazione.
            </p>
          </>
        )}
        <div
          className="truck-explorer-panel__actions"
          data-visible={Boolean(displayedComponent) || undefined}
        >
          {displayedComponent ? (
            <>
              <a
                className="truck-explorer-panel__assistance"
                href="#richiedi-preventivo"
                onClick={onRequestAssistance}
                tabIndex={open ? 0 : -1}
              >
                Richiedi assistenza
              </a>
              <button
                type="button"
                onClick={onClearSelection}
                tabIndex={open ? 0 : -1}
              >
                Vista completa
              </button>
            </>
          ) : null}
        </div>
      </div>
    </aside>
  )
}
