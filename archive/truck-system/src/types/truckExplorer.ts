export type TruckExplorerPanelSide = 'left' | 'right'
export type TruckExplorerAccent = 'red'
export type TruckExplorerViewport = 'desktop' | 'tablet' | 'mobile'

export type TruckHotspotPosition = Readonly<{
  xPercent: number
  yPercent: number
}>

export type TruckExplorerComponent = Readonly<{
  id: string
  label: string
  shortLabel: string
  title: string
  subtitle: string
  description: string
  serviceDetails: readonly string[]
  desktopPosition: TruckHotspotPosition
  tabletPosition: TruckHotspotPosition
  mobilePosition: TruckHotspotPosition
  panelSide: TruckExplorerPanelSide
  order: number
  accent: TruckExplorerAccent
  ariaLabel: string
}>

export type TruckRenderRect = Readonly<{
  drawWidth: number
  drawHeight: number
  offsetX: number
  offsetY: number
  canvasWidth: number
  canvasHeight: number
}>

export type TruckExplorerState = Readonly<{
  explorerOpen: boolean
  selectedComponentId: string | null
  hoveredComponentId: string | null
  keyboardFocusedComponentId: string | null
  panelOpen: boolean
  isTransitioning: boolean
}>
