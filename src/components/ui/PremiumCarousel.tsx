import {
  Children,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import gsap from 'gsap'
import { motionTokens } from '../../motion/motionTokens'
import { useReducedMotion } from '../../motion/useReducedMotion'

type PremiumCarouselProps = {
  ariaLabel: string
  children: ReactNode
  nextLabel: string
  previousLabel: string
}

type DragState = {
  active: boolean
  didDrag: boolean
  startScrollLeft: number
  startX: number
}

type TouchGestureState = {
  axis: 'horizontal' | 'vertical' | null
  startX: number
  startY: number
}

const TOUCH_AXIS_THRESHOLD = 10

type CarouselLayout = {
  endSpacerWidth: number
  pageCount: number
  pageSize: number
}

export function PremiumCarousel({
  ariaLabel,
  children,
  nextLabel,
  previousLabel,
}: PremiumCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()
  const tweenRef = useRef<gsap.core.Tween | null>(null)
  const contentTweenRef = useRef<gsap.core.Timeline | null>(null)
  const animationFrameRef = useRef(0)
  const nativeSnapTimerRef = useRef<number | null>(null)
  const nativeTouchActiveRef = useRef(false)
  const releaseDragTimerRef = useRef<number | null>(null)
  const targetPageRef = useRef(0)
  const touchGestureRef = useRef<TouchGestureState>({
    axis: null,
    startX: 0,
    startY: 0,
  })
  const dragRef = useRef<DragState>({
    active: false,
    didDrag: false,
    startScrollLeft: 0,
    startX: 0,
  })
  const [currentPage, setCurrentPage] = useState(0)
  const [canGoPrevious, setCanGoPrevious] = useState(false)
  const [canGoNext, setCanGoNext] = useState(true)
  const slides = Children.toArray(children)
  const [layout, setLayout] = useState<CarouselLayout>({
    endSpacerWidth: 0,
    pageCount: slides.length,
    pageSize: 1,
  })

  const readCarouselMetrics = useCallback(() => {
    const track = trackRef.current
    if (!track) return null

    const trackBounds = track.getBoundingClientRect()
    const slideElements = Array.from(
      track.querySelectorAll<HTMLElement>('[data-carousel-slide]'),
    )
    if (slideElements.length === 0) return null

    const positions = slideElements.map(
      (slide) => slide.getBoundingClientRect().left - trackBounds.left + track.scrollLeft,
    )
    const slideWidth = slideElements[0].getBoundingClientRect().width
    const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 0
    const pageSize = Math.max(
      1,
      Math.min(
        slideElements.length,
        Math.floor((track.clientWidth + gap) / (slideWidth + gap) + 0.01),
      ),
    )
    const pageStarts = Array.from(
      { length: Math.ceil(slideElements.length / pageSize) },
      (_, pageIndex) => pageIndex * pageSize,
    )

    return {
      gap,
      pagePositions: pageStarts.map((slideIndex) => positions[slideIndex]),
      pageSize,
      pageStarts,
      slideWidth,
    }
  }, [])

  const updateCarouselState = useCallback(() => {
    const track = trackRef.current
    if (!track) return

    const metrics = readCarouselMetrics()
    if (!metrics) return

    const closestPage = metrics.pagePositions.reduce(
      (closest, position, index) =>
        Math.abs(position - track.scrollLeft) <
        Math.abs(metrics.pagePositions[closest] - track.scrollLeft)
          ? index
          : closest,
      0,
    )
    const displayedPage = tweenRef.current?.isActive()
      ? targetPageRef.current
      : closestPage
    const maximumScroll = Math.max(0, track.scrollWidth - track.clientWidth)
    const isScrollable = maximumScroll > 1

    if (!tweenRef.current?.isActive()) targetPageRef.current = closestPage
    setCurrentPage(displayedPage)
    setCanGoPrevious(isScrollable && displayedPage > 0)
    setCanGoNext(
      isScrollable && displayedPage < metrics.pagePositions.length - 1,
    )
  }, [readCarouselMetrics])

  const scheduleStateUpdate = useCallback(() => {
    window.cancelAnimationFrame(animationFrameRef.current)
    animationFrameRef.current = window.requestAnimationFrame(updateCarouselState)
  }, [updateCarouselState])

  const moveToPage = useCallback(
    (nextPage: number) => {
      const track = trackRef.current
      if (!track) return

      const metrics = readCarouselMetrics()
      if (!metrics) return

      const clampedPage = Math.min(
        Math.max(nextPage, 0),
        metrics.pagePositions.length - 1,
      )
      const maximumScroll = Math.max(0, track.scrollWidth - track.clientWidth)
      const target = Math.min(metrics.pagePositions[clampedPage], maximumScroll)
      const previousPage = targetPageRef.current
      const direction = clampedPage >= previousPage ? 1 : -1
      if (nativeSnapTimerRef.current !== null) {
        window.clearTimeout(nativeSnapTimerRef.current)
        nativeSnapTimerRef.current = null
      }
      tweenRef.current?.kill()
      contentTweenRef.current?.kill()
      targetPageRef.current = clampedPage
      setCurrentPage(clampedPage)
      setCanGoPrevious(clampedPage > 0)
      setCanGoNext(clampedPage < metrics.pagePositions.length - 1)
      if (Math.abs(track.scrollLeft - target) < 0.5) {
        tweenRef.current = null
        updateCarouselState()
        return
      }
      tweenRef.current = gsap.to(track, {
        scrollLeft: target,
        duration: reducedMotion ? 0 : motionTokens.duration.carousel,
        ease: motionTokens.ease.state,
        overwrite: 'auto',
        onUpdate: scheduleStateUpdate,
        onComplete: () => {
          tweenRef.current = null
          updateCarouselState()
        },
      })

      if (!reducedMotion) {
        const allSlides = Array.from(
          track.querySelectorAll<HTMLElement>('[data-carousel-slide]'),
        )
        const cardsForPage = (page: number) => {
          const pageIndex = Math.min(page, metrics.pageStarts.length - 1)
          const startIndex = metrics.pageStarts[pageIndex] ?? 0

          return allSlides
            .slice(startIndex, startIndex + metrics.pageSize)
            .map((slide) => slide.querySelector<HTMLElement>('.carousel-card'))
            .filter((card): card is HTMLElement => card !== null)
        }
        const outgoingCards = cardsForPage(previousPage)
        const incomingCards = cardsForPage(clampedPage)

        contentTweenRef.current = gsap
          .timeline({
            onComplete: () => {
              gsap.set(outgoingCards, {
                clearProps: 'opacity,visibility,transform',
              })
              contentTweenRef.current = null
            },
          })
          .to(
            outgoingCards,
            {
              opacity: 0.3,
              x: -direction * 28,
              scale: 0.96,
              duration: 0.24,
              ease: motionTokens.ease.exit,
              stagger: 0.045,
            },
            0,
          )
          .fromTo(
            incomingCards,
            {
              opacity: 0,
              x: direction * 38,
              y: 24,
              scale: 0.94,
            },
            {
              opacity: 1,
              x: 0,
              y: 0,
              scale: 1,
              duration: motionTokens.duration.carousel,
              ease: motionTokens.ease.enter,
              stagger: 0.12,
              clearProps: 'opacity,visibility,transform',
            },
            0.08,
          )
      }
    },
    [readCarouselMetrics, reducedMotion, scheduleStateUpdate, updateCarouselState],
  )

  const snapToClosestPage = useCallback(() => {
    const track = trackRef.current
    if (!track) return

    const metrics = readCarouselMetrics()
    if (!metrics) return

    const closestPage = metrics.pagePositions.reduce(
      (closest, position, index) =>
        Math.abs(position - track.scrollLeft) <
        Math.abs(metrics.pagePositions[closest] - track.scrollLeft)
          ? index
          : closest,
      0,
    )

    moveToPage(closestPage)
  }, [moveToPage, readCarouselMetrics])

  const syncResponsiveLayout = useCallback(() => {
    const metrics = readCarouselMetrics()
    if (!metrics) return

    const remainder = slides.length % metrics.pageSize
    const missingSlides = remainder === 0 ? 0 : metrics.pageSize - remainder
    const endSpacerWidth =
      missingSlides === 0
        ? 0
        : missingSlides * metrics.slideWidth +
          Math.max(0, missingSlides - 1) * metrics.gap
    const nextLayout = {
      endSpacerWidth,
      pageCount: metrics.pageStarts.length,
      pageSize: metrics.pageSize,
    }

    setLayout((currentLayout) =>
      currentLayout.endSpacerWidth === nextLayout.endSpacerWidth &&
      currentLayout.pageCount === nextLayout.pageCount &&
      currentLayout.pageSize === nextLayout.pageSize
        ? currentLayout
        : nextLayout,
    )
    scheduleStateUpdate()
  }, [readCarouselMetrics, scheduleStateUpdate, slides.length])

  const scheduleNativeSnap = useCallback(() => {
    if (nativeSnapTimerRef.current !== null) {
      window.clearTimeout(nativeSnapTimerRef.current)
    }
    nativeSnapTimerRef.current = window.setTimeout(() => {
      nativeSnapTimerRef.current = null
      if (
        !nativeTouchActiveRef.current &&
        !dragRef.current.active &&
        !tweenRef.current?.isActive()
      ) {
        snapToClosestPage()
      }
    }, 220)
  }, [snapToClosestPage])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const supportsScrollEnd = 'onscrollend' in track
    const handleTrackScroll = () => {
      scheduleStateUpdate()
      if (
        !nativeTouchActiveRef.current &&
        !dragRef.current.active &&
        !tweenRef.current?.isActive()
      ) {
        scheduleNativeSnap()
      }
    }
    const handleScrollEnd = () => {
      if (
        !nativeTouchActiveRef.current &&
        !dragRef.current.active &&
        !tweenRef.current?.isActive()
      ) {
        snapToClosestPage()
      }
    }
    const resizeObserver = new ResizeObserver(syncResponsiveLayout)
    resizeObserver.observe(track)
    track
      .querySelectorAll<HTMLElement>('[data-carousel-slide]')
      .forEach((slide) => resizeObserver.observe(slide))
    const mutationObserver = new MutationObserver(syncResponsiveLayout)
    mutationObserver.observe(track, { childList: true })
    track.addEventListener('scroll', handleTrackScroll, { passive: true })
    if (supportsScrollEnd) {
      track.addEventListener('scrollend', handleScrollEnd)
    }
    syncResponsiveLayout()

    return () => {
      track.removeEventListener('scroll', handleTrackScroll)
      if (supportsScrollEnd) {
        track.removeEventListener('scrollend', handleScrollEnd)
      }
      resizeObserver.disconnect()
      mutationObserver.disconnect()
      window.cancelAnimationFrame(animationFrameRef.current)
      if (nativeSnapTimerRef.current !== null) {
        window.clearTimeout(nativeSnapTimerRef.current)
      }
      if (releaseDragTimerRef.current !== null) {
        window.clearTimeout(releaseDragTimerRef.current)
      }
      tweenRef.current?.kill()
      contentTweenRef.current?.kill()
    }
  }, [
    scheduleNativeSnap,
    scheduleStateUpdate,
    snapToClosestPage,
    syncResponsiveLayout,
  ])

  useLayoutEffect(() => {
    const track = trackRef.current
    if (!track) return

    const metrics = readCarouselMetrics()
    if (!metrics) return

    const closestPage = metrics.pagePositions.reduce(
      (closest, position, index) =>
        Math.abs(position - track.scrollLeft) <
        Math.abs(metrics.pagePositions[closest] - track.scrollLeft)
          ? index
          : closest,
      0,
    )

    track.scrollLeft = metrics.pagePositions[closestPage]
    targetPageRef.current = closestPage
    scheduleStateUpdate()
  }, [
    layout.endSpacerWidth,
    layout.pageSize,
    readCarouselMetrics,
    scheduleStateUpdate,
  ])

  const finishPointerDrag = (event: PointerEvent<HTMLDivElement>) => {
    const track = trackRef.current
    if (!track) return

    if (event.pointerType === 'touch') {
      nativeTouchActiveRef.current = false
      if (touchGestureRef.current.axis === 'horizontal') scheduleNativeSnap()
      touchGestureRef.current.axis = null
      track.removeAttribute('data-touch-axis')
      return
    }

    if (!dragRef.current.active) return

    dragRef.current.active = false
    track.removeAttribute('data-dragging')

    if (track.hasPointerCapture(event.pointerId)) {
      track.releasePointerCapture(event.pointerId)
    }

    if (dragRef.current.didDrag) {
      snapToClosestPage()
      releaseDragTimerRef.current = window.setTimeout(() => {
        dragRef.current.didDrag = false
        releaseDragTimerRef.current = null
      }, 0)
    }
  }

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const track = trackRef.current
    if (!track) return

    if (event.pointerType === 'touch') {
      nativeTouchActiveRef.current = true
      touchGestureRef.current = {
        axis: null,
        startX: event.clientX,
        startY: event.clientY,
      }
      if (nativeSnapTimerRef.current !== null) {
        window.clearTimeout(nativeSnapTimerRef.current)
        nativeSnapTimerRef.current = null
      }
      tweenRef.current?.kill()
      tweenRef.current = null
      return
    }

    if (event.button !== 0) return

    tweenRef.current?.kill()
    tweenRef.current = null
    dragRef.current = {
      active: true,
      didDrag: false,
      startScrollLeft: track.scrollLeft,
      startX: event.clientX,
    }
    track.setPointerCapture(event.pointerId)
    track.setAttribute('data-dragging', 'true')
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const track = trackRef.current
    if (!track) return

    if (event.pointerType === 'touch') {
      const gesture = touchGestureRef.current
      if (gesture.axis !== null) return

      const distanceX = Math.abs(event.clientX - gesture.startX)
      const distanceY = Math.abs(event.clientY - gesture.startY)
      if (Math.max(distanceX, distanceY) < TOUCH_AXIS_THRESHOLD) return

      gesture.axis = distanceX > distanceY ? 'horizontal' : 'vertical'
      track.dataset.touchAxis = gesture.axis
      return
    }

    if (!dragRef.current.active) return

    const movement = event.clientX - dragRef.current.startX
    if (Math.abs(movement) > 4) dragRef.current.didDrag = true

    track.scrollLeft = dragRef.current.startScrollLeft - movement
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      moveToPage(targetPageRef.current - 1)
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault()
      moveToPage(targetPageRef.current + 1)
    }
  }

  return (
    <div
      className="premium-carousel"
      role="region"
      aria-label={ariaLabel}
      aria-roledescription="carousel"
      data-premium-carousel
    >
      <div className="premium-carousel__toolbar">
        <span aria-hidden="true">
          {String(currentPage + 1).padStart(2, '0')} /{' '}
          {String(layout.pageCount).padStart(2, '0')}
        </span>
        <span className="visually-hidden" aria-live="polite" aria-atomic="true">
          Pagina {currentPage + 1} di {layout.pageCount}
        </span>
        <div className="premium-carousel__controls">
          <button
            type="button"
            aria-label={previousLabel}
            disabled={!canGoPrevious}
            aria-hidden={!canGoPrevious}
            tabIndex={canGoPrevious ? 0 : -1}
            onClick={() => moveToPage(targetPageRef.current - 1)}
          >
            <span aria-hidden="true">&larr;</span>
          </button>
          <button
            type="button"
            aria-label={nextLabel}
            disabled={!canGoNext}
            aria-hidden={!canGoNext}
            tabIndex={canGoNext ? 0 : -1}
            onClick={() => moveToPage(targetPageRef.current + 1)}
          >
            <span aria-hidden="true">&rarr;</span>
          </button>
        </div>
      </div>
      <div
        className="premium-carousel__track-shell"
        data-can-scroll-previous={canGoPrevious || undefined}
        data-can-scroll-next={canGoNext || undefined}
      >
        <span
          className="premium-carousel__edge premium-carousel__edge--start"
          aria-hidden="true"
        />
        <div
          className="premium-carousel__track"
          ref={trackRef}
          tabIndex={0}
          aria-label={`${ariaLabel}: usa i tasti freccia o scorri orizzontalmente`}
          onClickCapture={(event) => {
            if (dragRef.current.didDrag) event.preventDefault()
          }}
          onDragStart={(event) => event.preventDefault()}
          onKeyDown={handleKeyDown}
          onPointerCancel={finishPointerDrag}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishPointerDrag}
          data-carousel-track
        >
          {slides.map((slide, index) => (
            <div
              className="premium-carousel__slide"
              role="group"
              aria-label={`${index + 1} di ${slides.length}`}
              aria-roledescription="slide"
              data-carousel-slide
              data-carousel-page-start={index % layout.pageSize === 0}
              key={index}
            >
              {slide}
            </div>
          ))}
          {layout.endSpacerWidth > 0 ? (
            <div
              className="premium-carousel__end-spacer"
              style={{ flexBasis: `${layout.endSpacerWidth}px` }}
              aria-hidden="true"
            />
          ) : null}
        </div>
        <span
          className="premium-carousel__edge premium-carousel__edge--end"
          aria-hidden="true"
        />
      </div>
    </div>
  )
}
