import { useCallback, useEffect, useId, useRef, useState } from 'react'
import {
  ENABLE_WORKSHOP_JOURNEY,
  WORKSHOP_JOURNEY_ACTIVE_EVENT,
  WORKSHOP_JOURNEY_NAVIGATE_EVENT,
  isWorkshopJourneyPanel,
  type WorkshopJourneyActiveDetail,
  type WorkshopJourneyNavigateDetail,
} from '../../config/workshopJourney'
import {
  homeNavigation,
  isHomeSectionId,
  NAV_ACTIVE_DEBUG,
  type HomeSectionId,
} from '../../constants/navigation'
import { isServiceId } from '../../config/services'
import { useQuoteRequest } from '../../hooks/useQuoteRequest'
import { useNavigationMotion } from '../../motion/useNavigationMotion'
import { getHomeSectionHref, normalizePathname } from '../../utils/path'

function getSectionEntryElement(section: HTMLElement) {
  return (
    section.querySelector<HTMLElement>(':scope > .container') ?? section
  )
}

function getSectionEntryViewportTop(navigation: HTMLElement | null) {
  const configuredTop = Number.parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue(
      '--section-entry-top',
    ),
  )
  const navigationBottom = navigation?.getBoundingClientRect().bottom ?? 0

  return Math.max(
    Number.isFinite(configuredTop) ? configuredTop : 112,
    navigationBottom + 24,
  )
}

function getSectionScrollTop(
  section: HTMLElement,
  navigation: HTMLElement | null,
) {
  const entryElement = getSectionEntryElement(section)
  const entryDocumentTop =
    entryElement.getBoundingClientRect().top + window.scrollY

  return Math.max(
    0,
    entryDocumentTop - getSectionEntryViewportTop(navigation),
  )
}

