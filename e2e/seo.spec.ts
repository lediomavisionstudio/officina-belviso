import { expect, test } from '@playwright/test'

const canonicalOrigin = 'https://officinabelviso.it'
const sitemapUrls = [
  `${canonicalOrigin}/`,
  `${canonicalOrigin}/privacy-policy`,
  `${canonicalOrigin}/cookie-policy`,
]
const localBusinessSelector =
  'script#officina-belviso-local-business-jsonld[type="application/ld+json"]'
const homeTitle =
  'Officina Belviso | Veicoli industriali a Noicattaro (BA)'
const homeDescription =
  "Officina Belviso a Noicattaro (BA): diagnosi, manutenzione e riparazione di veicoli industriali e mezzi pesanti. Scopri i servizi dell'officina."

test.describe('Technical SEO', () => {
  test('serves a minimal canonical sitemap as XML', async ({ request }) => {
    const response = await request.get('/sitemap.xml')

    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toMatch(/^(application|text)\/xml\b/i)

    const xml = await response.text()
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(xml).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"')
    expect([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])).toEqual(
      sitemapUrls,
    )
    expect(xml).not.toMatch(
      /https?:\/\/www\.officinabelviso\.it|workers\.dev|<lastmod>|<changefreq>|<priority>|#|\/api\//,
    )
  })

  test('serves robots.txt as text and advertises the canonical sitemap', async ({ request }) => {
    const response = await request.get('/robots.txt')

    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('text/plain')
    expect(await response.text()).toBe(
      `User-agent: *\nAllow: /\n\nSitemap: ${canonicalOrigin}/sitemap.xml\n`,
    )
  })

  for (const [path, canonical] of [
    ['/', `${canonicalOrigin}/`],
    ['/privacy-policy', `${canonicalOrigin}/privacy-policy`],
    ['/cookie-policy', `${canonicalOrigin}/cookie-policy`],
  ] as const) {
    test(`uses one self-referencing canonical on ${path}`, async ({ page }) => {
      await page.goto(path)

      const canonicalLinks = page.locator('link[rel="canonical"]')
      await expect(canonicalLinks).toHaveCount(1)
      await expect(canonicalLinks).toHaveAttribute('href', canonical)
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
        'content',
        canonical,
      )
      await expect(page.locator('meta[property="og:type"]')).toHaveAttribute(
        'content',
        'website',
      )
      await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute(
        'content',
        'it_IT',
      )
      await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute(
        'content',
        'Officina Belviso',
      )
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
        'content',
        'index, follow',
      )
    })
  }

  test('keeps unfinished and missing routes out of the index and sitemap', async ({ page }) => {
    await page.goto('/servizi')
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex, nofollow',
    )

    await page.goto('/percorso-inesistente')
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex, nofollow',
    )
  })

  test('uses local and service-specific metadata on the home route', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(homeTitle)
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      homeDescription,
    )
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `${canonicalOrigin}/`,
    )
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'index, follow',
    )
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      'content',
      homeTitle,
    )
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
      'content',
      homeDescription,
    )
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      'content',
      `${canonicalOrigin}/`,
    )
    await expect(page.locator(localBusinessSelector)).toHaveCount(1)
  })

  test('publishes one valid AutoRepair JSON-LD block only on the home route', async ({ page }) => {
    await page.goto('/')

    const scripts = page.locator(localBusinessSelector)
    await expect(scripts).toHaveCount(1)
    const structuredData = JSON.parse(await scripts.textContent()) as {
      '@context': string
      '@type': string
      address: Record<string, string>
      name: string
      openingHoursSpecification: Array<{
        '@type': string
        closes: string
        dayOfWeek: string
        opens: string
      }>
      telephone: string
      url: string
    }

    expect(structuredData).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'AutoRepair',
      name: 'Officina Belviso',
      url: 'https://officinabelviso.it/',
      telephone: '080 4783792',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Viale Sindaco Gerardo De Caro 9/11, Zona P.I.P.',
        addressLocality: 'Noicattaro',
        addressRegion: 'BA',
        postalCode: '70016',
        addressCountry: 'IT',
      },
    })
    expect(structuredData.openingHoursSpecification).toEqual([
      ...[
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
      ].flatMap((day) => [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: `https://schema.org/${day}`,
          opens: '08:00',
          closes: '13:00',
        },
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: `https://schema.org/${day}`,
          opens: '15:00',
          closes: '19:00',
        },
      ]),
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'https://schema.org/Saturday',
        opens: '08:00',
        closes: '13:00',
      },
    ])
    expect(JSON.stringify(structuredData)).not.toContain('Sunday')
  })

  test('removes and restores LocalBusiness JSON-LD without duplicates on SPA navigation', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator(localBusinessSelector)).toHaveCount(1)

    await page.evaluate(() => {
      window.history.pushState({}, '', '/privacy-policy')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    await expect(page.locator(localBusinessSelector)).toHaveCount(0)

    await page.evaluate(() => {
      window.history.pushState({}, '', '/cookie-policy')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    await expect(page.locator(localBusinessSelector)).toHaveCount(0)

    await page.evaluate(() => {
      window.history.pushState({}, '', '/')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    await expect(page.locator(localBusinessSelector)).toHaveCount(1)

    await page.evaluate(() => {
      window.history.pushState({}, '', '/percorso-inesistente')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    await expect(page.locator(localBusinessSelector)).toHaveCount(0)
  })
})
