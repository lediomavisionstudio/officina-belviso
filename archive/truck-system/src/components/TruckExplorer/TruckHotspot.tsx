import type { CSSProperties } from 'react'
import type { TruckExplorerComponent } from '../../types/truckExplorer'

type HotspotStyle = CSSProperties & {
  '--hotspot-x-desktop': string
  '--hotspot-y-desktop': string
  '--hotspot-x-tablet': string
  '--hotspot-y-tablet': string
  '--hotspot-x-mobile': string
  '--hotspot-y-mobile': string
}

type TruckHotspotProps = Readonly<{
  component: TruckExplorerComponent
  debug: boolean
  isHovered: boolean
  isKeyboardFocused: boolean
  isSelected: boolean
  onBlur: () => void
  onFocus: () => void
  onHover: (hovered: boolean) => void
  onSelect: () => void
  tabIndex: number
}>

export function TruckHotspot({
  component,
  debug,
  isHovered,
  isKeyboardFocused,
  isSelected,
  onBlur,
  onFocus,
  onHover,
  onSelect,
  tabIndex,
}: TruckHotspotProps) {
  const style: HotspotStyle = {
    '--hotspot-x-desktop': `${component.desktopPosition.xPercent}%`,
    '--hotspot-y-desktop': `${component.desktopPosition.yPercent}%`,
    '--hotspot-x-tablet': `${component.tabletPosition.xPercent}%`,
    '--hotspot-y-tablet': `${component.tabletPosition.yPercent}%`,
    '--hotspot-x-mobile': `${component.mobilePosition.xPercent}%`,
    '--hotspot-y-mobile': `${component.mobilePosition.yPercent}%`,
  }

  return (
    <button
      className="truck-hotspot"
      data-component-id={component.id}
      data-hovered={isHovered || undefined}
      data-keyboard-focused={isKeyboardFocused || undefined}
      data-selected={isSelected || undefined}
      type="button"
      aria-label={component.ariaLabel}
      aria-pressed={isSelected}
      onBlur={onBlur}
      onClick={onSelect}
      onFocus={onFocus}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      style={style}
      tabIndex={tabIndex}
    >
      <span className="truck-hotspot__ring" aria-hidden="true" />
      <span className="truck-hotspot__point" aria-hidden="true" />
      <span className="truck-hotspot__label">{component.shortLabel}</span>
      {debug ? (
        <span className="truck-hotspot__debug" aria-hidden="true">
          {component.desktopPosition.xPercent}, {component.desktopPosition.yPercent}
        </span>
      ) : null}
    </button>
  )
}
