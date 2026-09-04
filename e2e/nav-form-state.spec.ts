import { expect, test, type Page } from '@playwright/test'

const primaryText = 'rgb(23, 24, 25)'
const secondaryText = 'rgb(87, 89, 90)'
const placeholderText = secondaryText

async function expectActiveSection(page: Page, sectionId: string) {
  await expect
    .poll(() =>
      page
        .locator('.story-link[aria-current="location"]')
        .getAttribute('data-section-id'),
    )
    .toBe(sectionId)
}

async function scrollSectionPointToActiveLine(
  page: Page,
  selector: string,
  point: 'top' | 'middle' | 'bottom',
  inset = 0,
) {
  await page.locator(selector).evaluate((section, options) => {
    const bounds = section.getBoundingClientRect()
    const documentTop = bounds.top + scrollY
    const sectionPoint =
      options.point === 'top'
        ? documentTop
        : options.point === 'middle'
          ? documentTop + bounds.height / 2
          : documentTop + bounds.height
    const scrollPaddingTop =
      Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0
    const activeLine = Math.max(scrollPaddingTop + 1, innerHeight * 0.4)

    window.scrollTo({
      behavior: 'instant',
      top: Math.max(0, sectionPoint + options.inset - activeLine),
    })
  }, { inset, point })
}

