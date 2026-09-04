import {
  type RefObject,
  useCallback,
  useLayoutEffect,
  useState,
} from 'react'
import { TRUCK_EXPLORER_FRAME } from '../config/truckComponents'
import type { TruckRenderRect } from '../types/truckExplorer'

const EMPTY_RECT: TruckRenderRect = {
  drawWidth: 0,
  drawHeight: 0,
  offsetX: 0,
  offsetY: 0,
  canvasWidth: 0,
  canvasHeight: 0,
}

function rectChanged(previous: TruckRenderRect, next: TruckRenderRect) {
  return (Object.keys(next) as Array<keyof TruckRenderRect>).some(
    (key) => Math.abs(previous[key] - next[key]) > 0.25,
  )
}

export function useTruckRenderRect(
  canvasRef: RefObject<HTMLCanvasElement | null>,
) {
  const [renderRect, setRenderRect] = useState<TruckRenderRect>(EMPTY_RECT)

  const measure = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const bounds = canvas.getBoundingClientRect()
    const scale = Math.min(
      bounds.width / TRUCK_EXPLORER_FRAME.width,
      bounds.height / TRUCK_EXPLORER_FRAME.height,
    )
    const drawWidth = TRUCK_EXPLORER_FRAME.width * scale
    const drawHeight = TRUCK_EXPLORER_FRAME.height * scale
    const nextRect: TruckRenderRect = {
      drawWidth,
      drawHeight,
      offsetX: (bounds.width - drawWidth) / 2,
      offsetY: (bounds.height - drawHeight) / 2,
      canvasWidth: bounds.width,
      canvasHeight: bounds.height,
    }

    setRenderRect((previous) =>
      rectChanged(previous, nextRect) ? nextRect : previous,
    )
  }, [canvasRef])

  useLayoutEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let animationFrame = 0
    const scheduleMeasurement = () => {
      window.cancelAnimationFrame(animationFrame)
      animationFrame = window.requestAnimationFrame(measure)
    }
    const resizeObserver = new ResizeObserver(scheduleMeasurement)

    resizeObserver.observe(canvas)
    scheduleMeasurement()

    return () => {
      window.cancelAnimationFrame(animationFrame)
      resizeObserver.disconnect()
    }
  }, [canvasRef, measure])

  return renderRect
}
