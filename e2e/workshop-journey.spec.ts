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

  test('uses the normal vertical document flow without page overflow on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')

    const journey = page.locator('[data-workshop-journey]')
    await expect(journey).toHaveAttribute('data-workshop-mode', 'mobile')
    expect(
      await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth,
      ),
    ).toBe(0)
    await expect(journey.locator('[data-workshop-panel][inert]')).toHaveCount(0)
    await expect(
      journey.locator('[data-workshop-panel][aria-hidden]'),
    ).toHaveCount(0)

    const sectionPositions = await page.evaluate(() =>
      ['home', 'chi-siamo', 'servizi', 'galleria'].map((id) => {
        const section = document.getElementById(id)
        return section
          ? section.getBoundingClientRect().top + window.scrollY
          : Number.NaN
      }),
    )
    expect(sectionPositions).toEqual([...sectionPositions].sort((a, b) => a - b))

    await page.getByRole('button', { name: 'Apri menu' }).click()
    await page.getByRole('link', { name: 'Servizi', exact: true }).click()
    await expect(page).toHaveURL(/#servizi$/)
    await expect(page.locator('.home-services .service-card').first()).toBeInViewport()
    await expect(
      page.locator('.story-link[href="#servizi"]'),
    ).toHaveAttribute('aria-current', 'location')
  })

  test('keeps mobile sections vertical and places the quote form before workshop information', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')

    await page.getByRole('button', { name: 'Apri menu' }).click()
    await page.getByRole('link', { name: 'Chi siamo', exact: true }).click()

    await expect(page).toHaveURL(/#chi-siamo$/)
    await expect(page.locator('#about-title')).toBeInViewport()
    await expect(
      page.locator('.story-link[href="#chi-siamo"]'),
    ).toHaveAttribute('aria-current', 'location')
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0)

    await page.getByRole('button', { name: 'Apri menu' }).click()
    await page.getByRole('link', { name: 'Descrivi problema', exact: true }).click()
    await expect(page).toHaveURL(/#richiedi-preventivo$/)

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
