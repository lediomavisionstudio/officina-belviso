import { expect, test } from '@playwright/test'

test.describe('Workshop Journey prototype', () => {
  test('orchestrates only Home, Chi siamo and Servizi on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')

    const journey = page.locator('[data-workshop-journey]')
    await expect(journey).toHaveAttribute('data-workshop-mode', 'desktop')
    await expect(journey.locator('[data-workshop-panel]')).toHaveCount(3)
    expect(
      await page.evaluate(() =>
        document
          .querySelector('[data-workshop-journey]')
          ?.contains(document.querySelector('#galleria')),
      ),
    ).toBe(false)

    await page.getByRole('link', { name: 'Chi siamo', exact: true }).click()
    await expect(page).toHaveURL(/#chi-siamo$/)
    await expect(page.locator('[data-workshop-panel="chi-siamo"]')).toHaveAttribute(
      'aria-hidden',
      'false',
    )

    await page.getByRole('link', { name: 'Servizi', exact: true }).click()
    await expect(page).toHaveURL(/#servizi$/)
    await expect(page.locator('[data-workshop-panel="servizi"]')).toHaveAttribute(
      'aria-hidden',
      'false',
    )
    await expect(
      page.locator('.story-link[href="#servizi"]'),
    ).toHaveAttribute('aria-current', 'location')
    await page.waitForFunction(
      () =>
        Math.abs(
          document
            .querySelector('[data-workshop-panel="servizi"]')!
            .getBoundingClientRect().left,
        ) < 2,
    )
    await page.waitForTimeout(600)

    const quoteLink = page
      .locator('.home-services a[href="#richiedi-preventivo"]')
      .first()
    await quoteLink.focus()
    await expect(quoteLink).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/#richiedi-preventivo$/)
    await expect(page.locator('#richiedi-preventivo')).toBeInViewport()
    await expect(page.locator('[data-workshop-line]')).toHaveCSS('opacity', '0')
  })

  test('keeps the services carousel independent from macro navigation', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await page.getByRole('link', { name: 'Servizi', exact: true }).click()
    await page.waitForFunction(
      () =>
        Math.abs(
          document
            .querySelector('[data-workshop-panel="servizi"]')!
            .getBoundingClientRect().left,
        ) < 2,
    )
    await page.waitForTimeout(600)

    const carousel = page.locator('.home-services [data-premium-carousel]')
    const counter = carousel.locator('.premium-carousel__toolbar > span').first()
    await expect(counter).toContainText('01 / 02')
    await carousel
      .getByRole('button', { name: 'Servizio successivo' })
      .click({ force: true })
    await expect(counter).toContainText('02 / 02')
    await expect(page).toHaveURL(/#servizi$/)
    await expect(page.locator('[data-workshop-panel="servizi"]')).toHaveAttribute(
      'aria-hidden',
      'false',
    )
  })

  test('drives the mobile horizontal narrative exclusively with vertical scroll', async ({ page }) => {
    test.setTimeout(150_000)
    for (const viewport of [
      { width: 375, height: 812 },
      { width: 390, height: 844 },
      { width: 430, height: 932 },
    ]) {
      await page.setViewportSize(viewport)
      await page.goto('/')
      await page.evaluate(() => document.fonts.ready)
      await page.waitForTimeout(200)

      const journey = page.locator('[data-workshop-journey]')
      await expect(journey).toHaveAttribute(
        'data-workshop-mode',
        'mobile-narrative',
      )
      expect(
        await page.evaluate(() =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
        ),
      ).toBe(0)
      await expect(journey.locator('[data-workshop-panel]')).toHaveCount(3)

      const sequence = await page.evaluate(async () => {
        const journeyElement = document.querySelector<HTMLElement>(
          '[data-workshop-journey]',
        )!
        const start = journeyElement.offsetTop
        const distance = journeyElement.offsetHeight - window.innerHeight
        const visited: string[] = []
        const previousScrollBehavior =
          document.documentElement.style.scrollBehavior
        document.documentElement.style.scrollBehavior = 'auto'
        const waitForScrollRender = () =>
          new Promise<void>((resolve) =>
            window.requestAnimationFrame(() =>
              window.requestAnimationFrame(() => resolve()),
            ),
          )

        for (let step = 0; step <= 30; step += 1) {
          window.scrollTo(0, start + (distance * step) / 30)
          await waitForScrollRender()
          const active = document
            .querySelector<HTMLElement>(
              '[data-workshop-panel][aria-hidden="false"]',
            )
            ?.dataset.workshopPanel
          if (active && visited.at(-1) !== active) visited.push(active)
        }

        const visitedBackward: string[] = []
        for (let step = 30; step >= 0; step -= 1) {
          window.scrollTo(0, start + (distance * step) / 30)
          await waitForScrollRender()
          const active = document
            .querySelector<HTMLElement>(
              '[data-workshop-panel][aria-hidden="false"]',
            )
            ?.dataset.workshopPanel
          if (active && visitedBackward.at(-1) !== active) {
            visitedBackward.push(active)
          }
        }

        document.documentElement.style.scrollBehavior = previousScrollBehavior

        return {
          visited,
          visitedBackward,
          nativeHorizontalScroll: journeyElement.scrollLeft,
          trackTransform: getComputedStyle(
            journeyElement.querySelector<HTMLElement>(
              '[data-workshop-track]',
            )!,
          ).transform,
        }
      })

      expect(sequence.visited).toEqual(['home', 'chi-siamo', 'servizi'])
      expect(sequence.visitedBackward).toEqual([
        'servizi',
        'chi-siamo',
        'home',
      ])
      expect(sequence.nativeHorizontalScroll).toBe(0)
      expect(sequence.trackTransform).not.toBe('none')

      await page.getByRole('button', { name: 'Apri menu' }).click()
      await page.getByRole('link', { name: 'Servizi', exact: true }).click()
      await expect(page).toHaveURL(/#servizi$/)
      await expect(
        page.locator('.home-services .service-card').first(),
      ).toBeInViewport()
      await expect(
        page.locator('.story-link[href="#servizi"]'),
      ).toHaveAttribute('aria-current', 'location')
    }
  })

  test('has no inert interval at the mobile journey boundaries', async ({ page }) => {
    test.setTimeout(90_000)
    for (const viewport of [
      { width: 375, height: 812 },
      { width: 390, height: 844 },
      { width: 430, height: 932 },
    ]) {
      await page.setViewportSize(viewport)
      await page.goto('/')
      await page.evaluate(() => document.fonts.ready)
      await page.waitForTimeout(250)

      const result = await page.evaluate(async () => {
        const journey = document.querySelector<HTMLElement>(
          '[data-workshop-journey]',
        )!
        const track = journey.querySelector<HTMLElement>(
          '[data-workshop-track]',
        )!
        const sections = Array.from(
          journey.querySelectorAll<HTMLElement>('[data-workshop-panel] > section'),
        )
        const gallery = document.querySelector<HTMLElement>('#galleria')!
        const start = journey.offsetTop
        const distance = journey.offsetHeight - window.innerHeight
        const previousScrollBehavior =
          document.documentElement.style.scrollBehavior
        document.documentElement.style.scrollBehavior = 'auto'
        const readTransform = (element: HTMLElement) => {
          const transform = getComputedStyle(element).transform
          const matrix = new DOMMatrixReadOnly(transform === 'none' ? undefined : transform)
          return { x: matrix.m41, y: matrix.m42 }
        }
        const samples: Array<{ scrollY: number; trackX: number; sectionY: number[] }> = []

        for (let step = 0; step <= 48; step += 1) {
          window.scrollTo({
            behavior: 'auto',
            top: start + (distance * step) / 48,
          })
          await new Promise<void>((resolve) =>
            window.requestAnimationFrame(() =>
              window.requestAnimationFrame(() => resolve()),
            ),
          )
          samples.push({
            scrollY: window.scrollY,
            trackX: readTransform(track).x,
            sectionY: sections.map((section) => readTransform(section).y),
          })
        }

        const inertIntervals = samples.slice(1).filter((sample, index) => {
          const previous = samples[index]
          const scrollDelta = Math.abs(sample.scrollY - previous.scrollY)
          const visualDelta =
            Math.abs(sample.trackX - previous.trackX) +
            sample.sectionY.reduce(
              (total, y, sectionIndex) =>
                total + Math.abs(y - previous.sectionY[sectionIndex]),
              0,
            )
          return scrollDelta > 1 && visualDelta < 0.5
        }).length

        const finalTrackX = readTransform(track).x
        const expectedTrackX = -(track.scrollWidth - window.innerWidth)
        const galleryTopAtEnd = gallery.getBoundingClientRect().top
        window.scrollTo({
          behavior: 'auto',
          top: start + distance + window.innerHeight * 0.35,
        })
        await new Promise<void>((resolve) =>
          window.requestAnimationFrame(() => resolve()),
        )
        const galleryTopAfterExit = gallery.getBoundingClientRect().top
        document.documentElement.style.scrollBehavior = previousScrollBehavior

        return {
          expectedTrackX,
          finalTrackX,
          galleryTopAfterExit,
          galleryTopAtEnd,
          inertIntervals,
        }
      })

      expect(result.inertIntervals).toBe(0)
      expect(Math.abs(result.finalTrackX - result.expectedTrackX)).toBeLessThan(2)
      expect(result.galleryTopAtEnd).toBeGreaterThan(viewport.height - 2)
      expect(result.galleryTopAtEnd).toBeLessThan(viewport.height + 2)
      expect(result.galleryTopAfterExit).toBeLessThan(result.galleryTopAtEnd)
    }
  })

  test('maps mobile navigation to pinned panels and places the quote form before workshop information', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')

    await page.getByRole('button', { name: 'Apri menu' }).click()
    await page.getByRole('link', { name: 'Chi siamo', exact: true }).click()

    await expect(page).toHaveURL(/#chi-siamo$/)
    await expect(page.locator('[data-workshop-panel="chi-siamo"]')).toHaveAttribute(
      'aria-hidden',
      'false',
    )
    await page.waitForFunction(
      () =>
        Math.abs(
          document
            .querySelector('[data-workshop-panel="chi-siamo"]')!
            .getBoundingClientRect().left,
        ) < 2,
    )
    await expect(
      page.locator('.story-link[href="#chi-siamo"]'),
    ).toHaveAttribute('aria-current', 'location')
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0)

    await page.getByRole('button', { name: 'Apri menu' }).click()
    await page.getByRole('link', { name: 'Descrivi problema', exact: true }).click()
    await expect(page).toHaveURL(/#richiedi-preventivo$/)
    await expect(
      page.locator('#richiedi-preventivo .contact-section__form-heading h2'),
    ).toHaveText('Descrivi il tuo problema')
    await expect(
      page.locator('#richiedi-preventivo .business-card'),
    ).not.toContainText('Richiedi un preventivo')

    const quoteOrder = await page.evaluate(() => {
      const form = document.querySelector<HTMLElement>(
        '#richiedi-preventivo .contact-form',
      )
      const information = document.querySelector<HTMLElement>(
        '#richiedi-preventivo .contact-section__intro',
      )
      return {
        form: form?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY,
        information:
          information?.getBoundingClientRect().top ?? Number.NEGATIVE_INFINITY,
      }
    })
    expect(quoteOrder.form).toBeLessThan(quoteOrder.information)
  })

  test('keeps mobile menu navigation short and deterministic', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await page.evaluate(() => document.fonts.ready)
    await page.waitForTimeout(200)

    const navigateToPanel = async (name: 'Chi siamo' | 'Servizi') => {
      const panelId = name === 'Servizi' ? 'servizi' : 'chi-siamo'
      await page.getByRole('button', { name: 'Apri menu' }).click()
      await page.waitForTimeout(450)
      const startedAt = await page.evaluate(() => performance.now())
      await page
        .getByRole('link', { name, exact: true })
        .evaluate((link: HTMLAnchorElement) => link.click())
      await page.waitForFunction(
        (id) =>
          Math.abs(
            document
              .querySelector(`[data-workshop-panel="${id}"]`)!
              .getBoundingClientRect().left,
          ) < 2,
        panelId,
      )
      return (await page.evaluate(() => performance.now())) - startedAt
    }

    const firstServicesDuration = await navigateToPanel('Servizi')
    const firstServicesPosition = await page.evaluate(() => window.scrollY)
    await navigateToPanel('Chi siamo')
    const secondServicesDuration = await navigateToPanel('Servizi')
    const secondServicesPosition = await page.evaluate(() => window.scrollY)

    expect(firstServicesDuration).toBeLessThan(700)
    expect(secondServicesDuration).toBeLessThan(700)
    expect(Math.abs(secondServicesPosition - firstServicesPosition)).toBeLessThan(2)

    const menuToggle = page.locator('.menu-toggle')
    await menuToggle.click()
    await expect(menuToggle).toHaveAttribute('aria-expanded', 'true')
    await page.getByRole('button', { name: 'Chiudi menu' }).click()
    await expect(menuToggle).toHaveAttribute('aria-expanded', 'false')
  })

  test('remeasures the mobile narrative on orientation changes without losing the active panel', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await page.getByRole('button', { name: 'Apri menu' }).click()
    await page.getByRole('link', { name: 'Chi siamo', exact: true }).click()
    await expect(page.locator('[data-workshop-panel="chi-siamo"]')).toHaveAttribute(
      'aria-hidden',
      'false',
    )

    await page.setViewportSize({ width: 844, height: 390 })
    await page.waitForTimeout(500)

    await expect(page.locator('[data-workshop-journey]')).toHaveAttribute(
      'data-workshop-mode',
      'mobile-narrative',
    )
    await expect(page.locator('[data-workshop-panel="chi-siamo"]')).toHaveAttribute(
      'aria-hidden',
      'false',
    )
    expect(
      await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth,
      ),
    ).toBe(0)
  })

  test('keeps the active mobile panel stable across height-only viewport changes', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await page.getByRole('button', { name: 'Apri menu' }).click()
    await page.getByRole('link', { name: 'Chi siamo', exact: true }).click()
    const aboutPanel = page.locator('[data-workshop-panel="chi-siamo"]')
    await expect(aboutPanel).toHaveAttribute('aria-hidden', 'false')
    await expect
      .poll(() =>
        aboutPanel.evaluate((panel) =>
          Math.abs(panel.getBoundingClientRect().left),
        ),
      )
      .toBeLessThan(2)

    const scrollBeforeResize = await page.evaluate(() => window.scrollY)
    await page.setViewportSize({ width: 390, height: 760 })
    await page.waitForTimeout(350)

    await expect(aboutPanel).toHaveAttribute('aria-hidden', 'false')
    await expect
      .poll(() =>
        aboutPanel.evaluate((panel) =>
          Math.abs(panel.getBoundingClientRect().left),
        ),
      )
      .toBeLessThan(2)
    expect(
      Math.abs((await page.evaluate(() => window.scrollY)) - scrollBeforeResize),
    ).toBeLessThan(2)
  })

  test('keeps the quote title above the form and outside the business card', async ({
    page,
  }) => {
    for (const width of [375, 390, 430, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/#richiedi-preventivo')

      const title = page.locator(
        '#richiedi-preventivo .contact-section__form-heading h2',
      )
      const information = page.locator('#richiedi-preventivo .business-card')
      await expect(title).toHaveText('Descrivi il tuo problema')
      await expect(information).not.toContainText('Richiedi un preventivo')

      const layout = await page.evaluate(() => {
        const titleElement = document.querySelector<HTMLElement>(
          '#richiedi-preventivo .contact-section__form-heading h2',
        )!
        const formElement = document.querySelector<HTMLElement>(
          '#richiedi-preventivo .contact-form',
        )!
        const formColumn = titleElement.closest<HTMLElement>(
          '.contact-section__form',
        )!
        const informationColumn = document.querySelector<HTMLElement>(
          '#richiedi-preventivo .contact-section__intro',
        )!

        return {
          formColumn: getComputedStyle(formColumn).gridColumnStart,
          informationColumn: getComputedStyle(informationColumn).gridColumnStart,
          informationFollowsForm:
            Boolean(
              formColumn.compareDocumentPosition(informationColumn) &
                Node.DOCUMENT_POSITION_FOLLOWING,
            ),
          titleInsideFormColumn: formColumn.contains(titleElement),
          titlePrecedesForm: Boolean(
            titleElement.compareDocumentPosition(formElement) &
              Node.DOCUMENT_POSITION_FOLLOWING,
          ),
        }
      })

      expect(layout.titleInsideFormColumn).toBe(true)
      expect(layout.titlePrecedesForm).toBe(true)
      if (width <= 960) {
        expect(layout.informationFollowsForm).toBe(true)
      } else {
        expect(layout.informationColumn).toBe('1')
        expect(layout.formColumn).toBe('2')
      }
    }
  })

  test('keeps the horizontal structure but removes cinematic depth for reduced motion', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')

    const journey = page.locator('[data-workshop-journey]')
    await expect(journey).toHaveAttribute('data-workshop-mode', 'reduced')
    await page.getByRole('link', { name: 'Chi siamo', exact: true }).click()
    await expect(page).toHaveURL(/#chi-siamo$/)
    await expect(page.locator('[data-workshop-panel="chi-siamo"]')).toHaveAttribute(
      'aria-hidden',
      'false',
    )
  })
})
