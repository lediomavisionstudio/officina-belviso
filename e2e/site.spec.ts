import { expect, test, type Page } from '@playwright/test'

async function openJourneyPanel(
  page: Page,
  sectionId: 'home' | 'chi-siamo' | 'servizi',
) {
  const menuToggle = page.getByRole('button', { name: 'Apri menu' })
  if (await menuToggle.isVisible()) await menuToggle.click()

  await page.locator(`.story-link[href="#${sectionId}"]`).click()
  const panel = page.locator(`[data-workshop-panel="${sectionId}"]`)
  await expect(panel).toHaveAttribute('aria-hidden', 'false')
  await expect
    .poll(() =>
      panel.evaluate((element) =>
        Math.abs(element.getBoundingClientRect().left),
      ),
    )
    .toBeLessThan(2)
}

const widths = [
  320, 360, 375, 390, 414, 480, 576, 768, 820, 1024, 1280, 1440, 1920,
  2560,
]
const navigation = [
  ['Home', '#home'],
  ['Chi siamo', '#chi-siamo'],
  ['Servizi', '#servizi'],
  ['I nostri lavori', '#galleria'],
  ['Descrivi problema', '#richiedi-preventivo'],
  ['Lavora con noi', '#lavora-con-noi'],
]

test.describe('Home V2', () => {
  test('exposes delivery-ready metadata and a keyboard skip link', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('html')).toHaveAttribute('lang', 'it')
    await expect(page).toHaveTitle('Officina Belviso | Assistenza veicoli industriali')
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      /diagnosi, manutenzione e riparazione/i,
    )
    await expect(page.locator('link[rel="icon"]')).toHaveAttribute(
      'href',
      '/assets/logo-officina-belviso-ufficiale.png',
    )

    await page.keyboard.press('Tab')
    const skipLink = page.getByRole('link', { name: 'Salta al contenuto principale' })
    await expect(skipLink).toBeFocused()
    expect((await skipLink.boundingBox())?.y).toBeGreaterThanOrEqual(0)
    await skipLink.press('Enter')
    await expect(page.locator('#main-content')).toBeFocused()
  })

  test('has valid internal targets, unique ids, and no forgotten text placeholders', async ({
    page,
  }) => {
    await page.goto('/')

    const integrity = await page.evaluate(() => {
      const ids = Array.from(document.querySelectorAll<HTMLElement>('[id]')).map(
        (element) => element.id,
      )
      const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index)
      const brokenTargets = Array.from(
        document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'),
      )
        .map((anchor) => anchor.hash.slice(1))
        .filter((id) => id && !document.getElementById(id))
      const emptyActions = Array.from(
        document.querySelectorAll<HTMLElement>('a[href], button'),
      ).filter(
        (element) =>
          !element.textContent?.trim() &&
          !element.getAttribute('aria-label') &&
          !element.getAttribute('aria-labelledby'),
      )

      return {
        brokenTargets,
        duplicateIds: [...new Set(duplicateIds)],
        emptyActions: emptyActions.length,
        forgottenCopy: /lorem ipsum|website title|website description placeholder/i.test(
          document.documentElement.textContent ?? '',
        ),
      }
    })

    expect(integrity).toEqual({
      brokenTargets: [],
      duplicateIds: [],
      emptyActions: 0,
      forgottenCopy: false,
    })
    await expect(page.locator('[data-image-placeholder]')).toHaveCount(0)
    await expect(page.locator('[data-placeholder-photo]')).toHaveCount(18)
  })

  test('renders the complete editorial structure without the Truck experience', async ({ page }) => {
    await page.goto('/')

    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Competenza tecnica per i veicoli industriali.',
      }),
    ).toBeVisible()
    await expect(page.locator('canvas')).toHaveCount(0)
    await expect(page.locator('[data-truck-sequence]')).toHaveCount(0)
    await expect(page.locator('.truck-explorer')).toHaveCount(0)
    await expect(page.locator('.home-stats')).toHaveCount(0)
    await expect(page.locator('[data-premium-carousel]')).toHaveCount(2)
    await expect(page.locator('main > .home-brands')).toHaveCount(0)
    await expect(
      page.locator('#galleria [data-premium-carousel] + .home-gallery__brands'),
    ).toHaveCount(1)
    await expect(page.locator('[data-image-placeholder]')).toHaveCount(0)
    await expect(page.locator('[data-placeholder-photo]')).toHaveCount(18)
    await expect(page.locator('#perche-sceglierci')).toHaveCount(0)
    await expect(page.locator('main section[id]')).toHaveCount(6)
    expect(
      await page.locator('main section[id]').evaluateAll((sections) =>
        sections.map((section) => section.id),
      ),
    ).toEqual([
      'home',
      'chi-siamo',
      'servizi',
      'galleria',
      'richiedi-preventivo',
      'lavora-con-noi',
    ])
  })

  test('keeps every image slot stable and ready for future client media', async ({ page }) => {
    await page.goto('/')

    const slots = page.locator('.placeholder-image__media')
    await expect(slots).toHaveCount(21)
    await expect(
      page.locator('.home-hero [data-placeholder-photo]'),
    ).toHaveAttribute('loading', 'eager')
    await expect(
      page.locator('[data-placeholder-photo][loading="lazy"]'),
    ).toHaveCount(14)
    expect(
      await slots.evaluateAll((items) =>
        items.every((item) => {
          const bounds = item.getBoundingClientRect()
          return bounds.width > 0 && bounds.height > 0
        }),
      ),
    ).toBe(true)
  })

  test('renders the premium footer with business information and clickable contact details', async ({ page }) => {
    await page.goto('/')

    const footer = page.getByRole('contentinfo')
    await expect(footer.getByRole('img', { name: 'Officina Belviso' })).toBeVisible()
    await expect(footer.getByRole('heading', { name: 'Dati aziendali' })).toBeVisible()
    await expect(footer.getByRole('navigation', { name: 'Navigazione' })).toHaveCount(0)
    await expect(footer).toContainText('033776520726')
    await expect(footer).toContainText('KRRH6B9')
    await expect(footer.getByRole('link', { name: 'Invia una PEC a belviso.snc@pec.it' })).toHaveAttribute('href', 'mailto:belviso.snc@pec.it')
    await expect(footer.getByText('Viale Sindaco Gerardo De Caro 9-11')).toBeVisible()
    await expect(footer.getByRole('link', { name: 'Chiama Officina Belviso al numero 080 4783792' })).toHaveAttribute('href', 'tel:0804783792')
    await expect(footer.getByRole('link', { name: "Invia un'email a belviso.snc@virgilio.it" })).toHaveAttribute('href', 'mailto:belviso.snc@virgilio.it')
    await expect(footer.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy-policy')
    await expect(footer.getByRole('link', { name: 'Cookie Policy' })).toHaveAttribute('href', '/cookie-policy')
    await expect(footer.getByText('Termini di utilizzo')).toHaveAttribute('aria-disabled', 'true')
    await expect(footer.getByText('Mappa del sito')).toHaveAttribute('aria-disabled', 'true')
    await expect(footer.locator('.site-footer__social-placeholder')).toHaveCount(4)
    await expect(footer.getByRole('link', { name: 'Ledioma Vision Studio' })).toHaveAttribute('href', 'https://ledioma.it')
    await expect(footer).toContainText('Tutti i diritti riservati.')
  })

  for (const [width, expectedColumns] of [
    [1920, 4],
    [1280, 4],
    [1024, 2],
    [768, 2],
    [390, 1],
  ] as const) {
    test(`uses ${expectedColumns} premium footer column(s) at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/')

      const footerGrid = page.locator('.site-footer__grid')
      expect(
        await footerGrid.evaluate(
          (element) => getComputedStyle(element).gridTemplateColumns.split(' ').length,
        ),
      ).toBe(expectedColumns)
    })
  }

  test('preserves the official logo and section navigation', async ({ page }) => {
    await page.goto('/')

    await expect(
      page.getByRole('img', { name: 'Officina Belviso', exact: true }),
    ).toHaveCount(2)

    const headerNavigation = page.getByRole('navigation', {
      name: 'Navigazione principale',
    })
    await expect(headerNavigation.getByRole('link', { name: 'Marchi' })).toHaveCount(0)
    await expect(
      headerNavigation.getByRole('link', { name: /Perch.+sceglierci/i }),
    ).toHaveCount(0)
    for (const [label, href] of navigation) {
      await expect(headerNavigation.getByRole('link', { name: label })).toHaveAttribute(
        'href',
        href,
      )
    }

    const servicesLink = headerNavigation.getByRole('link', { name: 'Servizi' })
    await servicesLink.click()
    await expect(page).toHaveURL(/#servizi$/)
    await expect(servicesLink).toHaveAttribute('aria-current', 'location')
  })

  test('renders the two modes of the shared contact form and updates every contact anchor', async ({
    page,
  }) => {
    await page.goto('/')

    await expect(
      page.locator('form[aria-label="Modulo per richiedere un preventivo"]'),
    ).toBeAttached()
    await expect(
      page.locator('form[aria-label="Modulo per inviare una candidatura"]'),
    ).toBeAttached()
    await expect(
      page.locator('#richiedi-preventivo-title'),
    ).toBeAttached()
    await expect(
      page.locator('#lavora-con-noi-title'),
    ).toBeAttached()
    await expect(page.locator('.form-upload')).toHaveCount(2)
    await expect(page.locator('input[type="file"]')).toHaveCount(0)
    await expect(page.locator('a[href="#contatti"]')).toHaveCount(0)
    expect(await page.locator('a[href="#richiedi-preventivo"]').count()).toBeGreaterThan(0)
  })

  test('presents workshop details, Google review controls, and the Maps handoff beside the unchanged quote form', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('html')).not.toHaveClass(/intro-running/, {
      timeout: 8000,
    })

    const section = page.locator('#richiedi-preventivo')
    await section.scrollIntoViewIfNeeded()
    await expect(section.locator('.business-card')).toHaveCount(1)
    await expect(page.locator('#lavora-con-noi .business-card')).toHaveCount(0)
    await expect(section.getByText('Officina Belviso S.N.C.')).toHaveCount(0)
    await expect(section.getByText('Viale Sindaco Gerardo De Caro 9-11')).toHaveCount(0)
    await expect(section.getByText('70016 Noicattaro (BA)')).toHaveCount(0)
    const addressMap = section.locator('.business-card__detail--address iframe')
    await expect(addressMap).toHaveCount(1)
    await expect(addressMap).toHaveAttribute('title', 'Mappa di Officina Belviso')
    await expect(addressMap).toHaveAttribute('loading', 'eager')
    await expect(addressMap).toHaveAttribute('src', /google\.com\/maps.*output=embed/)
    await expect(section.getByRole('link', { name: '080 4783792' })).toHaveAttribute(
      'href',
      'tel:0804783792',
    )
    const workshopHours = section.locator(
      '.business-card__detail--hours .site-footer__hours',
    )
    const footerHours = page.locator('.site-footer .site-footer__hours')
    await expect(workshopHours.locator('dl > div')).toHaveCount(3)
    await expect(workshopHours.locator('dl > div').nth(0)).toContainText(
      'Lun–Ven08:00 - 13:00 • 15:00 - 19:00',
    )
    await expect(workshopHours.locator('dl > div').nth(1)).toContainText(
      'Sabato08:00 - 13:00',
    )
    await expect(workshopHours.locator('dl > div').nth(2)).toContainText(
      'DomenicaChiuso',
    )
    const readHoursStyles = (element: HTMLElement) => {
      const styles = getComputedStyle(element)
      const term = element.querySelector<HTMLElement>('dt')
      const value = element.querySelector<HTMLElement>('dd')
      return {
        color: styles.color,
        fontSize: styles.fontSize,
        lineHeight: styles.lineHeight,
        termColor: term ? getComputedStyle(term).color : '',
        valueColor: value ? getComputedStyle(value).color : '',
      }
    }
    expect(await workshopHours.evaluate(readHoursStyles)).toEqual(
      await footerHours.evaluate(readHoursStyles),
    )
    const hoursToReviewsGap = await section.evaluate((element) => {
      const hours = element.querySelector<HTMLElement>(
        '.business-card__detail--hours',
      )
      const reviews = element.querySelector<HTMLElement>('.google-reviews')
      if (!hours || !reviews) return Number.POSITIVE_INFINITY
      return reviews.getBoundingClientRect().top - hours.getBoundingClientRect().bottom
    })
    expect(hoursToReviewsGap).toBeLessThanOrEqual(32)
    await expect(section.getByText('4,9 / 5')).toBeVisible()
    await expect(section.getByText('Basato su 29 recensioni Google')).toBeVisible()

    const nextReview = section.getByRole('button', { name: 'Recensione successiva' })
    await nextReview.click()
    await expect(section.getByText(/Seconda recensione dimostrativa/)).toBeVisible()

    await expect(section.getByRole('button', { name: 'Leggi tutte le recensioni' })).toBeDisabled()
    await expect(section.getByRole('button', { name: 'Scrivi una recensione' })).toBeDisabled()
    const mapsLink = section.getByRole('link', { name: 'Apri in Maps' })
    await expect(mapsLink).toHaveAttribute(
      'href',
      /google\.com\/maps/,
    )
    await expect(mapsLink).toHaveAttribute('target', '_blank')
    await expect(mapsLink).toHaveAttribute('rel', 'noreferrer')
    await expect(section.locator('.business-map__placeholder')).toHaveCount(0)
    await expect(
      section.locator('form[aria-label="Modulo per richiedere un preventivo"]'),
    ).toBeAttached()
  })

  test('validates quote and career fields without sending data', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('html')).not.toHaveClass(/intro-running/, {
      timeout: 8000,
    })

    await page.locator('#richiedi-preventivo').scrollIntoViewIfNeeded()
    const quote = page.locator(
      'form[aria-label="Modulo per richiedere un preventivo"]',
    )
    await expect(quote).toBeVisible()
    await quote.getByRole('button', { name: 'Conferma invio' }).click()
    await expect(quote.locator('[name="firstName"]')).toBeFocused()
    await expect(quote.getByRole('alert')).toContainText('Controlla i campi')

    await quote.locator('[name="firstName"]').fill('Mario')
    await quote.locator('[name="lastName"]').fill('Rossi')
    await quote.locator('[name="email"]').fill('email non valida')
    await quote.locator('[name="phone"]').fill('abc')
    await quote.locator('[name="vehicleBrand"]').selectOption('Volvo')
    await quote.locator('[name="vehicleModel"]').fill('FH')
    await quote.locator('[name="registrationYear"]').fill('9999')
    await quote.locator('[name="vehicleRunning"][value="yes"]').check()
    await quote
      .locator('[name="serviceType"]')
      .selectOption('Impianto frenante')
    await quote
      .locator('[name="problemDescription"]')
      .fill('Descrizione di prova del problema.')
    await quote.locator('[name="privacy"]').check()
    await quote.getByRole('button', { name: 'Conferma invio' }).click()
    await expect(quote.getByText('Inserisci un indirizzo email valido.')).toBeVisible()
    await expect(quote.getByText('Inserisci un numero di telefono valido.')).toBeVisible()
    await expect(quote.getByText(/Inserisci un anno compreso tra 1900 e/)).toBeVisible()

    await quote.locator('[name="email"]').fill('mario@example.com')
    await quote.locator('[name="phone"]').fill('+39 012 345 6789')
    await quote
      .locator('[name="registrationYear"]')
      .fill(String(new Date().getFullYear()))
    await quote.getByRole('button', { name: 'Conferma invio' }).click()
    await expect(quote.getByRole('status')).toContainText('servizio verrà attivato')

    await page.locator('#lavora-con-noi').scrollIntoViewIfNeeded()
    const career = page.locator(
      'form[aria-label="Modulo per inviare una candidatura"]',
    )
    await expect(career).toBeVisible()
    await career.locator('[name="firstName"]').fill('Anna')
    await career.locator('[name="lastName"]').fill('Verdi')
    await career.locator('[name="email"]').fill('anna@example.com')
    await career.locator('[name="phone"]').fill('0123456789')
    await career.locator('[name="privacy"]').check()
    await career.getByRole('button', { name: 'Invia candidatura' }).click()
    await expect(career.getByRole('status')).toContainText('servizio verrà attivato')
  })

  for (const [width, expectedColumns] of [
    [2560, 2],
    [1440, 2],
    [1024, 2],
    [820, 1],
    [768, 1],
    [576, 1],
    [390, 1],
  ] as const) {
    test(`uses ${expectedColumns} contact section column(s) at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/')

      const layout = page.locator('#richiedi-preventivo .contact-section__layout')
      expect(
        await layout.evaluate(
          (element) => getComputedStyle(element).gridTemplateColumns.split(' ').length,
        ),
      ).toBe(expectedColumns)

      const mapEmbed = page.locator(
        '#richiedi-preventivo .business-card__detail--address .business-map__embed',
      )
      const mapDimensions = await mapEmbed.evaluate((element) => {
        const frame = element.querySelector('iframe')
        const container = element.getBoundingClientRect()
        const iframe = frame?.getBoundingClientRect()
        return {
          height: container.height,
          width: container.width,
          iframeHeight: iframe?.height ?? 0,
          iframeWidth: iframe?.width ?? 0,
        }
      })
      expect(mapDimensions.height).toBeGreaterThanOrEqual(220)
      expect(mapDimensions.height).toBeLessThanOrEqual(260)
      expect(Math.abs(mapDimensions.iframeHeight - mapDimensions.height)).toBeLessThan(1)
      expect(Math.abs(mapDimensions.iframeWidth - mapDimensions.width)).toBeLessThan(1)
    })
  }

  for (const [width, expectedColumns] of [
    [2560, 3],
    [1440, 3],
    [1024, 3],
    [820, 3],
    [768, 3],
    [576, 1],
    [390, 1],
  ] as const) {
    test(`integrates brands in ${expectedColumns} column(s) at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/')

      const brands = page.locator('#galleria .brands-grid')
      await expect(brands).toBeAttached()
      await expect(brands.locator('.brand-slot')).toHaveCount(3)
      await expect(brands.getByText('Marchio assistito', { exact: true })).toHaveCount(0)
      expect(
        await brands.evaluate(
          (element) => getComputedStyle(element).gridTemplateColumns.split(' ').length,
        ),
      ).toBe(expectedColumns)
    })
  }

  test('connects Chi siamo to the dedicated responsive section', async ({ page }) => {
    await page.goto('/')

    const headerNavigation = page.getByRole('navigation', {
      name: 'Navigazione principale',
    })
    const aboutLink = headerNavigation.getByRole('link', { name: 'Chi siamo' })
    await aboutLink.click()

    await expect(page).toHaveURL(/#chi-siamo$/)
    await expect(aboutLink).toHaveAttribute('aria-current', 'location')
    await expect(page.getByRole('heading', { level: 2, name: 'Chi siamo' })).toBeVisible()
    const kpis = page
      .getByRole('list', { name: 'Statistiche di Officina Belviso' })
      .getByRole('listitem')
    await expect(kpis).toHaveCount(4)
    for (const [index, value, title] of [
      [0, '40+', 'ANNI DI ESPERIENZA'],
      [1, '3', 'AREE SPECIALIZZATE'],
      [2, '1000+', 'INTERVENTI ESEGUITI'],
      [3, '4.9★', 'VALUTAZIONE GOOGLE'],
    ] as const) {
      await expect(kpis.nth(index).locator('.home-about__stat-value')).toHaveText(value)
      await expect(kpis.nth(index).locator('.home-about__stat-title')).toHaveText(title)
    }
    await expect(page.getByText('Metodo', { exact: true })).toHaveCount(0)
    await expect(page.getByText('Qualità', { exact: true })).toHaveCount(0)
    await expect(page.getByText('Tecnica', { exact: true })).toHaveCount(0)
    await expect(page.getByText('Ascolto', { exact: true })).toHaveCount(0)
    expect(
      await page.locator('.home-about__stats').evaluate((element) => {
        return getComputedStyle(element).gridTemplateColumns.split(' ').length
      }),
    ).toBe(4)
    await expect(
      page.getByRole('img', {
        name: 'Tecnici al lavoro su veicoli industriali in officina',
      }),
    ).toBeVisible()
  })

  for (const [width, expectedColumns] of [
    [1440, 4],
    [1024, 2],
    [768, 2],
    [390, 2],
    [320, 1],
  ] as const) {
    test(`lays out the About KPIs in ${expectedColumns} column(s) at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/')

      const kpis = page.locator('.home-about__stats')
      expect(
        await kpis.evaluate(
          (element) => getComputedStyle(element).gridTemplateColumns.split(' ').length,
        ),
      ).toBe(expectedColumns)
    })
  }

  test('moves by complete pages with buttons, keyboard, and mouse drag', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await openJourneyPanel(page, 'servizi')

    const services = page.getByRole('region', { name: 'Servizi Officina Belviso' })
    const works = page.getByRole('region', { name: 'I nostri lavori' })
    await expect(services.locator('[data-carousel-slide]')).toHaveCount(7)
    await expect(works.locator('[data-carousel-slide]')).toHaveCount(5)

    const track = services.locator('[data-carousel-track]')
    const previous = services.getByRole('button', { name: 'Servizio precedente' })
    const next = services.getByRole('button', { name: 'Servizio successivo' })
    const pageIndicator = services.locator(
      '.premium-carousel__toolbar > span[aria-hidden="true"]',
    )
    const livePageStatus = services.locator('[aria-live="polite"]')
    await expect(previous).toBeDisabled()
    await expect(next).toBeEnabled()
    await expect(pageIndicator).toHaveText('01 / 03')
    await expect(livePageStatus).toHaveText('Pagina 1 di 3')

    await next.click()
    await expect
      .poll(() =>
        track.evaluate((element) => {
          const slides = element.querySelectorAll<HTMLElement>('[data-carousel-slide]')
          return Math.abs(
            slides[3].getBoundingClientRect().left -
              element.getBoundingClientRect().left,
          )
        }),
      )
      .toBeLessThan(2)
    await expect(pageIndicator).toHaveText('02 / 03')
    await expect(livePageStatus).toHaveText('Pagina 2 di 3')
    await expect(previous).toBeEnabled()

    await track.focus()
    await track.press('ArrowRight')
    await expect
      .poll(() =>
        track.evaluate((element) => {
          const slides = element.querySelectorAll<HTMLElement>('[data-carousel-slide]')
          return Math.abs(
            slides[6].getBoundingClientRect().left -
              element.getBoundingClientRect().left,
          )
        }),
      )
      .toBeLessThan(2)
    await expect(pageIndicator).toHaveText('03 / 03')
    await expect(livePageStatus).toHaveText('Pagina 3 di 3')
    await expect(next).toBeDisabled()

    await previous.click()
    await previous.click()
    await expect(pageIndicator).toHaveText('01 / 03')
    await expect
      .poll(() =>
        track.evaluate((element) => {
          const firstSlide = element.querySelector<HTMLElement>(
            '[data-carousel-slide]',
          )
          if (!firstSlide) return Number.POSITIVE_INFINITY
          return Math.abs(
            firstSlide.getBoundingClientRect().left -
              element.getBoundingClientRect().left,
          )
        }),
      )
      .toBeLessThan(2)

    await track.scrollIntoViewIfNeeded()
    const bounds = await track.boundingBox()
    expect(bounds).not.toBeNull()
    if (!bounds) return

    await page.mouse.move(bounds.x + bounds.width * 0.82, bounds.y + bounds.height * 0.5)
    await page.mouse.down()
    await page.mouse.move(bounds.x + bounds.width * 0.18, bounds.y + bounds.height * 0.5, {
      steps: 8,
    })
    await page.mouse.up()
    await expect
      .poll(() =>
        track.evaluate((element) => {
          const slides = element.querySelectorAll<HTMLElement>('[data-carousel-slide]')
          return Math.abs(
            slides[3].getBoundingClientRect().left -
              element.getBoundingClientRect().left,
          )
        }),
      )
      .toBeLessThan(2)
    await expect(pageIndicator).toHaveText('02 / 03')

    const worksTrack = works.locator('[data-carousel-track]')
    const worksNext = works.getByRole('button', { name: 'Lavoro successivo' })
    await worksNext.click()
    await expect
      .poll(() =>
        worksTrack.evaluate((element) => {
          const slides = element.querySelectorAll<HTMLElement>('[data-carousel-slide]')
          return Math.abs(
            slides[3].getBoundingClientRect().left -
              element.getBoundingClientRect().left,
          )
        }),
      )
      .toBeLessThan(2)
    await expect(worksNext).toBeDisabled()
  })

  for (const [width, expectedVisible] of [
    [2560, 3],
    [1440, 3],
    [1024, 3],
    [820, 2],
    [768, 2],
    [576, 1],
    [480, 1],
    [390, 1],
  ] as const) {
    test(`shows ${expectedVisible} carousel card(s) at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/')
      await openJourneyPanel(page, 'servizi')

      const services = page.getByRole('region', { name: 'Servizi Officina Belviso' })
      const visibleCards = await services.evaluate((carousel) => {
        const track = carousel.querySelector<HTMLElement>('[data-carousel-track]')
        if (!track) return 0

        const trackBounds = track.getBoundingClientRect()
        return Array.from(
          track.querySelectorAll<HTMLElement>('[data-carousel-slide]'),
        ).filter((slide) => {
          const bounds = slide.getBoundingClientRect()
          return (
            bounds.left >= trackBounds.left - 1 &&
            bounds.right <= trackBounds.right + 1
          )
        }).length
      })

      expect(visibleCards).toBe(expectedVisible)

      const track = services.locator('[data-carousel-track]')
      const next = services.getByRole('button', { name: 'Servizio successivo' })
      await next.click()
      await expect
        .poll(() =>
          track.evaluate((element, expectedIndex) => {
            const slides = element.querySelectorAll<HTMLElement>(
              '[data-carousel-slide]',
            )
            return Math.abs(
              slides[expectedIndex].getBoundingClientRect().left -
                element.getBoundingClientRect().left,
            )
          }, expectedVisible),
        )
        .toBeLessThan(2)
    })
  }

  test('does not autoplay either carousel', async ({ page }) => {
    await page.goto('/')

    const tracks = page.locator('[data-carousel-track]')
    const before = await tracks.evaluateAll((items) => items.map((item) => item.scrollLeft))
    await page.waitForTimeout(900)
    const after = await tracks.evaluateAll((items) => items.map((item) => item.scrollLeft))

    expect(after).toEqual(before)
  })

  test.describe('touch pagination', () => {
    test.use({ hasTouch: true, viewport: { width: 390, height: 844 } })

    test('snaps a swipe to the nearest complete page', async ({
      page,
      context,
    }) => {
      await page.goto('/')
      await expect(page.locator('html')).not.toHaveClass(/intro-running/, {
        timeout: 8000,
      })
      await openJourneyPanel(page, 'servizi')

      const services = page.getByRole('region', { name: 'Servizi Officina Belviso' })
      const track = services.locator('[data-carousel-track]')
      await track.scrollIntoViewIfNeeded()
      const bounds = await track.boundingBox()
      expect(bounds).not.toBeNull()
      if (!bounds) return

      const session = await context.newCDPSession(page)
      const startX = bounds.x + bounds.width * 0.82
      const endX = bounds.x + bounds.width * 0.18
      const y = bounds.y + bounds.height * 0.5

      await session.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: startX, y }],
      })
      for (let step = 1; step <= 10; step += 1) {
        await session.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [
            {
              x: startX + ((endX - startX) * step) / 10,
              y,
            },
          ],
        })
      }
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: [],
      })

      await expect
        .poll(() =>
          track.evaluate((element) => {
            const slides = element.querySelectorAll<HTMLElement>(
              '[data-carousel-slide]',
            )
            return Math.abs(
              slides[1].getBoundingClientRect().left -
                element.getBoundingClientRect().left,
            )
          }),
        )
        .toBeLessThan(2)
    })
  })

  test('has an operable mobile menu with Escape focus restoration', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')

    const menu = page.getByRole('button', { name: 'Apri menu' })
    const nav = page.getByRole('navigation', { name: 'Navigazione principale' })
    await expect(menu).toBeVisible()
    await expect(nav).toBeHidden()

    await menu.click()
    const close = page.getByRole('button', { name: 'Chiudi menu' })
    await expect(close).toHaveAttribute('aria-expanded', 'true')
    await expect(nav).toBeVisible()

    await close.press('Escape')
    await expect(nav).toBeHidden()
    await expect(menu).toBeFocused()
  })

  test('restores mobile focus after selecting a navigation destination', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')

    const menu = page.getByRole('button', { name: 'Apri menu' })
    await menu.click()
    await page
      .getByRole('navigation', { name: 'Navigazione principale' })
      .getByRole('link', { name: 'Servizi' })
      .click()

    await expect(page).toHaveURL(/#servizi$/)
    await expect(page.getByRole('navigation', { name: 'Navigazione principale' })).toBeHidden()
    await expect(page.getByRole('button', { name: 'Apri menu' })).toBeFocused()
  })

  test('keeps the logo and adaptive navigation separated around the breakpoint', async ({
    page,
  }) => {
    await page.goto('/')

    for (const width of [900, 960, 961, 1024]) {
      await page.setViewportSize({ width, height: 900 })

      const overlap = await page.evaluate(() => {
        const logo = document.querySelector<HTMLElement>('.brand-logo-frame')
        const navigationElement =
          document.querySelector<HTMLElement>('.floating-navigation')
        if (!logo || !navigationElement) return Number.POSITIVE_INFINITY

        const logoBounds = logo.getBoundingClientRect()
        const navigationBounds = navigationElement.getBoundingClientRect()
        return Math.max(
          0,
          Math.min(logoBounds.right, navigationBounds.right) -
            Math.max(logoBounds.left, navigationBounds.left),
        )
      })

      // Layout coordinates can differ by a fraction of a CSS pixel after
      // device-scale rounding; anything below one physical pixel is not a
      // visible overlap.
      expect(overlap).toBeLessThan(0.5)
    }
  })

  test.describe('touch target sizing', () => {
    test.use({ hasTouch: true, reducedMotion: 'reduce' })

    test('keeps primary touch targets at least 44 by 44 pixels', async ({ page }) => {
      await page.setViewportSize({ width: 820, height: 900 })
      await page.goto('/')

      await page.getByRole('button', { name: 'Apri menu' }).click()
      await page.locator('#richiedi-preventivo').scrollIntoViewIfNeeded()

      const targets = page.locator(
        '.story-nav a, .site-footer__links a, .site-footer__social a, .form-checkbox label',
      )
      const undersized = await targets.evaluateAll((elements) =>
        elements
          .filter((element) => {
            const bounds = element.getBoundingClientRect()
            return bounds.width < 44 || bounds.height < 44
          })
          .map((element) => ({
            height: element.getBoundingClientRect().height,
            text: element.textContent?.trim(),
            width: element.getBoundingClientRect().width,
          })),
      )

      expect(undersized).toEqual([])
    })
  })

  test.describe('reduced motion', () => {
    test.use({ reducedMotion: 'reduce' })

    test('keeps every essential element visible and operable', async ({ page }) => {
      await page.goto('/')

      await expect(
        page.getByRole('heading', {
          level: 1,
          name: 'Competenza tecnica per i veicoli industriali.',
        }),
      ).toBeVisible()
      await expect(page.getByRole('link', { name: 'Scopri i servizi' })).toBeVisible()
      await expect
        .poll(() =>
          page.locator('[data-hero-reveal]').evaluateAll((items) =>
            items.every((item) => getComputedStyle(item).visibility === 'visible'),
          ),
        )
        .toBe(true)
    })
  })

  test('runs observable GSAP timelines on the rendered Home', async ({ page }) => {
    await page.addInitScript(() => {
      const samples: Array<{ opacity: number; y: number }> = []
      Object.assign(window, { __heroMotionSamples: samples })
      const sample = () => {
        const element = document.querySelector<HTMLElement>('[data-hero-title-text]')
        if (element) {
          const transform = new DOMMatrixReadOnly(getComputedStyle(element).transform)
          samples.push({ opacity: Number(getComputedStyle(element).opacity), y: transform.m42 })
        }
        if (samples.length < 180) window.requestAnimationFrame(sample)
      }
      window.requestAnimationFrame(sample)
    })
    await page.goto('/')

    const heroTitleLines = page.locator('[data-hero-title-text]')
    await expect(heroTitleLines).toHaveCount(2)
    const heroTitle = heroTitleLines.first()
    await expect.poll(() => heroTitle.evaluate((element) => Number(getComputedStyle(element).opacity))).toBe(1)
    await expect.poll(() => heroTitle.evaluate((element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).m42)).toBe(0)
    expect(
      await page.evaluate(() => {
        const samples = (window as Window & {
          __heroMotionSamples?: Array<{ opacity: number; y: number }>
        }).__heroMotionSamples ?? []
        return samples.some((sample) => sample.opacity < 0.9 && sample.y > 24)
      }),
    ).toBe(true)

    const about = page.locator('#chi-siamo')
    await openJourneyPanel(page, 'chi-siamo')
    await expect.poll(() => about.locator('.home-about__stats > li').evaluateAll((items) =>
      items.every((item) => Number(getComputedStyle(item).opacity) === 1),
    )).toBe(true)

    const services = page.locator('#servizi')
    await openJourneyPanel(page, 'servizi')
    await expect.poll(() => services.locator('.carousel-card').first().evaluate((element) =>
      Number(getComputedStyle(element).opacity),
    )).toBe(1)

    const footer = page.locator('.site-footer')
    await footer.scrollIntoViewIfNeeded()
    await expect.poll(() => footer.locator('.site-footer__bottom').evaluate((element) =>
      Number(getComputedStyle(element).opacity),
    )).toBe(1)
  })

  test('coordinates the navigation indicator and compact scroll state without hiding content', async ({ page }) => {
    await page.goto('/')

    const navigation = page.locator('.floating-navigation')
    const indicator = page.locator('.story-nav__indicator')
    await expect(indicator).toHaveCount(1)
    await expect
      .poll(() => indicator.evaluate((element) => element.getBoundingClientRect().width))
      .toBeGreaterThan(0)

    await page.locator('.story-link[href="#galleria"]').click()
    await expect(navigation).toHaveAttribute('data-scroll-compact', '')
    await expect(page.locator('#gallery-title')).toBeVisible()
  })

  test('transitions Google reviews only after explicit user input', async ({ page }) => {
    await page.goto('/')

    const reviews = page.locator('.google-reviews')
    await reviews.scrollIntoViewIfNeeded()
    await reviews.getByRole('button', { name: 'Recensione successiva' }).click()
    await expect(reviews.locator('.google-review')).toContainText('Seconda recensione')
    await expect(reviews.locator('.google-reviews__controls')).toContainText('2 / 3')
  })

  test('keeps content and active navigation stable after a mid-page refresh and fast scroll', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/#servizi')
    await expect(page.locator('#services-title')).toBeVisible()

    await page.reload()
    await expect(page.locator('#services-title')).toBeVisible()

    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    await expect(page.getByRole('link', { name: 'Lavora con noi' })).toHaveAttribute('aria-current', 'location')

    await page.locator('.story-link[href="#home"]').click()
    await expect(page.getByRole('link', { name: 'Home', exact: true })).toHaveAttribute('aria-current', 'location')
  })

  for (const [label, width, height] of [
    ['desktop-1920', 1920, 1080],
    ['desktop-1440', 1440, 900],
    ['laptop-1280', 1280, 800],
    ['tablet-landscape', 1024, 768],
    ['tablet-portrait', 768, 1024],
    ['mobile-390', 390, 844],
    ['mobile-375', 375, 667],
    ['mobile-320', 320, 568],
  ] as const) {
    test(`keeps the motion layout stable at ${label} (${width}x${height})`, async ({ page }) => {
      await page.setViewportSize({ width, height })
      await page.goto('/')

      await expect(page.locator('#home-hero-title')).toBeVisible()
      const dimensions = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }))
      expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)

      if (width <= 960) {
        await expect(page.getByRole('button', { name: 'Apri menu' })).toBeVisible()
      } else {
        await expect(page.getByRole('navigation', { name: 'Navigazione principale' })).toBeVisible()
      }
    })
  }

  for (const width of widths) {
    test(`has no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/')

      const dimensions = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }))
      expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
    })
  }

  test('does not log browser errors or warnings', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error' || message.type() === 'warning') {
        errors.push(message.text())
      }
    })
    page.on('pageerror', (error) => errors.push(error.message))

    await page.goto('/')
    await page.waitForLoadState('load')

    expect(errors).toEqual([])
  })
})
