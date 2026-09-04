import { expect, test, type Page } from '@playwright/test'

async function openJourneyPanel(
  page: Page,
  sectionId: 'home' | 'chi-siamo' | 'servizi',
) {
  const link = page.locator(`.story-link[href="#${sectionId}"]`)
  await link.click()

  const panel = page.locator(`[data-workshop-panel="${sectionId}"]`)
  await expect(panel).toHaveAttribute('aria-hidden', 'false')
  await expect
    .poll(() =>
      panel.evaluate((element) =>
        Math.abs(element.getBoundingClientRect().left),
      ),
    )
    .toBeLessThan(2)
}

test.describe('two-level motion system', () => {
  test('keeps the fixed logo and adaptive navigation visible through Hero replay', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')

    const logo = page.locator('.brand-logo-frame')
    const navigation = page.locator('.story-nav')
    const visibleOpacity = async () =>
      Promise.all(
        [logo, navigation].map((element) =>
          element.evaluate((node) => Number(getComputedStyle(node).opacity)),
        ),
      )

    await expect.poll(visibleOpacity).toEqual([1, 1])
    await page.locator('#galleria').scrollIntoViewIfNeeded()
    await expect.poll(visibleOpacity).toEqual([1, 1])

    await page.evaluate(() => {
      const samples: Array<{
        logoOpacity: number
        navOpacity: number
        logoVisible: boolean
        navVisible: boolean
      }> = []
      Object.assign(window, { __fixedChromeSamples: samples })
      const startedAt = performance.now()
      const sample = () => {
        const logoElement = document.querySelector<HTMLElement>('.brand-logo-frame')
        const navElement = document.querySelector<HTMLElement>('.story-nav')
        if (logoElement && navElement) {
          const logoBounds = logoElement.getBoundingClientRect()
          const navBounds = navElement.getBoundingClientRect()
          samples.push({
            logoOpacity: Number(getComputedStyle(logoElement).opacity),
            navOpacity: Number(getComputedStyle(navElement).opacity),
            logoVisible:
              logoBounds.right > 0 &&
              logoBounds.left < innerWidth &&
              logoBounds.bottom > 0 &&
              logoBounds.top < innerHeight,
            navVisible:
              navBounds.right > 0 &&
              navBounds.left < innerWidth &&
              navBounds.bottom > 0 &&
              navBounds.top < innerHeight,
          })
        }
        if (performance.now() - startedAt < 1700) requestAnimationFrame(sample)
      }
      requestAnimationFrame(sample)
    })

    await page.locator('#home').scrollIntoViewIfNeeded()
    await page.waitForTimeout(1800)
    expect(
      await page.evaluate(() => {
        const samples = (
          window as Window & {
            __fixedChromeSamples?: Array<{
              logoOpacity: number
              navOpacity: number
              logoVisible: boolean
              navVisible: boolean
            }>
          }
        ).__fixedChromeSamples ?? []
        return (
          samples.length > 0 &&
          samples.every(
            (sample) =>
              sample.logoOpacity >= 0.99 &&
              sample.navOpacity >= 0.99 &&
              sample.logoVisible &&
              sample.navVisible,
          )
        )
      }),
    ).toBe(true)

    await page.reload()
    await expect.poll(visibleOpacity).toEqual([1, 1])

    await page.setViewportSize({ width: 390, height: 844 })
    const menuToggle = page.getByRole('button', { name: 'Apri menu' })
    await expect
      .poll(() =>
        Promise.all(
          [logo, menuToggle].map((element) =>
            element.evaluate((node) => Number(getComputedStyle(node).opacity)),
          ),
        ),
      )
      .toEqual([1, 1])
    await page.locator('#galleria').scrollIntoViewIfNeeded()
    await expect
      .poll(() =>
        Promise.all(
          [logo, menuToggle].map((element) =>
            element.evaluate((node) => Number(getComputedStyle(node).opacity)),
          ),
        ),
      )
      .toEqual([1, 1])

    await page.setViewportSize({ width: 1440, height: 900 })
    await expect.poll(visibleOpacity).toEqual([1, 1])
  })

  test('replays the Hero and rearms sections only after a meaningful exit', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await expect(page.locator('html')).not.toHaveClass(/intro-running/, {
      timeout: 8000,
    })

    const heroTitle = page.locator('[data-hero-title-text]').first()
    const heroMedia = page.locator(
      '.home-hero__placeholder .placeholder-image__media',
    )
    await expect
      .poll(() => heroTitle.evaluate((element) => Number(getComputedStyle(element).opacity)))
      .toBe(1)

    await heroTitle.evaluate((element) => {
      const state = { mutations: 0 }
      Object.assign(element, { __motionTestState: state })
      new MutationObserver(() => {
        state.mutations += 1
      }).observe(element, { attributeFilter: ['style'], attributes: true })
    })
    await heroMedia.evaluate((element) => {
      const state = { mutations: 0 }
      Object.assign(element, { __motionTestState: state })
      new MutationObserver(() => {
        state.mutations += 1
      }).observe(element, { attributeFilter: ['style'], attributes: true })
    })

    const about = page.locator('#chi-siamo')
    const firstStat = about.locator('.home-about__stats > li').first()
    const firstStatValue = firstStat.locator('.home-about__stat-value')
    await firstStatValue.evaluate((element) => {
      const state = { values: [] as string[] }
      Object.assign(element, { __kpiMotionTestState: state })
      new MutationObserver(() => {
        state.values.push(element.textContent ?? '')
      }).observe(element, { childList: true, characterData: true, subtree: true })
    })
    await openJourneyPanel(page, 'chi-siamo')
    await expect
      .poll(() => firstStat.evaluate((element) => Number(getComputedStyle(element).opacity)))
      .toBe(1)
    await expect(firstStatValue).toHaveText('40+')
    expect(
      await firstStatValue.evaluate(
        (element) =>
          (element as HTMLElement & {
            __kpiMotionTestState?: { values: string[] }
          }).__kpiMotionTestState?.values.some((value) => value !== '40+') ?? false,
      ),
    ).toBe(true)
    await page.waitForTimeout(1100)

    await firstStat.evaluate((element) => {
      const state = { mutations: 0 }
      Object.assign(element, { __motionTestState: state })
      new MutationObserver(() => {
        state.mutations += 1
      }).observe(element, { attributeFilter: ['style'], attributes: true })
    })
    await firstStatValue.evaluate((element) => {
      const state = (
        element as HTMLElement & {
          __kpiMotionTestState?: { values: string[] }
        }
      ).__kpiMotionTestState
      if (state) state.values = []
    })

    await page.evaluate(() => window.scrollBy(0, 20))
    await page.evaluate(() => window.scrollBy(0, -20))
    await page.waitForTimeout(250)
    expect(
      await firstStat.evaluate(
        (element) =>
          (element as HTMLElement & { __motionTestState?: { mutations: number } })
            .__motionTestState?.mutations ?? -1,
      ),
    ).toBe(0)
    expect(
      await firstStatValue.evaluate(
        (element) =>
          (element as HTMLElement & {
            __kpiMotionTestState?: { values: string[] }
          }).__kpiMotionTestState?.values.length ?? -1,
      ),
    ).toBe(0)

    await page.locator('.story-link[href="#galleria"]').click()
    await page.waitForTimeout(150)
    await firstStat.evaluate((element) => {
      const state = (
        element as HTMLElement & { __motionTestState?: { mutations: number } }
      ).__motionTestState
      if (state) state.mutations = 0
    })
    await firstStatValue.evaluate((element) => {
      const state = (
        element as HTMLElement & {
          __kpiMotionTestState?: { values: string[] }
        }
      ).__kpiMotionTestState
      if (state) state.values = []
    })

    await openJourneyPanel(page, 'chi-siamo')
    await expect
      .poll(() =>
        firstStat.evaluate(
          (element) =>
            (element as HTMLElement & { __motionTestState?: { mutations: number } })
              .__motionTestState?.mutations ?? 0,
        ),
      )
      .toBeGreaterThan(0)
    await expect
      .poll(() => firstStat.evaluate((element) => Number(getComputedStyle(element).opacity)))
      .toBe(1)
    await expect(firstStatValue).toHaveText('40+')
    expect(
      await firstStatValue.evaluate(
        (element) =>
          (element as HTMLElement & {
            __kpiMotionTestState?: { values: string[] }
          }).__kpiMotionTestState?.values.some((value) => value !== '40+') ?? false,
      ),
    ).toBe(true)

    await heroTitle.evaluate((element) => {
      const state = (
        element as HTMLElement & { __motionTestState?: { mutations: number } }
      ).__motionTestState
      if (state) state.mutations = 0
    })
    await heroMedia.evaluate((element) => {
      const state = (
        element as HTMLElement & { __motionTestState?: { mutations: number } }
      ).__motionTestState
      if (state) state.mutations = 0
    })

    await openJourneyPanel(page, 'home')
    await expect
      .poll(() =>
        heroTitle.evaluate(
          (element) =>
            (element as HTMLElement & { __motionTestState?: { mutations: number } })
              .__motionTestState?.mutations ?? 0,
        ),
      )
      .toBeGreaterThan(0)
    await expect
      .poll(() =>
        heroMedia.evaluate(
          (element) =>
            (element as HTMLElement & { __motionTestState?: { mutations: number } })
              .__motionTestState?.mutations ?? 0,
        ),
      )
      .toBeGreaterThan(0)
    await expect
      .poll(() => heroTitle.evaluate((element) => Number(getComputedStyle(element).opacity)))
      .toBe(1)
    expect(
      await heroMedia.evaluate(
        (element) =>
          (element as HTMLElement & { __motionTestState?: { mutations: number } })
            .__motionTestState?.mutations ?? -1,
      ),
    ).toBeGreaterThan(0)
  })

  test('keeps every animated section readable with reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')

    for (const selector of [
      '#chi-siamo',
      '#servizi',
      '#galleria',
      '#richiedi-preventivo',
      '#lavora-con-noi',
      '.site-footer',
    ]) {
      const section = page.locator(selector)
      await section.scrollIntoViewIfNeeded()
      await expect(section).toBeVisible()
    }
  })

  test('keeps cinematic images visible across repeated section navigation', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')

    const cases = [
      {
        farSelector: '#galleria',
        mediaSelector: '.home-about__image .placeholder-image__media',
        panelId: 'chi-siamo',
        sectionSelector: '#chi-siamo',
      },
      {
        farSelector: '#lavora-con-noi',
        mediaSelector: '.home-services .placeholder-image__media',
        panelId: 'servizi',
        sectionSelector: '#servizi',
      },
      {
        farSelector: '#home',
        mediaSelector: '.home-gallery .carousel-card .placeholder-image__media',
        panelId: null,
        sectionSelector: '#galleria',
      },
    ]

    for (const item of cases) {
      const section = page.locator(item.sectionSelector)
      const media = page.locator(item.mediaSelector).first()
      for (let pass = 0; pass < 2; pass += 1) {
        if (item.panelId) {
          await openJourneyPanel(
            page,
            item.panelId as 'chi-siamo' | 'servizi',
          )
        } else {
          await section.scrollIntoViewIfNeeded()
        }
        await expect
          .poll(() =>
            media.evaluate((element) => ({
              opacity: Number(getComputedStyle(element).opacity),
              visible:
                element.getBoundingClientRect().right > 0 &&
                element.getBoundingClientRect().left < innerWidth,
            })),
          )
          .toEqual({ opacity: 1, visible: true })

        await page.locator(item.farSelector).scrollIntoViewIfNeeded()
        await page.waitForTimeout(180)
      }
    }
  })

  test('starts image reveals inside the same choreography as their copy', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')

    const observeStarts = async (
      targets: Record<
        string,
        { selector: string; threshold?: number; trackTransform?: boolean }
      >,
    ) => {
      await page.evaluate((targets) => {
        const state: Record<string, number> = {}
        const initialTransforms = Object.fromEntries(
          Object.entries(targets).map(([key, { selector, trackTransform }]) => [
            key,
            trackTransform
              ? document.querySelector<HTMLElement>(selector)?.style.transform ?? ''
              : '',
          ]),
        )
        Object.assign(window, { __imageChoreographyStarts: state })

        const sample = () => {
          Object.entries(targets).forEach(
            ([key, { selector, threshold, trackTransform }]) => {
              if (state[key] !== undefined) return
              const element = document.querySelector<HTMLElement>(selector)
              const hasStarted = element &&
                (trackTransform
                  ? element.style.transform !== initialTransforms[key]
                  : Number(getComputedStyle(element).opacity) > (threshold ?? 0))
              if (hasStarted) {
                state[key] = performance.now()
              }
            },
          )

          if (Object.keys(state).length < Object.keys(targets).length) {
            requestAnimationFrame(sample)
          }
        }

        requestAnimationFrame(sample)
      }, targets)
    }

    const readStarts = () =>
      page.evaluate(
        () =>
          (
            window as Window & {
              __imageChoreographyStarts?: Record<string, number>
            }
          ).__imageChoreographyStarts ?? {},
      )

    await expect
      .poll(() =>
        page
          .locator('.home-about__image .placeholder-image__media')
          .locator('.placeholder-image__reveal-cover')
          .evaluate((element) => getComputedStyle(element).transform),
      )
      .not.toBe('none')
    await expect
      .poll(() =>
        page
          .locator('.home-about .section-heading h2')
          .evaluate((element) => Number(getComputedStyle(element).opacity)),
      )
      .toBe(0)
    await expect
      .poll(() =>
        page
          .locator('.home-about__image .placeholder-image__media img')
          .evaluate(
            (element) =>
              new DOMMatrixReadOnly(getComputedStyle(element).transform).a,
          ),
      )
      .toBeGreaterThan(1.15)

    await observeStarts({
      description: {
        selector: '.home-about .section-heading__description',
        threshold: 0.05,
      },
      image: {
        selector: '.home-about__image .placeholder-image__media img',
        trackTransform: true,
      },
      title: {
        selector: '.home-about .section-heading h2',
        threshold: 0.05,
      },
    })
    await openJourneyPanel(page, 'chi-siamo')
    await expect.poll(async () => Object.keys(await readStarts()).length).toBe(3)
    const aboutStarts = await readStarts()
    // WebKit can defer the first observable opacity frame while the GSAP
    // timeline is already running; keep the assertion focused on overlap,
    // rather than on browser-specific frame scheduling.
    expect(Math.abs(aboutStarts.image - aboutStarts.title)).toBeLessThan(420)
    expect(aboutStarts.description - aboutStarts.image).toBeLessThan(850)

    await expect
      .poll(() =>
        page
          .locator('.home-services .carousel-card .placeholder-image__media')
          .first()
          .locator('.placeholder-image__reveal-cover')
          .evaluate((element) => getComputedStyle(element).transform),
      )
      .not.toBe('none')
    await expect
      .poll(() =>
        page
          .locator('.home-services .carousel-card img')
          .first()
          .evaluate(
            (element) =>
              new DOMMatrixReadOnly(getComputedStyle(element).transform).a,
          ),
      )
      .toBeGreaterThan(1.17)

    await observeStarts({
      card: { selector: '.home-services .carousel-card', threshold: 0.85 },
      image: {
        selector: '.home-services .carousel-card .placeholder-image__media img',
        trackTransform: true,
      },
    })
    await openJourneyPanel(page, 'servizi')
    await expect.poll(async () => Object.keys(await readStarts()).length).toBe(2)
    const serviceStarts = await readStarts()
    expect(serviceStarts.image - serviceStarts.card).toBeLessThan(250)

    await expect
      .poll(() =>
        page
          .locator('.home-gallery .carousel-card .placeholder-image__media')
          .first()
          .locator('.placeholder-image__reveal-cover')
          .evaluate((element) => getComputedStyle(element).transform),
      )
      .not.toBe('none')
    await expect
      .poll(() =>
        page
          .locator('.home-gallery .carousel-card img')
          .first()
          .evaluate(
            (element) =>
              new DOMMatrixReadOnly(getComputedStyle(element).transform).a,
          ),
      )
      .toBeGreaterThan(1.13)

    await observeStarts({
      body: { selector: '.home-gallery .work-card__body', threshold: 0.05 },
      image: {
        selector: '.home-gallery .carousel-card .placeholder-image__media img',
        trackTransform: true,
      },
    })
    await page.locator('.story-link[href="#galleria"]').click()
    await expect.poll(async () => Object.keys(await readStarts()).length).toBe(2)
    const galleryStarts = await readStarts()
    expect(galleryStarts.body - galleryStarts.image).toBeGreaterThan(200)
    expect(galleryStarts.body - galleryStarts.image).toBeLessThan(400)
  })

  test('applies the restrained image hover after each reveal', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')

    for (const item of [
      {
        hoverSelector: '.home-about__image',
        imageSelector: '.home-about__image .placeholder-image__media img',
        panelId: 'chi-siamo',
        sectionSelector: '#chi-siamo',
        expectedScale: 1.02,
      },
      {
        hoverSelector: '.home-services .carousel-card',
        imageSelector: '.home-services .carousel-card img',
        panelId: 'servizi',
        sectionSelector: '#servizi',
        expectedScale: 1.03,
      },
      {
        hoverSelector: '.home-gallery .carousel-card',
        imageSelector: '.home-gallery .carousel-card img',
        panelId: null,
        sectionSelector: '#galleria',
        expectedScale: 1.03,
      },
    ]) {
      if (item.panelId) {
        await openJourneyPanel(
          page,
          item.panelId as 'chi-siamo' | 'servizi',
        )
      } else {
        await page.locator(item.sectionSelector).scrollIntoViewIfNeeded()
      }
      await page.locator(item.hoverSelector).first().hover()
      await expect
        .poll(() =>
          page.locator(item.imageSelector).first().evaluate((element) => {
            const matrix = new DOMMatrixReadOnly(getComputedStyle(element).transform)
            return matrix.a
          }),
        )
        .toBeGreaterThan(item.expectedScale)
    }
  })

  test('renders clearly perceptible mask and internal image motion', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')

    const captureMotion = async (coverSelector: string, imageSelector: string) => {
      await page.evaluate(
        ({ coverSelector, imageSelector }) => {
          const samples = { maskFrames: new Set<string>(), maxScale: 1 }
          Object.assign(window, { __perceptibleImageMotion: samples })
          const startedAt = performance.now()

          const sample = () => {
            const cover = document.querySelector<HTMLElement>(coverSelector)
            const image = document.querySelector<HTMLElement>(imageSelector)
            if (cover && image) {
              samples.maskFrames.add(getComputedStyle(cover).transform)
              samples.maxScale = Math.max(
                samples.maxScale,
                new DOMMatrixReadOnly(getComputedStyle(image).transform).a,
              )
            }
            if (performance.now() - startedAt < 4000) requestAnimationFrame(sample)
          }
          requestAnimationFrame(sample)
        },
        { coverSelector, imageSelector },
      )
    }

    const readMotion = () =>
      page.evaluate(() => {
        const motion = (
          window as Window & {
            __perceptibleImageMotion?: {
              maskFrames: Set<string>
              maxScale: number
            }
          }
        ).__perceptibleImageMotion
        return {
          maskFrames: motion?.maskFrames.size ?? 0,
          maxScale: motion?.maxScale ?? 1,
        }
      })

    await captureMotion(
      '.home-about__image .placeholder-image__reveal-cover',
      '.home-about__image .placeholder-image__media img',
    )
    await openJourneyPanel(page, 'chi-siamo')
    await page.waitForTimeout(1300)
    const aboutMotion = await readMotion()
    expect(aboutMotion.maxScale).toBeGreaterThan(1.12)
    expect(aboutMotion.maskFrames).toBeGreaterThan(5)

    await captureMotion(
      '.home-services .carousel-card .placeholder-image__reveal-cover',
      '.home-services .carousel-card .placeholder-image__media img',
    )
    await openJourneyPanel(page, 'servizi')
    await page.waitForTimeout(1300)
    const serviceMotion = await readMotion()
    expect(serviceMotion.maxScale).toBeGreaterThan(1.14)
    expect(serviceMotion.maskFrames).toBeGreaterThan(5)

    await captureMotion(
      '.home-gallery .carousel-card .placeholder-image__reveal-cover',
      '.home-gallery .carousel-card .placeholder-image__media img',
    )
    await page.locator('.story-link[href="#galleria"]').click()
    await page.waitForTimeout(1400)
    const galleryMotion = await readMotion()
    expect(galleryMotion.maxScale).toBeGreaterThan(1.1)
    expect(galleryMotion.maskFrames).toBeGreaterThan(5)
  })

  test('starts the Maps reveal in the opening beat and replays only its wrapper', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')

    const iframe = page.locator('.business-map__embed iframe')
    await expect(iframe).toBeAttached()
    await expect(iframe).toHaveAttribute('loading', 'eager')

    await page.evaluate(() => {
      const frame = document.querySelector<HTMLIFrameElement>(
        '.business-map__embed iframe',
      )
      const samples: Array<{
        addressOpacity: number
        headerOpacity: number
        mapOpacity: number
        time: number
      }> = []
      const state = {
        frame,
        frameSrc: frame?.src,
        samples,
        startedAt: performance.now(),
      }
      Object.assign(window, { __mapsRevealAudit: state })

      const sample = () => {
        const header = document.querySelector<HTMLElement>(
          '.contact-section--quote .business-card__header',
        )
        const address = document.querySelector<HTMLElement>(
          '.contact-section--quote .business-card__detail--address',
        )
        const map = document.querySelector<HTMLElement>(
          '.contact-section--quote .business-map',
        )
        if (header && address && map) {
          samples.push({
            addressOpacity: Number(getComputedStyle(address).opacity),
            headerOpacity: Number(getComputedStyle(header).opacity),
            mapOpacity: Number(getComputedStyle(map).opacity),
            time: performance.now() - state.startedAt,
          })
        }
        if (performance.now() - state.startedAt < 4500) requestAnimationFrame(sample)
      }
      requestAnimationFrame(sample)
    })

    await page
      .locator('.story-link[href="#richiedi-preventivo"]')
      .click()
    await page.waitForTimeout(2400)

    const timing = await page.evaluate(() => {
      const audit = (
        window as Window & {
          __mapsRevealAudit?: {
            samples: Array<{
              addressOpacity: number
              headerOpacity: number
              mapOpacity: number
              time: number
            }>
          }
        }
      ).__mapsRevealAudit
      const samples = audit?.samples ?? []
      const headerStart = samples.find((sample) => sample.headerOpacity > 0.01)?.time
      const mapStart = samples.find((sample) => sample.mapOpacity > 0.01)?.time
      const visibleMapStart = samples.find(
        (sample) => sample.mapOpacity > 0.01 && sample.addressOpacity > 0.01,
      )?.time
      return {
        ownTweenDelta:
          headerStart === undefined || mapStart === undefined
            ? null
            : mapStart - headerStart,
        visibleDelta:
          headerStart === undefined || visibleMapStart === undefined
            ? null
            : visibleMapStart - headerStart,
      }
    })

    expect(timing.ownTweenDelta).not.toBeNull()
    expect(timing.ownTweenDelta ?? Number.POSITIVE_INFINITY).toBeLessThan(320)
    expect(timing.visibleDelta).not.toBeNull()
    expect(timing.visibleDelta ?? Number.POSITIVE_INFINITY).toBeLessThan(560)

    await page.locator('.story-link[href="#galleria"]').click()
    await page.waitForTimeout(900)
    await page
      .locator('.story-link[href="#richiedi-preventivo"]')
      .click()
    await page.waitForTimeout(1200)

    expect(
      await page.evaluate(() => {
        const audit = (
          window as Window & {
            __mapsRevealAudit?: {
              frame: HTMLIFrameElement | null
              frameSrc?: string
            }
          }
        ).__mapsRevealAudit
        const currentFrame = document.querySelector<HTMLIFrameElement>(
          '.business-map__embed iframe',
        )
        return (
          currentFrame !== null &&
          currentFrame === audit?.frame &&
          currentFrame.src === audit.frameSrc
        )
      }),
    ).toBe(true)
  })
})