export function StoryNav() {
  const { requestQuoteForService } = useQuoteRequest()
  const [isOpen, setIsOpen] = useState(false)
  const [activeSection, setActiveSection] = useState(() => {
    if (normalizePathname(window.location.pathname) !== '/') return ''
    const hashSection = window.location.hash.slice(1)
    return homeNavigation.some((item) => item.id === hashSection)
      ? hashSection
      : 'home'
  })
  const menuId = useId()
  const toggleRef = useRef<HTMLButtonElement>(null)
  const navigationRef = useRef<HTMLDivElement>(null)
  const isProgrammaticScrollRef = useRef(false)
  const programmaticTargetRef = useRef<string | null>(null)
  const cleanupProgrammaticScrollRef = useRef<(() => void) | null>(null)
  const updateActiveSectionRef = useRef<() => void>(() => undefined)
  useNavigationMotion(navigationRef, activeSection, isOpen)

  const startProgrammaticScroll = useCallback((
    sectionId: HomeSectionId,
    behavior: ScrollBehavior = 'smooth',
  ) => {
    cleanupProgrammaticScrollRef.current?.()

    const target = document.getElementById(sectionId)

    const workshopJourney = ENABLE_WORKSHOP_JOURNEY
      ? document.querySelector<HTMLElement>(
          '[data-workshop-journey][data-workshop-mode]',
        )
      : null

    if (workshopJourney && isWorkshopJourneyPanel(sectionId)) {
      isProgrammaticScrollRef.current = true
      programmaticTargetRef.current = sectionId
      setActiveSection(sectionId)

      const targetPanel = workshopJourney.querySelector<HTMLElement>(
        `[data-workshop-panel="${sectionId}"]`,
      )
      let animationFrame = 0
      let stableFrames = 0
      let lastScrollY = window.scrollY
      let lastScrollLeft = workshopJourney.scrollLeft
      let isComplete = false

      const cleanup = () => {
        window.cancelAnimationFrame(animationFrame)
        window.removeEventListener('scrollend', handleScrollEnd)
      }

      const finishProgrammaticScroll = () => {
        if (isComplete) return
        isComplete = true
        cleanup()
        cleanupProgrammaticScrollRef.current = null
        isProgrammaticScrollRef.current = false
        programmaticTargetRef.current = null
        setActiveSection(sectionId)
      }

      const targetReached = () => {
        const journeyAtViewport =
          workshopJourney.dataset.workshopMode === 'desktop' ||
          Math.abs(workshopJourney.getBoundingClientRect().top) <= 2

        return (
          journeyAtViewport &&
          targetPanel !== null &&
          Math.abs(targetPanel.getBoundingClientRect().left) <= 2
        )
      }

      const handleScrollEnd = () => {
        if (targetReached()) finishProgrammaticScroll()
      }

      const monitorScrollPosition = () => {
        const currentScrollY = window.scrollY
        const currentScrollLeft = workshopJourney.scrollLeft
        const movement =
          Math.abs(currentScrollY - lastScrollY) +
          Math.abs(currentScrollLeft - lastScrollLeft)

        stableFrames = movement < 0.5 ? stableFrames + 1 : 0
        lastScrollY = currentScrollY
        lastScrollLeft = currentScrollLeft

        if (stableFrames >= 4 && targetReached()) {
          finishProgrammaticScroll()
          return
        }

        animationFrame = window.requestAnimationFrame(monitorScrollPosition)
      }

      cleanupProgrammaticScrollRef.current = cleanup
      window.addEventListener('scrollend', handleScrollEnd)
      animationFrame = window.requestAnimationFrame(monitorScrollPosition)
      document.dispatchEvent(
        new CustomEvent<WorkshopJourneyNavigateDetail>(
          WORKSHOP_JOURNEY_NAVIGATE_EVENT,
          { detail: { sectionId, behavior } },
        ),
      )
      return true
    }

    if (!target) return false

    isProgrammaticScrollRef.current = true
    programmaticTargetRef.current = sectionId
    setActiveSection(sectionId)

    let animationFrame = 0
    let stableFrames = 0
    let lastScrollY = window.scrollY
    let hasMoved = false
    let isComplete = false

    const cleanup = () => {
      window.cancelAnimationFrame(animationFrame)
      window.removeEventListener('scrollend', finishProgrammaticScroll)
    }

    const finishProgrammaticScroll = () => {
      if (isComplete) return

      isComplete = true
      cleanup()
      cleanupProgrammaticScrollRef.current = null
      isProgrammaticScrollRef.current = false
      programmaticTargetRef.current = null
      updateActiveSectionRef.current()
    }

    const monitorScrollPosition = () => {
      const currentScrollY = window.scrollY
      const movement = Math.abs(currentScrollY - lastScrollY)

      if (movement < 0.5) stableFrames += 1
      else {
        stableFrames = 0
        hasMoved = true
      }

      lastScrollY = currentScrollY

      const scrollOffset =
        Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0
      const targetBounds = target?.getBoundingClientRect()
      const targetReached =
        targetBounds !== undefined &&
        targetBounds.top <= scrollOffset + 2 &&
        targetBounds.bottom > scrollOffset

      if (stableFrames >= 4 && (hasMoved || targetReached)) {
        finishProgrammaticScroll()
        return
      }

      animationFrame = window.requestAnimationFrame(monitorScrollPosition)
    }

    cleanupProgrammaticScrollRef.current = cleanup
    window.addEventListener('scrollend', finishProgrammaticScroll, { once: true })
    animationFrame = window.requestAnimationFrame(monitorScrollPosition)

    window.scrollTo({
      behavior,
      top: getSectionScrollTop(target, navigationRef.current),
    })

    return true
  }, [])

  const navigateToSection = useCallback(
    (
      sectionId: HomeSectionId,
      behavior: ScrollBehavior = 'smooth',
    ) => {
      const navigationStarted = startProgrammaticScroll(sectionId, behavior)
      if (
        navigationStarted &&
        window.location.hash !== `#${sectionId}`
      ) {
        window.history.pushState(null, '', `#${sectionId}`)
      }
      return navigationStarted
    },
    [startProgrammaticScroll],
  )

  useEffect(() => {
    if (!isOpen) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setIsOpen(false)
      toggleRef.current?.focus()
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [isOpen])

  useEffect(() => {
    let activeSectionFrame = 0

    const updateActiveSection = () => {
      if (isProgrammaticScrollRef.current) return

      const sections = Array.from(
        document.querySelectorAll<HTMLElement>('section[id]'),
      ).filter((section) => homeNavigation.some((item) => item.id === section.id))

      if (sections.length === 0) return

      const navbarHeight =
        Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0
      const activeLine = Math.max(navbarHeight + 1, window.innerHeight * 0.4)
      const journey = ENABLE_WORKSHOP_JOURNEY
        ? document.querySelector<HTMLElement>(
            '[data-workshop-journey][data-workshop-mode]',
          )
        : null
      const journeyViewport =
        journey?.querySelector<HTMLElement>('[data-workshop-viewport]') ?? null
      const journeyActiveRegion =
        journey?.dataset.workshopMode === 'desktop' ? journeyViewport : journey
      const journeyBounds = journeyActiveRegion?.getBoundingClientRect()
      const journeyOwnsActiveLine =
        journeyBounds !== undefined &&
        journeyBounds.top <= activeLine &&
        journeyBounds.bottom > activeLine

      if (journeyOwnsActiveLine && journey) {
        const activePanel = journey.querySelector<HTMLElement>(
          '[data-workshop-panel][aria-hidden="false"]',
        )
        const panelId = activePanel?.dataset.workshopPanel

        if (activePanel && panelId && isWorkshopJourneyPanel(panelId)) {
          if (NAV_ACTIVE_DEBUG) {
            const panelBounds = activePanel.getBoundingClientRect()
            console.debug('[StoryNav] horizontal active section', {
              activeLine,
              bounds: {
                bottom: journeyBounds.bottom,
                top: journeyBounds.top,
              },
              panel: panelId,
              panelLeft: panelBounds.left,
              panelRight: panelBounds.right,
            })
          }
          setActiveSection(panelId)
          return
        }
      }

      const verticalSections = sections.filter(
        (section) => !isWorkshopJourneyPanel(section.id),
      )
      if (verticalSections.length === 0) return

      const sectionPositions = verticalSections.map((section) => {
        const bounds = section.getBoundingClientRect()
        const containsActiveLine =
          bounds.top <= activeLine && bounds.bottom > activeLine

        return {
          bounds,
          containsActiveLine,
          section,
        }
      })
      const currentSection =
        sectionPositions.find(({ containsActiveLine }) => containsActiveLine)
          ?.section ??
        sectionPositions.reduce((closest, candidate) => {
          const closestDistance = Math.min(
            Math.abs(closest.bounds.top - activeLine),
            Math.abs(closest.bounds.bottom - activeLine),
          )
          const candidateDistance = Math.min(
            Math.abs(candidate.bounds.top - activeLine),
            Math.abs(candidate.bounds.bottom - activeLine),
          )

          return candidateDistance < closestDistance ? candidate : closest
        }).section

      if (NAV_ACTIVE_DEBUG) {
        console.debug('[StoryNav] vertical active section', {
          activeLine,
          selected: currentSection.id,
          sections: sectionPositions.map(({ bounds, section }) => ({
            bottom: bounds.bottom,
            id: section.id,
            top: bounds.top,
          })),
        })
      }
      setActiveSection(currentSection.id)
    }

    const scheduleActiveSectionUpdate = () => {
      if (isProgrammaticScrollRef.current) return

      window.cancelAnimationFrame(activeSectionFrame)
      activeSectionFrame = window.requestAnimationFrame(updateActiveSection)
    }

    updateActiveSectionRef.current = updateActiveSection
    window.addEventListener('scroll', scheduleActiveSectionUpdate, { passive: true })
    window.addEventListener('resize', scheduleActiveSectionUpdate)
    updateActiveSection()

    return () => {
      window.cancelAnimationFrame(activeSectionFrame)
      window.removeEventListener('scroll', scheduleActiveSectionUpdate)
      window.removeEventListener('resize', scheduleActiveSectionUpdate)
      updateActiveSectionRef.current = () => undefined
    }
  }, [])

  useEffect(() => {
    if (!ENABLE_WORKSHOP_JOURNEY) return

    const handleWorkshopActiveChange = (event: Event) => {
      if (isProgrammaticScrollRef.current) return
      const detail = (event as CustomEvent<WorkshopJourneyActiveDetail>).detail
      if (!detail || !homeNavigation.some((item) => item.id === detail.sectionId)) {
        return
      }
      setActiveSection(detail.sectionId)
    }

    document.addEventListener(
      WORKSHOP_JOURNEY_ACTIVE_EVENT,
      handleWorkshopActiveChange,
    )
    return () =>
      document.removeEventListener(
        WORKSHOP_JOURNEY_ACTIVE_EVENT,
        handleWorkshopActiveChange,
      )
  }, [])

  useEffect(() => {
    const handleSectionLinkClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return

      const anchor = event.target.closest<HTMLAnchorElement>('a[href^="#"]')
      const sectionId = anchor?.hash.slice(1)

      if (!anchor || !isHomeSectionId(sectionId)) return

      const requestedServiceId = anchor.dataset.quoteServiceId
      if (isServiceId(requestedServiceId)) {
        requestQuoteForService(requestedServiceId)
      }

      const usesCustomOffset = navigateToSection(sectionId)
      if (usesCustomOffset) {
        event.preventDefault()
      }
      if (anchor.closest('.story-nav')) {
        setIsOpen(false)

        const toggle = toggleRef.current
        if (toggle && getComputedStyle(toggle).display !== 'none') {
          window.requestAnimationFrame(() => toggle.focus({ preventScroll: true }))
        }
      }
    }

    document.addEventListener('click', handleSectionLinkClick)

    return () => {
      document.removeEventListener('click', handleSectionLinkClick)
      cleanupProgrammaticScrollRef.current?.()
      cleanupProgrammaticScrollRef.current = null
      isProgrammaticScrollRef.current = false
      programmaticTargetRef.current = null
    }
  }, [navigateToSection, requestQuoteForService])

  useEffect(() => {
    if (normalizePathname(window.location.pathname) !== '/') return

    const sectionId = window.location.hash.slice(1)
    if (
      !sectionId ||
      isWorkshopJourneyPanel(sectionId) ||
      !homeNavigation.some((item) => item.id === sectionId)
    ) {
      return
    }

    let firstFrame = 0
    let secondFrame = 0
    isProgrammaticScrollRef.current = true
    programmaticTargetRef.current = sectionId

    firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        const target = document.getElementById(sectionId)
        if (!target) {
          isProgrammaticScrollRef.current = false
          programmaticTargetRef.current = null
          return
        }

        window.scrollTo({
          behavior: 'auto',
          top: getSectionScrollTop(target, navigationRef.current),
        })
        isProgrammaticScrollRef.current = false
        programmaticTargetRef.current = null
        setActiveSection(sectionId)
      })
    })

    return () => {
      window.cancelAnimationFrame(firstFrame)
      window.cancelAnimationFrame(secondFrame)
    }
  }, [])

  return (
    <div
      className={`floating-navigation${isOpen ? ' floating-navigation--open' : ''}`}
      data-intro-navigation
      ref={navigationRef}
    >
      <button
        className="menu-toggle"
        type="button"
        aria-controls={menuId}
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Chiudi menu' : 'Apri menu'}
        onClick={() => setIsOpen((current) => !current)}
        ref={toggleRef}
      >
        <span aria-hidden="true" />
        <span aria-hidden="true" />
      </button>

      <nav className="story-nav" id={menuId} aria-label="Navigazione principale">
        <span className="story-nav__indicator" aria-hidden="true" />
        {homeNavigation.map((item) => {
          const href = getHomeSectionHref(item.id)

          return (
            <a
              aria-current={activeSection === item.id ? 'location' : undefined}
              className={`story-link${
                activeSection === item.id ? ' story-link--active' : ''
              }`}
              href={href}
              key={item.id}
              data-section-id={item.id}
            >
              {item.label}
            </a>
          )
        })}
      </nav>
    </div>
  )
}
