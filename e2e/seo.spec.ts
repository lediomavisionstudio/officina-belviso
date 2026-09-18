import { expect, test } from '@playwright/test'

const canonicalOrigin = 'https://officinabelviso.it'
const sitemapUrls = [
  `${canonicalOrigin}/`,
  `${canonicalOrigin}/privacy-policy`,
  `${canonicalOrigin}/cookie-policy`,
]

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
})