test.describe('navbar active state and contact form contrast', () => {
  for (const viewport of [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'tablet', width: 820, height: 1000 },
    { name: 'mobile', width: 390, height: 844 },
  ]) {
    test(`keeps the active section on the stable viewport line at ${viewport.name}`, async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.setViewportSize(viewport)
      await page.goto('/')

      for (const [selector, point, inset] of [
        ['#richiedi-preventivo', 'top', 8],
        ['#richiedi-preventivo', 'middle', 0],
        ['#richiedi-preventivo', 'bottom', -24],
        ['#lavora-con-noi', 'top', -2],
      ] as const) {
        await scrollSectionPointToActiveLine(page, selector, point, inset)
        await expectActiveSection(page, 'richiedi-preventivo')
      }

      await scrollSectionPointToActiveLine(page, '#lavora-con-noi', 'top', 2)
      await expectActiveSection(page, 'lavora-con-noi')

      await scrollSectionPointToActiveLine(page, '#lavora-con-noi', 'top', -2)
      await expectActiveSection(page, 'richiedi-preventivo')
    })
  }

  test('keeps a navbar click active throughout the long quote section', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')

    await page.evaluate(() => {
      const history: string[] = []
      const navigation = document.querySelector('.story-nav')
      if (!navigation) throw new Error('Story navigation is missing')

      const recordActiveSection = () => {
        const active = navigation.querySelector<HTMLElement>(
          '.story-link[aria-current="location"]',
        )
        if (active?.dataset.sectionId) history.push(active.dataset.sectionId)
      }

      recordActiveSection()
      const observer = new MutationObserver(recordActiveSection)
      observer.observe(navigation, {
        attributeFilter: ['aria-current'],
        attributes: true,
        subtree: true,
      })
      Object.assign(window, { __activeSectionHistory: history, __activeSectionObserver: observer })
    })

    await page.locator('.story-link[href="#richiedi-preventivo"]').click()
    await expectActiveSection(page, 'richiedi-preventivo')
    await page.waitForTimeout(900)
    await expectActiveSection(page, 'richiedi-preventivo')
    expect(
      await page.evaluate(() => {
        const state = window as typeof window & {
          __activeSectionHistory?: string[]
          __activeSectionObserver?: MutationObserver
        }
        state.__activeSectionObserver?.disconnect()
        return state.__activeSectionHistory?.slice(1) ?? []
      }),
    ).not.toContain('lavora-con-noi')
  })

  test('keeps Servizi active at the Workshop Journey exit boundary', async ({
    page,
  }) => {
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

    await page.locator('[data-workshop-journey]').evaluate((journey) => {
      const journeyEnd =
        (journey as HTMLElement).offsetTop +
        (journey as HTMLElement).offsetHeight -
        innerHeight
      window.scrollTo({ behavior: 'instant', top: journeyEnd + 4 })
    })

    await expect
      .poll(() =>
        page.evaluate(() => {
          const panel = document.querySelector<HTMLElement>(
            '[data-workshop-panel="servizi"]',
          )
          if (!panel) return false
          const bounds = panel.getBoundingClientRect()
          const activeLine = innerWidth * 0.4
          return bounds.left <= activeLine && bounds.right > activeLine
        }),
      )
      .toBe(true)
    await expectActiveSection(page, 'servizi')
  })

  for (const viewport of [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'mobile', width: 390, height: 844 },
  ]) {
    test(`keeps both light forms readable at ${viewport.name}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.setViewportSize(viewport)
      await page.goto('/')

      for (const formName of [
        'Modulo per richiedere un preventivo',
        'Modulo per inviare una candidatura',
      ]) {
        const form = page.getByRole('form', { name: formName })
        const colors = await form.evaluate((element) => {
          const readColors = (selector: string) =>
            Array.from(element.querySelectorAll<HTMLElement>(selector)).map(
              (target) => ({
                color: getComputedStyle(target).color,
                element: `${target.tagName.toLowerCase()}.${target.className}`,
                text: target.textContent?.trim().slice(0, 60) ?? '',
              }),
            )

          const textControl = element.querySelector<HTMLInputElement | HTMLTextAreaElement>(
            'input[placeholder], textarea[placeholder]',
          )

          return {
            background: getComputedStyle(element).backgroundColor,
            main: readColors(
              'fieldset > legend, .form-field > label, .form-radio-group__options label, .form-checkbox label > span, .form-upload__label, input:not([type="radio"]):not([type="checkbox"]), textarea, .form-upload__placeholder > span',
            ),
            optionBackgrounds: Array.from(
              element.querySelectorAll<HTMLOptionElement>('option:not([value=""])'),
            ).map((option) => getComputedStyle(option).backgroundColor),
            options: readColors('option:not([value=""])'),
            placeholder: textControl
              ? getComputedStyle(textControl, '::placeholder').color
              : null,
            secondary: readColors(
              '.form-field__help, .form-upload__placeholder p, .contact-form__status',
            ),
          }
        })

        expect(colors.background).toBe('rgb(255, 255, 255)')
        expect(colors.main.length).toBeGreaterThan(0)
        expect(colors.main.filter(({ color }) => color !== primaryText)).toEqual([])
        expect(colors.options.filter(({ color }) => color !== primaryText)).toEqual([])
        expect(
          colors.optionBackgrounds.every(
            (color) => color === 'rgb(255, 255, 255)',
          ),
        ).toBe(true)
        if (colors.placeholder !== null) {
          expect(colors.placeholder).toBe(placeholderText)
        }
        expect(
          colors.secondary.filter(
            ({ color }) => color !== secondaryText && color !== 'rgba(0, 0, 0, 0)',
          ),
        ).toEqual([])

        const firstName = form.locator('[name="firstName"]')
        await firstName.focus()
        await firstName.fill('Mario')
        await expect(firstName).toHaveCSS('color', primaryText)
        await expect(form.locator('.form-checkbox label > span')).toHaveCSS(
          'color',
          primaryText,
        )
      }

      const quoteForm = page.getByRole('form', {
        name: 'Modulo per richiedere un preventivo',
      })
      const vehicleBrand = quoteForm.locator('[name="vehicleBrand"]')
      await expect(vehicleBrand).toHaveCSS('color', placeholderText)
      await vehicleBrand.selectOption('Volvo')
      await expect(vehicleBrand).toHaveCSS('color', primaryText)
      await expect(quoteForm.getByText('Sì', { exact: true })).toHaveCSS(
        'color',
        primaryText,
      )
      await expect(quoteForm.getByText('No', { exact: true })).toHaveCSS(
        'color',
        primaryText,
      )
    })
  }

  test('keeps errors red and defines readable Chrome autofill text', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')

    const quoteForm = page.getByRole('form', {
      name: 'Modulo per richiedere un preventivo',
    })
    await quoteForm.getByRole('button', { name: 'Conferma invio' }).click()
    await expect(quoteForm.locator('.form-field__error').first()).toHaveCSS(
      'color',
      'rgb(176, 21, 27)',
    )

    expect(
      await page.evaluate(() =>
        Array.from(document.styleSheets).some((sheet) =>
          Array.from(sheet.cssRules).some(
            (rule) =>
              rule.cssText.includes(':-webkit-autofill') &&
              rule.cssText.includes('-webkit-text-fill-color: var(--ink)'),
          ),
        ),
      ),
    ).toBe(true)
  })
})
