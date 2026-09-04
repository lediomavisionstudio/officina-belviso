import { expect, test } from '@playwright/test'

const futureRoutes = [
  ['/chi-siamo', 'Chi siamo'],
  ['/servizi', 'Servizi'],
  ['/lavori', 'Lavori'],
  ['/preventivo', 'Preventivo'],
  ['/lavora-con-noi', 'Lavora con noi'],
  ['/contatti', 'Contatti'],
  ['/privacy-policy', 'Privacy policy'],
  ['/cookie-policy', 'Cookie policy'],
  ['/404', 'Pagina non trovata'],
] as const

test.describe('Project architecture', () => {
  for (const [path, title] of futureRoutes) {
    test(`renders ${path} inside the shared layout`, async ({ page }) => {
      await page.goto(path)

      await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible()
      await expect(page.getByRole('navigation', { name: 'Navigazione principale' })).toBeVisible()
      await expect(page.getByRole('contentinfo')).toBeVisible()
      await expect(page.locator('main#main-content')).toHaveCount(1)
      await expect(page).toHaveTitle(new RegExp(`${title} \\| Officina Belviso`, 'i'))

      const homeLink = page
        .getByRole('navigation', { name: 'Navigazione principale' })
        .getByRole('link', { name: 'Home' })
      await expect(homeLink).toHaveAttribute('href', '/#home')
    })
  }

  test('keeps the existing Home navigation and structure unchanged', async ({ page }) => {
    await page.goto('/')

    const links = await page
      .getByRole('navigation', { name: 'Navigazione principale' })
      .getByRole('link')
      .evaluateAll((elements) =>
        elements.map((element) => element.getAttribute('href')),
      )

    expect(links).toEqual([
      '#home',
      '#chi-siamo',
      '#servizi',
      '#galleria',
      '#richiedi-preventivo',
      '#lavora-con-noi',
    ])
    await expect(page.locator('main section[id]')).toHaveCount(6)
    await expect(page.locator('[data-premium-carousel]')).toHaveCount(2)
    await expect(page.locator('[data-image-placeholder]')).toHaveCount(6)
    await expect(page.locator('[data-placeholder-photo]')).toHaveCount(15)
  })

  test('updates route content and SEO on History API navigation', async ({ page }) => {
    await page.goto('/chi-siamo')

    await page.evaluate(() => {
      window.history.pushState({}, '', '/servizi')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })

    await expect(page.getByRole('heading', { level: 1, name: 'Servizi' })).toBeVisible()
    await expect(page).toHaveTitle('Servizi | Officina Belviso')
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      'content',
      'Servizi | Officina Belviso',
    )
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      'content',
      'summary',
    )
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex, nofollow',
    )
  })

  test('uses the 404 route for unknown paths without indexable metadata', async ({
    page,
  }) => {
    await page.goto('/percorso-inesistente')

    await expect(
      page.getByRole('heading', { level: 1, name: 'Pagina non trovata' }),
    ).toBeVisible()
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex, nofollow',
    )
  })
})
