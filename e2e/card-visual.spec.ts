import { expect, test, type Page } from '@playwright/test'

async function openJourneyPanel(page: Page, sectionId: 'servizi') {
  await page.locator(`.story-link[href="#${sectionId}"]`).click()
  const panel = page.locator(`[data-workshop-panel="${sectionId}"]`)
  await expect(panel).toHaveAttribute('aria-hidden', 'false')
  await expect
    .poll(() =>
      panel.evaluate((element) => Math.abs(element.getBoundingClientRect().left)),
    )
    .toBeLessThan(2)
}

const transparentCarouselSelectors = [
  '.home-services > .container',
  '.home-services .premium-carousel',
  '.home-services .premium-carousel__track',
  '.home-services .premium-carousel__slide',
  '.home-gallery > .container',
  '.home-gallery .premium-carousel',
  '.home-gallery .premium-carousel__track',
  '.home-gallery .premium-carousel__slide',
]

test.describe('carousel card visual treatment', () => {
  test('aligns the gallery heading and section rhythm with services', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')

    const metrics = await page.evaluate(() => {
      const readSection = (selector: string) => {
        const section = document.querySelector<HTMLElement>(selector)
        const heading = section?.querySelector<HTMLElement>('.section-heading')
        const title = heading?.querySelector<HTMLElement>('h2')
        const description = heading?.querySelector<HTMLElement>(
          '.section-heading__description',
        )
        if (!section || !heading || !title || !description) return null

        const sectionStyle = getComputedStyle(section)
        const headingStyle = getComputedStyle(heading)
        const titleStyle = getComputedStyle(title)
        const descriptionStyle = getComputedStyle(description)

        return {
          sectionPadding: `${sectionStyle.paddingTop} ${sectionStyle.paddingBottom}`,
          headingBackground: headingStyle.backgroundColor,
          headingBorder: headingStyle.borderWidth,
          headingBoxShadow: headingStyle.boxShadow,
          headingGap: headingStyle.gap,
          headingMaxWidth: headingStyle.maxWidth,
          headingPadding: headingStyle.padding,
          titleFontSize: titleStyle.fontSize,
          titleLineHeight: titleStyle.lineHeight,
          descriptionColor: descriptionStyle.color,
          descriptionLineHeight: descriptionStyle.lineHeight,
          descriptionMaxWidth: descriptionStyle.maxWidth,
        }
      }

      return {
        services: readSection('.home-services'),
        gallery: readSection('.home-gallery'),
      }
    })

    expect(metrics.gallery).not.toBeNull()
    expect(metrics.gallery).toMatchObject({
      headingBackground: 'rgba(0, 0, 0, 0)',
      headingBorder: '0px',
      headingBoxShadow: 'none',
      headingPadding: '0px',
    })
    expect(metrics.gallery?.sectionPadding).toBe(metrics.services?.sectionPadding)
    expect(metrics.gallery?.headingGap).toBe(metrics.services?.headingGap)
    expect(metrics.gallery?.headingMaxWidth).toBe(metrics.services?.headingMaxWidth)
    expect(metrics.gallery?.titleFontSize).toBe(metrics.services?.titleFontSize)
    expect(metrics.gallery?.titleLineHeight).toBe(metrics.services?.titleLineHeight)
    expect(metrics.gallery?.descriptionColor).toBe(metrics.services?.descriptionColor)
    expect(metrics.gallery?.descriptionLineHeight).toBe(
      metrics.services?.descriptionLineHeight,
    )
    expect(metrics.gallery?.descriptionMaxWidth).toBe(
      metrics.services?.descriptionMaxWidth,
    )
  })

  test('keeps technical wrappers transparent and limits the red hover to services', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')

    for (const selector of transparentCarouselSelectors) {
      const element = page.locator(selector).first()
      await expect
        .poll(() =>
          element.evaluate((node) => {
            const style = getComputedStyle(node)
            return {
              background: style.backgroundColor,
              backgroundImage: style.backgroundImage,
              boxShadow: style.boxShadow,
            }
          }),
        )
        .toEqual({
          background: 'rgba(0, 0, 0, 0)',
          backgroundImage: 'none',
          boxShadow: 'none',
        })
    }

    await openJourneyPanel(page, 'servizi')
    const serviceCard = page.locator('.home-services .service-card').first()
    const serviceBody = serviceCard.locator('.service-card__body')
    const serviceImage = serviceCard.locator('img')
    const serviceImageFilter = await serviceImage.evaluate(
      (image) => getComputedStyle(image).filter,
    )

    await serviceCard.hover()
    await expect
      .poll(() => serviceBody.evaluate((body) => getComputedStyle(body).backgroundColor))
      .toBe('rgb(213, 31, 38)')
    for (const selector of [':scope > span', 'h3', 'p', '.card-link']) {
      await expect
        .poll(() =>
          serviceBody
            .locator(selector)
            .evaluate((element) => getComputedStyle(element).color),
        )
        .toBe('rgb(255, 255, 255)')
    }
    await expect(serviceImage).toHaveCSS('filter', serviceImageFilter)
    await expect(serviceCard.locator('.placeholder-image__media')).not.toHaveCSS(
      'background-color',
      'rgb(213, 31, 38)',
    )

    await page.mouse.move(1, 1)
    await expect
      .poll(() => serviceBody.evaluate((body) => getComputedStyle(body).backgroundColor))
      .toBe('rgba(0, 0, 0, 0)')

    await page.locator('.story-link[href="#galleria"]').click()
    const workCard = page.locator('.home-gallery .work-card').first()
    const workBody = workCard.locator('.work-card__body')
    const workImage = workCard.locator('img')
    const workImageFilter = await workImage.evaluate(
      (image) => getComputedStyle(image).filter,
    )

    await workCard.hover()
    await expect
      .poll(() => workBody.evaluate((body) => getComputedStyle(body).backgroundColor))
      .toBe('rgba(0, 0, 0, 0)')
    await expect(workBody.locator('h3')).toHaveCSS('color', 'rgb(23, 24, 25)')
    await expect(workBody.locator('p')).toHaveCSS('color', 'rgb(87, 89, 90)')
    await expect(workCard).toHaveCSS('background-color', 'rgb(250, 249, 246)')
    await expect(workCard).not.toHaveCSS('border-color', 'rgb(213, 31, 38)')
    await expect(workImage).toHaveCSS('filter', workImageFilter)
    await expect(workCard.locator('.placeholder-image__media')).not.toHaveCSS(
      'background-color',
      'rgb(213, 31, 38)',
    )
  })

  test('does not retain the red body treatment after touch input', async ({ browser }) => {
    const context = await browser.newContext({
      hasTouch: true,
      isMobile: true,
      viewport: { width: 390, height: 844 },
    })
    const page = await context.newPage()
    await page.goto('/')

    expect(await page.evaluate(() => matchMedia('(hover: none)').matches)).toBe(true)
    await page.getByRole('button', { name: 'Apri menu' }).click()
    await page.getByRole('link', { name: 'Servizi', exact: true }).click()

    const serviceCard = page.locator('.home-services .service-card').first()
    await serviceCard.tap()
    await expect(serviceCard.locator('.service-card__body')).toHaveCSS(
      'background-color',
      'rgba(0, 0, 0, 0)',
    )

    await page.getByRole('button', { name: 'Apri menu' }).click()
    await page.getByRole('link', { name: 'I nostri lavori', exact: true }).click()
    const workCard = page.locator('.home-gallery .work-card').first()
    await workCard.tap()
    await expect(workCard.locator('.work-card__body')).toHaveCSS(
      'background-color',
      'rgba(0, 0, 0, 0)',
    )

    await context.close()
  })
})
