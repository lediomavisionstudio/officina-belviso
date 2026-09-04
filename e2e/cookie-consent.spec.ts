import { expect, test, type BrowserContext, type Page } from '@playwright/test'

const consentCookieName = 'belviso_cookie_consent'

type ConsentPayload = {
  analytics: boolean
  externalMedia: boolean
  marketing: boolean
  necessary: boolean
  preferences: boolean
  version: string
}

async function clearConsent(context: BrowserContext) {
  await context.clearCookies({ name: consentCookieName })
}

async function readConsent(context: BrowserContext) {
  const cookie = (await context.cookies()).find(
    ({ name }) => name === consentCookieName,
  )
  return cookie
    ? (JSON.parse(decodeURIComponent(cookie.value)) as ConsentPayload)
    : null
}

async function rejectOptional(page: Page) {
  await page
    .getByRole('button', { name: 'Rifiuta non necessari' })
    .first()
    .click()
}

test.describe('privacy-by-default cookie consent', () => {
  test.beforeEach(async ({ context }) => {
    await clearConsent(context)
  })

  test('blocks optional storage and Google Maps before a decision', async ({
    context,
    page,
  }) => {
    const googleRequests: string[] = []
    page.on('request', (request) => {
      if (/google\.com\/maps/i.test(request.url())) {
        googleRequests.push(request.url())
      }
    })

    await page.goto('/')

    await expect(
      page.getByRole('heading', { name: 'La tua privacy, le tue scelte.' }),
    ).toBeVisible()
    await expect(page.locator('.business-map__embed iframe')).toHaveCount(0)
    expect(await readConsent(context)).toBeNull()
    expect(googleRequests).toEqual([])
    expect(
      await page.evaluate(() => ({
        localStorage: localStorage.length,
        sessionStorage: sessionStorage.length,
      })),
    ).toEqual({ localStorage: 0, sessionStorage: 0 })
  })

  test('rejects optional categories, persists the choice, and does not reprompt', async ({
    context,
    page,
  }) => {
    await page.goto('/')
    await rejectOptional(page)

    await expect(page.getByRole('dialog')).toHaveCount(0)
    expect(await readConsent(context)).toMatchObject({
      version: '2',
      necessary: true,
      preferences: false,
      analytics: false,
      marketing: false,
      externalMedia: false,
    })
    await page.reload()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.locator('.business-map__embed iframe')).toHaveCount(0)
  })

  test('invalidates an older consent version and keeps optional media blocked', async ({
    context,
    page,
  }) => {
    await context.addCookies([
      {
        name: consentCookieName,
        value: encodeURIComponent(
          JSON.stringify({
            version: '1',
            necessary: true,
            preferences: true,
            analytics: true,
            marketing: true,
            externalMedia: true,
            consentId: 'stale-consent',
            updatedAt: '2026-01-01T00:00:00.000Z',
          }),
        ),
        domain: '127.0.0.1',
        path: '/',
      },
    ])

    await page.goto('/')

    await expect(
      page.getByRole('heading', { name: 'La tua privacy, le tue scelte.' }),
    ).toBeVisible()
    await expect(page.locator('.business-map__embed iframe')).toHaveCount(0)
  })

  test('uses the compact desktop card and mobile bottom-sheet bounds', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    const dialog = page.getByRole('dialog')
    const desktopBox = await dialog.evaluate((element) => {
      const rect = element.getBoundingClientRect()
      return { height: rect.height, width: rect.width }
    })
    expect(desktopBox.width).toBeLessThanOrEqual(860)
    expect(desktopBox.height).toBeLessThan(720)

    await page.setViewportSize({ width: 390, height: 844 })
    const mobileBox = await dialog.evaluate((element) => {
      const rect = element.getBoundingClientRect()
      return { height: rect.height, width: rect.width }
    })
    expect(mobileBox.width).toBeLessThanOrEqual(366)
    expect(mobileBox.height).toBeLessThanOrEqual(844 * 0.85)
  })

  test('accepts all categories and loads Maps only after consent', async ({
    context,
    page,
  }) => {
    const googleRequests: string[] = []
    page.on('request', (request) => {
      if (/google\.com\/maps/i.test(request.url())) googleRequests.push(request.url())
    })

    await page.goto('/')
    expect(googleRequests).toEqual([])
    await page.getByRole('button', { name: 'Accetta tutti' }).click()

    expect(await readConsent(context)).toMatchObject({
      necessary: true,
      preferences: true,
      analytics: true,
      marketing: true,
      externalMedia: true,
    })
    await expect(page.locator('.business-map__embed iframe')).toHaveCount(1)
    await expect.poll(() => googleRequests.length).toBeGreaterThan(0)
  })

  test('saves granular preferences and revokes external media from the footer', async ({
    context,
    page,
  }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Personalizza' }).click()

    const externalMedia = page
      .locator('.cookie-preferences__item')
      .filter({ hasText: 'Contenuti esterni' })
      .getByRole('checkbox')
    await externalMedia.check()
    await page.getByRole('button', { name: 'Salva preferenze' }).click()

    expect(await readConsent(context)).toMatchObject({
      necessary: true,
      preferences: false,
      analytics: false,
      marketing: false,
      externalMedia: true,
    })
    await expect(page.locator('.business-map__embed iframe')).toHaveCount(1)

    await page.getByRole('button', { name: 'Gestisci cookie' }).click()
    await externalMedia.uncheck()
    await page.getByRole('button', { name: 'Salva preferenze' }).click()

    expect(await readConsent(context)).toMatchObject({ externalMedia: false })
    await expect(page.locator('.business-map__embed iframe')).toHaveCount(0)
  })

  test('treats close and Escape as essential-only on first access', async ({
    context,
    page,
  }) => {
    await page.goto('/')
    await page
      .getByRole('button', {
        name: 'Chiudi e rifiuta i cookie non necessari',
      })
      .click()
    expect(await readConsent(context)).toMatchObject({
      necessary: true,
      analytics: false,
      externalMedia: false,
      marketing: false,
      preferences: false,
    })

    await clearConsent(context)
    await page.reload()
    await page.keyboard.press('Escape')
    expect(await readConsent(context)).toMatchObject({
      necessary: true,
      analytics: false,
      externalMedia: false,
      marketing: false,
      preferences: false,
    })
  })

  test('enables Maps directly from its local placeholder', async ({
    context,
    page,
  }) => {
    await page.goto('/')
    await rejectOptional(page)

    const mapConsent = page.getByRole('button', {
      name: 'Consenti e mostra la mappa',
    })
    await mapConsent.click()

    expect(await readConsent(context)).toMatchObject({
      analytics: false,
      externalMedia: true,
      marketing: false,
      preferences: false,
    })
    await expect(page.locator('.business-map__embed iframe')).toHaveCount(1)
  })

  test('traps and restores keyboard focus in the preferences dialog', async ({
    page,
  }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Personalizza' }).click()

    const dialog = page.getByRole('dialog')
    const close = page.getByRole('button', {
      name: 'Chiudi e rifiuta i cookie non necessari',
    })
    await expect(close).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    expect(
      await dialog.evaluate((element) => element.contains(document.activeElement)),
    ).toBe(true)
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
  })

  for (const viewport of [
    { width: 320, height: 720 },
    { width: 360, height: 800 },
    { width: 390, height: 844 },
    { width: 414, height: 896 },
    { width: 768, height: 1024 },
    { width: 1024, height: 768 },
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 },
  ]) {
    test(`reflows the consent UI at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await page.goto('/')

      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      ).toBe(true)
      await page.getByRole('button', { name: 'Personalizza' }).click()
      await page.getByRole('button', { name: 'Salva preferenze' }).scrollIntoViewIfNeeded()
      await expect(page.getByRole('button', { name: 'Salva preferenze' })).toBeVisible()
    })
  }
})

test.describe('privacy content and career contrast', () => {
  test('keeps every career intro text readable on its light surface', async ({ page }) => {
    await page.goto('/')
    const intro = page.locator('.contact-section--career .contact-section__intro')

    await expect(intro.locator('h2')).toHaveCSS('color', 'rgb(23, 24, 25)')
    await expect(intro.locator('.contact-section__notes h3')).toHaveCSS(
      'color',
      'rgb(23, 24, 25)',
    )
    for (const element of await intro.locator(
      '.contact-section__description p, .contact-section__notes li',
    ).all()) {
      await expect(element).toHaveCSS('color', 'rgb(87, 89, 90)')
    }
    await expect(intro.locator('.eyebrow')).toHaveCSS('color', 'rgb(213, 31, 38)')
  })

  test('renders audit-based cookie policy and an explicit privacy shell', async ({ page }) => {
    await page.goto('/cookie-policy')
    await expect(page.getByRole('heading', { name: 'Cookie Policy', level: 1 })).toBeVisible()
    await expect(page.getByText('Google Maps Embed')).toBeVisible()
    await expect(page.getByText('Pexels Image CDN')).toBeVisible()
    await expect(page.getByText('Nessun sistema analytics è attualmente installato.')).toBeVisible()

    await page.goto('/privacy-policy')
    await expect(page.getByRole('heading', { name: 'Privacy Policy', level: 1 })).toBeVisible()
    await expect(
      page.getByText('Da completare con l’informativa definitiva del titolare.'),
    ).toBeVisible()
  })
})
