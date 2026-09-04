import type { CSSProperties, MouseEvent } from 'react'
import { truckComponents } from '../../config/truckComponents'
import type {
  TruckExplorerComponent,
  TruckRenderRect,
} from '../../types/truckExplorer'
import { TruckHotspot } from './TruckHotspot'

type LayerStyle = CSSProperties & {
  '--render-height': string
  '--render-left': string
  '--render-top': string
  '--render-width': string
  '--focus-x-desktop': string
  '--focus-y-desktop': string
  '--focus-x-tablet': string
  '--focus-y-tablet': string
  '--focus-x-mobile': string
  '--focus-y-mobile': string
}

type TruckHotspotLayerProps = Readonly<{
  debug: boolean
  hoveredComponentId: string | null
  keyboardFocusedComponentId: string | null
  onDebugCoordinate: (xPercent: number, yPercent: number) => void
  onFocusComponent: (componentId: string | null) => void
  onHoverComponent: (componentId: string | null) => void
  onSelectComponent: (componentId: string) => void
  open: boolean
  renderRect: TruckRenderRect
  selectedComponent: TruckExplorerComponent | null
  selectedComponentId: string | null
}>

export function TruckHotspotLayer({
  debug,
  hoveredComponentId,
  keyboardFocusedComponentId,
  onDebugCoordinate,
  onFocusComponent,
  onHoverComponent,
  onSelectComponent,
  open,
  renderRect,
  selectedComponent,
  selectedComponentId,
}: TruckHotspotLayerProps) {
  const style: LayerStyle = {
    '--render-height': `${renderRect.drawHeight}px`,
    '--render-left': `${renderRect.offsetX}px`,
    '--render-top': `${renderRect.offsetY}px`,
    '--render-width': `${renderRect.drawWidth}px`,
    '--focus-x-desktop': `${selectedComponent?.desktopPosition.xPercent ?? 50}%`,
    '--focus-y-desktop': `${selectedComponent?.desktopPosition.yPercent ?? 50}%`,
    '--focus-x-tablet': `${selectedComponent?.tabletPosition.xPercent ?? 50}%`,
    '--focus-y-tablet': `${selectedComponent?.tabletPosition.yPercent ?? 50}%`,
    '--focus-x-mobile': `${selectedComponent?.mobilePosition.xPercent ?? 50}%`,
    '--focus-y-mobile': `${selectedComponent?.mobilePosition.yPercent ?? 50}%`,
  }

  const handleDebugClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!debug || event.target !== event.currentTarget) return

    const bounds = event.currentTarget.getBoundingClientRect()
    const xPercent = ((event.clientX - bounds.left) / bounds.width) * 100
    const yPercent = ((event.clientY - bounds.top) / bounds.height) * 100
    onDebugCoordinate(xPercent, yPercent)
  }

  return (
    <div
      className="truck-hotspot-layer"
      data-debug={debug || undefined}
      data-has-selection={Boolean(selectedComponentId) || undefined}
      onClick={handleDebugClick}
      style={style}
    >
      <div
        className="truck-explorer-focus"
        data-visible={Boolean(selectedComponent) || undefined}
        aria-hidden="true"
      />
      {truckComponents.map((component) => (
        <TruckHotspot
          component={component}
          debug={debug}
          isHovered={hoveredComponentId === component.id}
          isKeyboardFocused={keyboardFocusedComponentId === component.id}
          isSelected={selectedComponentId === component.id}
          key={component.id}
          onBlur={() => onFocusComponent(null)}
          onFocus={() => onFocusComponent(component.id)}
          onHover={(hovered) =>
            onHoverComponent(hovered ? component.id : null)
          }
          onSelect={() => onSelectComponent(component.id)}
          tabIndex={open ? 0 : -1}
        />
      ))}
    </div>
  )
}
