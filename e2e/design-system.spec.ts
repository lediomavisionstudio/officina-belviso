import { expect, test } from '@playwright/test'

test.describe('Design System', () => {
  test('exposes the semantic token contract', async ({ page }) => {
    await page.goto('/')

    const tokens = await page.evaluate(() => {
      const styles = getComputedStyle(document.documentElement)
      const read = (name: string) => styles.getPropertyValue(name).trim()

      return {
        accent: read('--color-accent'),
        background: read('--color-background'),
        border: read('--color-border'),
        error: read('--color-error'),
        info: read('--color-info'),
        primary: read('--color-primary'),
        radiusLarge: read('--radius-large'),
        shadowMedium: read('--shadow-md'),
        spacing24: read('--space-6'),
        success: read('--color-success'),
        textSecondary: read('--color-text-secondary'),
        warning: read('--color-warning'),
      }
    })

    expect(tokens).toEqual({
      accent: '#d51f26',
      background: '#f3f2ee',
      border: 'rgb(23 24 25 / 14%)',
      error: '#b0151b',
      info: '#2567a7',
      primary: '#171819',
      radiusLarge: '24px',
      shadowMedium: '0 12px 34px rgb(0 0 0 / 14%)',
      spacing24: '24px',
      success: '#287a54',
      textSecondary: '#57595a',
      warning: '#9a6500',
    })
  })

  test('uses the shared Button and Card primitives without changing semantics', async ({
    page,
  }) => {
    await page.goto('/')

    const primaryAction = page.getByRole('link', { name: 'Scopri i servizi' })
    const secondaryAction = page
      .locator('.home-hero__actions')
      .getByRole('link', { name: 'Richiedi un preventivo' })
    const submit = page.locator(
      '#richiedi-preventivo form button[type="submit"]',
    )

    await expect(primaryAction).toHaveClass(
      /button button--primary button--medium/,
    )
    await expect(secondaryAction).toHaveClass(/button--secondary button--medium/)
    await expect(submit).toHaveClass(
      /button--primary button--medium contact-form__submit/,
    )
    await expect(page.locator('article.card.carousel-card')).toHaveCount(12)
  })

  test('keeps form controls visually standardized', async ({ page }) => {
    await page.goto('/')

    const form = page.locator('#richiedi-preventivo form')
    const input = form.locator('input[name="firstName"]')
    const select = form.locator('select[name="vehicleBrand"]')
    const textarea = form.locator('textarea[name="problemDescription"]')

    const styles = await Promise.all(
      [input, select, textarea].map((control) =>
        control.evaluate((element) => {
          const computed = getComputedStyle(element)
          return {
            borderRadius: computed.borderRadius,
            borderWidth: computed.borderWidth,
            backgroundColor: computed.backgroundColor,
          }
        }),
      ),
    )

    expect(new Set(styles.map((style) => style.borderRadius))).toEqual(
      new Set(['12px']),
    )
    expect(new Set(styles.map((style) => style.borderWidth))).toEqual(
      new Set(['1px']),
    )
    expect(new Set(styles.map((style) => style.backgroundColor))).toEqual(
      new Set(['rgb(248, 247, 243)']),
    )
  })
})
