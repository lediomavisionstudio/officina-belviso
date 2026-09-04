import { useCallback, useMemo, useState } from 'react'
import { getTruckComponent } from '../config/truckComponents'

export function useTruckExplorer() {
  const [explorerOpen, setExplorerOpen] = useState(false)
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(
    null,
  )
  const [hoveredComponentId, setHoveredComponentId] = useState<string | null>(
    null,
  )
  const [keyboardFocusedComponentId, setKeyboardFocusedComponentId] = useState<
    string | null
  >(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const openExplorer = useCallback(() => {
    setSelectedComponentId(null)
    setHoveredComponentId(null)
    setKeyboardFocusedComponentId(null)
    setPanelOpen(true)
    setExplorerOpen(true)
  }, [])

  const closeExplorer = useCallback(() => {
    setExplorerOpen(false)
    setSelectedComponentId(null)
    setHoveredComponentId(null)
    setKeyboardFocusedComponentId(null)
    setPanelOpen(false)
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedComponentId(null)
    setHoveredComponentId(null)
    setKeyboardFocusedComponentId(null)
  }, [])

  const selectedComponent = useMemo(
    () => getTruckComponent(selectedComponentId),
    [selectedComponentId],
  )

  return {
    state: {
      explorerOpen,
      selectedComponentId,
      hoveredComponentId,
      keyboardFocusedComponentId,
      panelOpen,
      isTransitioning,
    },
    selectedComponent,
    openExplorer,
    closeExplorer,
    clearSelection,
    selectComponent: setSelectedComponentId,
    setHoveredComponentId,
    setKeyboardFocusedComponentId,
    setIsTransitioning,
  }
}
