import type { TruckSequenceFrame } from './TruckSequenceLoader'

export type TruckCanvasRendererOptions = Readonly<{
  bitmapCacheSize: number
  devicePixelRatioCap: number
}>

const DEFAULT_OPTIONS: TruckCanvasRendererOptions = Object.freeze({
  bitmapCacheSize: 12,
  devicePixelRatioCap: 2,
})

export class TruckCanvasRenderer {
  private readonly bitmapCache = new Map<number, ImageBitmap>()
  private readonly context: CanvasRenderingContext2D
  private readonly options: TruckCanvasRendererOptions
  private currentFrame: TruckSequenceFrame | null = null
  private disposed = false
  private renderVersion = 0

  constructor(
    private readonly canvas: HTMLCanvasElement,
    options: Partial<TruckCanvasRendererOptions> = {},
  ) {
    const context = canvas.getContext('2d', {
      alpha: true,
      desynchronized: true,
    })

    if (!context) {
      throw new Error('Truck Canvas Renderer requires a 2D canvas context.')
    }

    this.context = context
    this.options = Object.freeze({
      ...DEFAULT_OPTIONS,
      ...options,
    })

    if (
      !Number.isInteger(this.options.bitmapCacheSize) ||
      this.options.bitmapCacheSize < 1
    ) {
      throw new RangeError('bitmapCacheSize must be a positive integer.')
    }

    if (
      !Number.isFinite(this.options.devicePixelRatioCap) ||
      this.options.devicePixelRatioCap < 1
    ) {
      throw new RangeError('devicePixelRatioCap must be at least 1.')
    }
  }

  async render(frame: TruckSequenceFrame): Promise<void> {
    this.assertActive()

    if (this.currentFrame?.index === frame.index) {
      return
    }

    const renderVersion = ++this.renderVersion
    const bitmap = await this.getBitmap(frame)

    if (this.disposed || renderVersion !== this.renderVersion) {
      return
    }

    this.currentFrame = frame
    this.drawBitmap(bitmap)
  }

  resize(): void {
    this.assertActive()
    const fallbackWidth = this.currentFrame?.width ?? 1
    const fallbackHeight = this.currentFrame?.height ?? 1
    const cssWidth = this.canvas.clientWidth || fallbackWidth
    const cssHeight = this.canvas.clientHeight || fallbackHeight
    const devicePixelRatio = Math.min(
      window.devicePixelRatio || 1,
      this.options.devicePixelRatioCap,
    )
    const renderWidth = Math.max(1, Math.round(cssWidth * devicePixelRatio))
    const renderHeight = Math.max(1, Math.round(cssHeight * devicePixelRatio))

    if (
      this.canvas.width === renderWidth &&
      this.canvas.height === renderHeight
    ) {
      return
    }

    this.canvas.width = renderWidth
    this.canvas.height = renderHeight

    if (this.currentFrame) {
      const bitmap = this.bitmapCache.get(this.currentFrame.index)

      if (bitmap) {
        this.drawBitmap(bitmap)
      }
    }
  }

  release(): void {
    if (this.disposed) {
      return
    }

    this.disposed = true
    this.renderVersion += 1
    this.bitmapCache.forEach((bitmap) => bitmap.close())
    this.bitmapCache.clear()
    this.currentFrame = null
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  getCurrentFrameIndex(): number | null {
    return this.currentFrame?.index ?? null
  }

  private async getBitmap(frame: TruckSequenceFrame): Promise<ImageBitmap> {
    const cachedBitmap = this.bitmapCache.get(frame.index)

    if (cachedBitmap) {
      this.bitmapCache.delete(frame.index)
      this.bitmapCache.set(frame.index, cachedBitmap)
      return cachedBitmap
    }

    const bitmap = await createImageBitmap(frame.blob)

    if (this.disposed) {
      bitmap.close()
      throw new DOMException('Truck Canvas Renderer was released.', 'AbortError')
    }

    this.bitmapCache.set(frame.index, bitmap)
    this.trimCache(frame.index)
    return bitmap
  }

  private trimCache(protectedFrameIndex: number): void {
    while (this.bitmapCache.size > this.options.bitmapCacheSize) {
      const oldestFrameIndex = this.bitmapCache.keys().next().value

      if (oldestFrameIndex === undefined) {
        return
      }

      if (oldestFrameIndex === protectedFrameIndex) {
        const protectedBitmap = this.bitmapCache.get(oldestFrameIndex)
        this.bitmapCache.delete(oldestFrameIndex)

        if (protectedBitmap) {
          this.bitmapCache.set(oldestFrameIndex, protectedBitmap)
        }

        continue
      }

      const oldestBitmap = this.bitmapCache.get(oldestFrameIndex)
      this.bitmapCache.delete(oldestFrameIndex)
      oldestBitmap?.close()
    }
  }

  private drawBitmap(bitmap: ImageBitmap): void {
    const canvasWidth = this.canvas.width
    const canvasHeight = this.canvas.height
    const scale = Math.min(
      canvasWidth / bitmap.width,
      canvasHeight / bitmap.height,
    )
    const drawWidth = bitmap.width * scale
    const drawHeight = bitmap.height * scale
    const drawX = (canvasWidth - drawWidth) / 2
    const drawY = (canvasHeight - drawHeight) / 2

    this.context.clearRect(0, 0, canvasWidth, canvasHeight)
    this.context.drawImage(bitmap, drawX, drawY, drawWidth, drawHeight)
  }

  private assertActive(): void {
    if (this.disposed) {
      throw new Error('Truck Canvas Renderer has already been released.')
    }
  }
}
