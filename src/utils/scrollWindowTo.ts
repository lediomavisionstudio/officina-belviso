import gsap from 'gsap'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'

gsap.registerPlugin(ScrollToPlugin)

type ScrollWindowToOptions = {
  behavior?: ScrollBehavior
  duration?: number
  onComplete?: () => void
  top: number
}

export function scrollWindowTo({
  behavior = 'smooth',
  duration = 0.42,
  onComplete,
  top,
}: ScrollWindowToOptions) {
  const documentElement = document.documentElement
  const previousScrollBehavior = documentElement.style.scrollBehavior
  let cancelled = false
  let finished = false

  const restore = () => {
    documentElement.style.scrollBehavior = previousScrollBehavior
  }
  const finish = () => {
    if (finished || cancelled) return
    finished = true
    restore()
    onComplete?.()
  }

  documentElement.style.scrollBehavior = 'auto'

  if (
    behavior === 'auto' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    window.scrollTo({ behavior: 'auto', top })
    finish()
    return () => undefined
  }

  const tween = gsap.to(window, {
    duration,
    ease: 'power2.out',
    overwrite: 'auto',
    scrollTo: {
      autoKill: true,
      onAutoKill: finish,
      y: top,
    },
    onComplete: finish,
    onInterrupt: finish,
  })

  return () => {
    if (finished) return
    cancelled = true
    tween.kill()
    restore()
  }
}
