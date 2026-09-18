import { expect, test } from '@playwright/test'

for (const viewport of [
  { name: 'mobile', width: 393, height: 773 },
  { name: 'desktop', width: 1440, height: 900 },
]) {
  test(`gestisce fotografie e CV senza alterare il layout ${viewport.name}`, async ({ page }) => {
    const runtimeErrors: string[] = []
    page.on('pageerror', (error) => runtimeErrors.push(error.message))
    await page.setViewportSize(viewport)
    await page.goto('/')

    const quoteForm = page.getByRole('form', { name: 'Modulo per richiedere un preventivo' })
    const photos = quoteForm.locator('input[type="file"]')
    await photos.setInputFiles([
      { name: 'fronte.jpg', mimeType: 'image/jpeg', buffer: Buffer.from([0xff, 0xd8, 0xff]) },
      { name: 'retro.png', mimeType: 'image/png', buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47]) },
    ])
    await expect(quoteForm.getByText('2/4 fotografie')).toBeVisible()
    await expect(quoteForm.getByText('fronte.jpg')).toBeVisible()
    await expect(quoteForm.getByText('retro.png')).toBeVisible()
    await quoteForm.getByRole('button', { name: 'Rimuovi fronte.jpg' }).click()
    await expect(quoteForm.getByText('1/4 fotografie')).toBeVisible()

    const careerForm = page.getByRole('form', { name: 'Modulo per inviare una candidatura' })
    const quotePhone = quoteForm.locator('.form-phone')
    const careerPhone = careerForm.locator('.form-phone')
    await expect(quotePhone).toHaveCount(1)
    await expect(careerPhone).toHaveCount(1)
    await expect(careerForm.locator('[name="phonePrefix"]')).toHaveValue('+39')
    await quoteForm.locator('[name="phoneNumber"]').fill('abc1234567890123')
    await careerForm.locator('[name="phoneNumber"]').fill('abc1234567890123')
    await expect(careerForm.locator('[name="phoneNumber"]')).toHaveValue(
      await quoteForm.locator('[name="phoneNumber"]').inputValue(),
    )
    await careerForm.locator('[name="phoneNumber"]').fill('1234567890')
    await careerForm.locator('[name="phonePrefixCountry"]').selectOption('FR')
    await expect(careerForm.locator('[name="phonePrefix"]')).toHaveValue('+33')
    await expect(careerForm.locator('[name="phone"]')).toHaveValue('+331234567890')
    const phoneLayouts = await Promise.all([quotePhone, careerPhone].map((field) =>
      field.evaluate((element) => {
        const controls = element.querySelector<HTMLElement>('.form-phone__controls')
        const bounds = controls?.getBoundingClientRect()
        return {
          columns: controls ? getComputedStyle(controls).gridTemplateColumns : '',
          prefixColumn: controls ? getComputedStyle(controls).gridTemplateColumns.split(' ')[0] : '',
          overflow: bounds ? bounds.right > innerWidth : true,
        }
      }),
    ))
    expect(phoneLayouts[1].prefixColumn).toBe(phoneLayouts[0].prefixColumn)
    expect(phoneLayouts[1].columns).not.toBe('')
    expect(phoneLayouts[1].overflow).toBe(false)

    const cv = careerForm.locator('input[type="file"]')
    await cv.setInputFiles({
      name: 'curriculum.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.7'),
    })
    await expect(careerForm.getByText('1/1 file')).toBeVisible()
    await expect(careerForm.getByText('curriculum.pdf')).toBeVisible()
    await careerForm.getByRole('button', { name: 'Rimuovi curriculum.pdf' }).click()
    await expect(careerForm.getByText('0/1 file')).toBeVisible()

    expect(runtimeErrors).toEqual([])
  })
}
