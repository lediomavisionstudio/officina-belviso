import { expect, test, type Locator, type Page } from '@playwright/test'

async function openQuoteForm(page: Page) {
  await page.goto('/')
  await expect(page.locator('html')).not.toHaveClass(/intro-running/, { timeout: 8_000 })
  await page.locator('#richiedi-preventivo').scrollIntoViewIfNeeded()
  return page.getByRole('form', { name: 'Modulo per richiedere un preventivo' })
}

async function completeRequiredFields(form: Locator) {
  await form.locator('[name="firstName"]').fill('Mario')
  await form.locator('[name="lastName"]').fill('Rossi')
  await form.locator('[name="phoneNumber"]').fill('3331234567')
  await form.locator('[name="vin"]').fill('WDB00000000000000')
  await form.locator('[name="vehicleRunning"][value="yes"]').check()
  await form.locator('.form-multiselect__trigger').click()
  await form.getByRole('checkbox', { name: 'Impianto frenante' }).check()
  await form.locator('[name="problemDescription"]').fill('Controllo del sistema frenante.')
  await form.locator('[name="privacy"]').check()
}

test.describe('Quote form production fields', () => {
  test('marks only the requested fields as required', async ({ page }) => {
    const form = await openQuoteForm(page)

    for (const name of [
      'firstName',
      'lastName',
      'phoneNumber',
      'vin',
      'problemDescription',
      'privacy',
    ]) {
      await expect(form.locator(`[name="${name}"]`)).toHaveAttribute('required', '')
    }

    for (const name of [
      'company',
      'email',
      'vehicleBrand',
      'vehicleModel',
      'registrationYear',
      'licensePlate',
    ]) {
      await expect(form.locator(`[name="${name}"]`)).not.toHaveAttribute('required', '')
    }

    await expect(form.locator('[name="vehicleRunning"]:checked')).toHaveCount(0)
    await form.getByRole('button', { name: 'Conferma invio' }).click()
    await expect(form.locator('[name="firstName"]')).toBeFocused()
    await expect(form.getByText('Inserisci il numero di telaio.')).toBeVisible()
    await expect(form.getByText('Indica se il veicolo è marciante.')).toBeVisible()
    await expect(
      form.getByText('Seleziona almeno una tipologia di intervento.'),
    ).toBeVisible()
  })

  test('sanitizes phone input and serializes its international value', async ({ page }) => {
    const form = await openQuoteForm(page)
    const prefix = form.locator('[name="phonePrefixCountry"]')
    const number = form.locator('[name="phoneNumber"]')

    await expect(prefix).toHaveValue('IT')
    await expect(form.locator('[name="phonePrefix"]')).toHaveValue('+39')
    await number.fill('33a3-123 456789')
    await expect(number).toHaveValue('3331234567')
    await expect(form.locator('[name="phone"]')).toHaveValue('+393331234567')

    await prefix.selectOption('FR')
    await expect(form.locator('[name="phonePrefix"]')).toHaveValue('+33')
    await expect(form.locator('[name="phone"]')).toHaveValue('+333331234567')
  })

  test('supports selection, removal, Escape, click outside and valid submit', async ({ page }) => {
    const form = await openQuoteForm(page)
    const trigger = form.locator('.form-multiselect__trigger')

    await trigger.click()
    await form.getByRole('checkbox', { name: 'Impianto frenante' }).check()
    await form.getByRole('checkbox', { name: 'Diagnosi EBS/ABS' }).check()
    await expect(form.locator('[name="serviceType"]')).toHaveValue(
      'Impianto frenante, Diagnosi EBS/ABS',
    )
    await expect(form.locator('.form-multiselect__chip')).toHaveCount(2)

    await form.getByRole('button', { name: 'Rimuovi Impianto frenante' }).click()
    await expect(form.locator('[name="serviceType"]')).toHaveValue('Diagnosi EBS/ABS')
    await page.keyboard.press('Escape')
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(trigger).toBeFocused()

    await trigger.click()
    await form.locator('[name="problemDescription"]').click()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await completeRequiredFields(form)
    await form.getByRole('button', { name: 'Conferma invio' }).click()
    await expect(form.getByRole('status')).toContainText('servizio verrà attivato')
  })
})
