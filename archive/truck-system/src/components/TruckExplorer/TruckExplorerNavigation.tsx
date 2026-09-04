import { useEffect, useRef } from 'react'
import { truckComponents } from '../../config/truckComponents'

type TruckExplorerNavigationProps = Readonly<{
  onSelect: (componentId: string) => void
  open: boolean
  selectedComponentId: string | null
}>

export function TruckExplorerNavigation({
  onSelect,
  open,
  selectedComponentId,
}: TruckExplorerNavigationProps) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!selectedComponentId) return

    rootRef.current
      ?.querySelector<HTMLElement>(
        `[data-explorer-navigation-id="${selectedComponentId}"]`,
      )
      ?.scrollIntoView({
        behavior: 'auto',
        block: 'nearest',
        inline: 'center',
      })
  }, [selectedComponentId])

  return (
    <div
      className="truck-explorer-navigation"
      aria-label="Componenti del camion"
      role="group"
      ref={rootRef}
    >
      {truckComponents.map((component) => {
        const selected = selectedComponentId === component.id

        return (
          <button
            className="truck-explorer-navigation__item"
            data-explorer-navigation-id={component.id}
            data-selected={selected || undefined}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(component.id)}
            tabIndex={open ? 0 : -1}
            key={component.id}
          >
            <span>{String(component.order).padStart(2, '0')}</span>
            {component.shortLabel}
          </button>
        )
      })}
    </div>
  )
}
