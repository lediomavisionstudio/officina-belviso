import { expect, test, type Page } from '@playwright/test'

const serviceCases = [
  { id: 'brakes', label: 'Impianto frenante', page: 0 },
  { id: 'compressed-air', label: 'Aria compressa', page: 0 },
  { id: 'diagnostics-ebs-abs', label: 'Diagnosi EBS/ABS', page: 0 },
  { id: 'ecas', label: 'Diagnosi ECAS', page: 1 },
  { id: 'suspension', label: 'Sospensioni', page: 1 },
  { id: 'maintenance', label: 'Manutenzione programmata', page: 1 },
] as const

async function openServices(page: Page, mobile = false) {
  await page.goto('/')
  await expect(page.locator('[data-workshop-journey]')).toHaveAttribute(
    'data-workshop-mode',
    /^(desktop|mobile|reduced)$/,
  )
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      }),
  )
  if (mobile) {
    await page.getByRole('button', { name: 'Apri menu' }).click()
  } else {
    await page.getByRole('link', { name: 'Chi siamo', exact: true }).click()
    await expect(
      page.locator('[data-workshop-panel="chi-siamo"]'),
    ).toHaveAttribute('aria-hidden', 'false')
  }
  await page.getByRole('link', { name: 'Servizi', exact: true }).click()
  const panel = page.locator('[data-workshop-panel="servizi"]')
  await expect(panel).toHaveAttribute('aria-hidden', 'false')
  await expect
    .poll(() =>
      panel.evaluate((element) =>
        Math.abs(element.getBoundingClientRect().left),
      ),
    )
    .toBeLessThan(2)
}

async function expectQuoteSelection(
  page: Page,
  service: (typeof serviceCases)[number],
) {
  const quote = page.locator('#richiedi-preventivo')
  const serviceType = quote.locator('select[name="serviceType"]')

  await expect(page).toHaveURL(/#richiedi-preventivo$/)
  await expect(quote).toBeInViewport()
  await expect(serviceType).toHaveValue(service.id)
  await expect(serviceType.locator('option:checked')).toHaveText(service.label)
  await expect(
    page.locator('.story-link[href="#richiedi-preventivo"]'),
  ).toHaveAttribute('aria-current', 'location')
}

test.describe('Service quote requests', () => {
  test('navigates and preselects every service, including later carousel pages', async ({
    page,
  }) => {
    test.setTimeout(90_000)
    await page.setViewportSize({ width: 1440, height: 900 })

    for (const [index, service] of serviceCases.entries()) {
      await test.step(service.id, async () => {
        await openServices(page)
        const carousel = page.getByRole('region', {
          name: 'Servizi Officina Belviso',
        })

        for (let currentPage = 0; currentPage < service.page; currentPage += 1) {
          await carousel
            .getByRole('button', { name: 'Servizio successivo' })
            .click({ force: true })
        }

        const card = carousel.locator(`[data-service-id="${service.id}"]`)
        await expect(card).toBeInViewport()
        const quoteLink = card.getByRole('link', { name: 'Richiedi preventivo' })

        if (index === 0) {
          await quoteLink.focus()
          await expect(quoteLink).toBeFocused()
          await page.keyboard.press('Enter')
        } else {
          await quoteLink.click()
        }

        await expectQuoteSelection(page, service)
      })
    }
  })

  test('keeps the choice editable and navbar access does not force a service', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    const navigation = page.getByRole('navigation', {
      name: 'Navigazione principale',
    })
    await navigation
      .getByRole('link', { name: 'Descrivi problema', exact: true })
      .click()

    const serviceType = page
      .locator('#richiedi-preventivo')
      .locator('select[name="serviceType"]')
    await expect(serviceType).toHaveValue('')
    await serviceType.selectOption('diagnostics-ebs-abs')
    await expect(serviceType).toHaveValue('diagnostics-ebs-abs')

    await navigation.getByRole('link', { name: 'Servizi', exact: true }).click()
    await navigation
      .getByRole('link', { name: 'Descrivi problema', exact: true })
      .click()
    await expect(serviceType).toHaveValue('diagnostics-ebs-abs')
  })

  test('works with the mobile Journey without sticky or vertical misalignment', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await openServices(page, true)

    const carousel = page.getByRole('region', {
      name: 'Servizi Officina Belviso',
    })
    await carousel
      .getByRole('button', { name: 'Servizio successivo' })
      .click({ force: true })
    await carousel
      .getByRole('button', { name: 'Servizio successivo' })
      .click({ force: true })
    const service = serviceCases[2]
    const card = carousel.locator(`[data-service-id="${service.id}"]`)
    await expect(card).toBeInViewport()
    await card.getByRole('link', { name: 'Richiedi preventivo' }).click()

    await expectQuoteSelection(page, service)
    expect(
      await page.evaluate(() =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
      ),
    ).toBe(0)
  })

  test('works with the tablet Journey and later carousel pages', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 820, height: 1180 })
    await openServices(page, true)

    const carousel = page.getByRole('region', {
      name: 'Servizi Officina Belviso',
    })
    await carousel
      .getByRole('button', { name: 'Servizio successivo' })
      .click({ force: true })
    const service = serviceCases[2]
    const card = carousel.locator(`[data-service-id="${service.id}"]`)
    await expect(card).toBeInViewport()
    await card.getByRole('link', { name: 'Richiedi preventivo' }).click()

    await expectQuoteSelection(page, service)
  })

  test('uses the same navigation in the reduced-motion vertical fallback', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize({ width: 1440, height: 900 })
    await openServices(page)

    const service = serviceCases[0]
    await page
      .locator(`[data-service-id="${service.id}"]`)
      .getByRole('link', { name: 'Richiedi preventivo' })
      .click()

    await expectQuoteSelection(page, service)
  })
})
