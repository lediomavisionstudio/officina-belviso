import { expect, test, type Page } from '@playwright/test'

const orderedSlides = ['nonno', 'targhetta', 'selfie', 'furgone'] as const

async function openAboutPanel(page: Page) {
  const menuToggle = page.getByRole('button', { name: 'Apri menu' })
  if (await menuToggle.isVisible()) await menuToggle.click()

  await page.locator('.story-link[href="#chi-siamo"]').click()
  await expect(page.locator('[data-workshop-panel="chi-siamo"]')).toHaveAttribute(
    'aria-hidden',
    'false',
  )
}

test.describe('Chi siamo image carousel', () => {
  test('keeps the explicit order for two complete autoplay cycles', async ({ page }) => {
    test.setTimeout(40_000)
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    const carousel = page.locator('[data-about-carousel]')
    const activeSlide = carousel.locator('[data-about-slide][data-active="true"]')

    await expect(activeSlide).toHaveAttribute('data-about-slide', orderedSlides[0])

    for (let step = 1; step <= orderedSlides.length * 2; step += 1) {
      await page.waitForTimeout(3_050)
      const expectedIndex = step % orderedSlides.length
      await expect(activeSlide).toHaveAttribute(
        'data-about-slide',
        orderedSlides[expectedIndex],
      )
      await expect(
        carousel.locator('.about-image-carousel__indicator').nth(expectedIndex),
      ).toHaveAttribute('aria-current', 'true')
    }
  })

  test('selects a slide from its indicator and resumes in the same order', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await openAboutPanel(page)

    const carousel = page.locator('[data-about-carousel]')
    const activeSlide = carousel.locator('[data-about-slide][data-active="true"]')

    await expect
      .poll(() =>
        carousel.locator('img').evaluateAll((images) =>
          images.every((image) => image.complete && image.naturalWidth > 0),
        ),
      )
      .toBe(true)

    await carousel.getByRole('button', { name: 'Mostra foto 2: Targhetta' }).click()
    await expect(activeSlide).toHaveAttribute('data-about-slide', 'targhetta')

    await page.waitForTimeout(3_050)
    await expect(activeSlide).toHaveAttribute('data-about-slide', 'selfie')
  })

  for (const viewport of [
    { name: 'mobile', width: 390, height: 844 },
    { name: 'tablet', width: 820, height: 1180 },
    { name: 'desktop', width: 1440, height: 900 },
  ]) {
    test(`keeps a stable frame on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('/', { waitUntil: 'domcontentloaded' })
      await openAboutPanel(page)

      const media = page.locator('[data-about-carousel] .about-image-carousel__media')
      const initialSize = await media.evaluate((element) => ({
        height: element.clientHeight,
        width: element.clientWidth,
      }))

      await page
        .locator('[data-about-carousel]')
        .getByRole('button', { name: 'Mostra foto 4: Furgone' })
        .click()

      const selectedSize = await media.evaluate((element) => ({
        height: element.clientHeight,
        width: element.clientWidth,
      }))
      expect(selectedSize).toEqual(initialSize)
      await expect(page.locator('[data-about-slide="furgone"]')).toHaveAttribute(
        'data-active',
        'true',
      )
    })
  }
})
