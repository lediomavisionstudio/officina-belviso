import { expect, test, type Page } from '@playwright/test'

const sectionIds = [
  'chi-siamo',
  'servizi',
  'galleria',
  'richiedi-preventivo',
  'lavora-con-noi',
] as const

async function navigateToSection(page: Page, sectionId: (typeof sectionIds)[number]) {
  const menuToggle = page.locator('.menu-toggle')
  if (await menuToggle.isVisible()) await menuToggle.click()

  await page.locator(`.story-link[data-section-id="${sectionId}"]`).click()
  await expect(page).toHaveURL(new RegExp(`#${sectionId}$`))
  await expect(
    page.locator(`.story-link[data-section-id="${sectionId}"]`),
  ).toHaveAttribute('aria-current', 'location')
}

for (const viewport of [
  { height: 900, maxTop: 130, minTop: 90, name: 'desktop', width: 1440 },
  { height: 1000, maxTop: 110, minTop: 80, name: 'tablet', width: 820 },
  { height: 844, maxTop: 90, minTop: 70, name: 'mobile', width: 390 },
]) {
  test(`aligns every navigation entry in the upper viewport on ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await page.goto('/')

    for (const sectionId of sectionIds) {
      await navigateToSection(page, sectionId)

      await expect
        .poll(async () =>
          page.locator(`#${sectionId}`).evaluate((section) => {
            const entry = section.querySelector(':scope > .container') ?? section
            return entry.getBoundingClientRect().top
          }),
        )
        .toBeGreaterThanOrEqual(viewport.minTop)
      await expect
        .poll(async () =>
          page.locator(`#${sectionId}`).evaluate((section) => {
            const entry = section.querySelector(':scope > .container') ?? section
            return entry.getBoundingClientRect().top
          }),
        )
        .toBeLessThanOrEqual(viewport.maxTop)
    }

    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      ),
    ).toBe(false)
  })
}
