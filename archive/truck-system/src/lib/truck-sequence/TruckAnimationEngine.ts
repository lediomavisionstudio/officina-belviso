import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { truckSequenceConfig } from '../../config/truck-sequence.config'
import {
  TruckCanvasRenderer,
  type TruckCanvasRendererOptions,
} from './TruckCanvasRenderer'
import {
  TruckSequenceLoader,
  type TruckSequenceLoadResult,
} from './TruckSequenceLoader'

gsap.registerPlugin(ScrollTrigger)

export type TruckAnimationEngineOptions = Readonly<{
  canvas: HTMLCanvasElement
  trigger: Element
  start?: string
  end?: string
  scrub?: boolean | number
  pin?: boolean | Element
  loader?: TruckSequenceLoader
  renderer?: Partial<TruckCanvasRendererOptions>
}>

export class TruckAnimationEngine {
  private readonly loader: TruckSequenceLoader
  private readonly renderer: TruckCanvasRenderer
  private readonly scrollState = { progress: 0 }
  private animationFrame: number | null = null
  private desiredProgress = 0
  private destroyed = false
  private initialized = false
  private initialization: Promise<TruckSequenceLoadResult> | null = null
  private matchMedia: gsap.MatchMedia | null = null
  private readonly resizeFallback = () => {
    this.renderer.resize()
    this.requestProgress(this.desiredProgress)
  }
  private resizeObserver: ResizeObserver | null = null
  private scrollTween: gsap.core.Tween | null = null
  private rendering = false

  constructor(private readonly options: TruckAnimationEngineOptions) {
    this.loader = options.loader ?? new TruckSequenceLoader()
    this.renderer = new TruckCanvasRenderer(options.canvas, {
      bitmapCacheSize: truckSequenceConfig.renderer.bitmapCacheSize,
      devicePixelRatioCap:
        truckSequenceConfig.renderer.devicePixelRatioCap,
      ...options.renderer,
    })
  }

  init(): Promise<TruckSequenceLoadResult> {
    if (this.destroyed) {
      return Promise.reject(
        new Error('Truck Animation Engine has already been destroyed.'),
      )
    }

    if (this.initialized && this.initialization) {
      return this.initialization
    }

    if (this.initialization) {
      return this.initialization
    }

    const operation = this.initialize()
    this.initialization = operation

    return operation.catch((error) => {
      if (this.initialization === operation) {
        this.initialization = null
      }

      throw error
    })
  }

  destroy(): void {
    if (this.destroyed) {
      return
    }

    this.destroyed = true
    this.initialized = false
    this.matchMedia?.revert()
    this.matchMedia = null
    this.scrollTween?.kill()
    this.scrollTween = null
    this.resizeObserver?.disconnect()
    this.resizeObserver = null
    window.removeEventListener('resize', this.resizeFallback)

    if (this.animationFrame !== null) {
      window.cancelAnimationFrame(this.animationFrame)
      this.animationFrame = null
    }

    this.loader.release()
    this.renderer.release()
  }

  getCurrentFrameIndex(): number | null {
    return this.renderer.getCurrentFrameIndex()
  }

  isScrollDriven(): boolean {
    return this.scrollTween?.scrollTrigger !== undefined
  }

  isPinned(): boolean {
    return Boolean(this.scrollTween?.scrollTrigger?.pin)
  }

  private async initialize(): Promise<TruckSequenceLoadResult> {
    const loadResult = await this.loader.load()

    if (this.destroyed) {
      this.loader.release()
      throw new DOMException(
        'Truck Animation Engine initialization was aborted.',
        'AbortError',
      )
    }

    this.renderer.resize()
    await this.renderer.render(this.loader.getProgressFrame(0))
    this.setupResizeHandling()
    this.setupScrollAnimation()
    this.initialized = true
    return loadResult
  }

  private setupScrollAnimation(): void {
    this.matchMedia = gsap.matchMedia()

    this.matchMedia.add(
      {
        motion: '(prefers-reduced-motion: no-preference)',
        reducedMotion: '(prefers-reduced-motion: reduce)',
      },
      (context) => {
        if (context.conditions?.reducedMotion) {
          this.requestProgress(0)
          return
        }

        const scopedContext = gsap.context(() => {
          this.scrollState.progress = 0
          this.scrollTween = gsap.to(this.scrollState, {
            progress: 1,
            ease: 'none',
            onUpdate: () => {
              this.requestProgress(this.scrollState.progress)
            },
            scrollTrigger: {
              trigger: this.options.trigger,
              start: this.options.start ?? truckSequenceConfig.scroll.start,
              end: this.options.end ?? truckSequenceConfig.scroll.end,
              scrub: this.options.scrub ?? truckSequenceConfig.scroll.scrub,
              pin: this.options.pin ?? truckSequenceConfig.scroll.pin,
              anticipatePin: truckSequenceConfig.scroll.anticipatePin,
              invalidateOnRefresh: true,
            },
          })
        }, this.options.trigger)

        return () => {
          scopedContext.revert()
          this.scrollTween = null
        }
      },
    )
  }

  private setupResizeHandling(): void {
    const ResizeObserverConstructor = (
      window as Window & {
        ResizeObserver?: typeof ResizeObserver
      }
    ).ResizeObserver

    if (ResizeObserverConstructor) {
      this.resizeObserver = new ResizeObserverConstructor(this.resizeFallback)
      this.resizeObserver.observe(this.options.canvas)
      return
    }

    window.addEventListener('resize', this.resizeFallback, { passive: true })
  }

  private requestProgress(progress: number): void {
    this.desiredProgress = Math.min(1, Math.max(0, progress))

    if (this.animationFrame !== null || this.destroyed) {
      return
    }

    this.animationFrame = window.requestAnimationFrame(() => {
      this.animationFrame = null
      void this.renderDesiredFrame()
    })
  }

  private async renderDesiredFrame(): Promise<void> {
    if (this.rendering || this.destroyed) {
      return
    }

    this.rendering = true

    try {
      const requestedFrame = this.loader.getProgressFrame(this.desiredProgress)

      if (this.renderer.getCurrentFrameIndex() !== requestedFrame.index) {
        await this.renderer.render(requestedFrame)
      }
    } catch (error) {
      if (!this.destroyed) {
        throw error
      }
    } finally {
      this.rendering = false

      if (
        !this.destroyed &&
        this.renderer.getCurrentFrameIndex() !==
          this.loader.getProgressFrame(this.desiredProgress).index
      ) {
        this.requestProgress(this.desiredProgress)
      }
    }
  }
}
