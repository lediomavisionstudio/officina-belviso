import worker, { createPhoneLinks, renderContactActions } from './index.ts'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function equal(actual, expected, message) {
  assert(Object.is(actual, expected), `${message}: atteso ${expected}, ricevuto ${actual}`)
}

function quoteFields() {
  return {
    firstName: 'Mario',
    lastName: 'Rossi',
    company: 'Trasporti Rossi',
    email: 'mario@example.com',
    phonePrefix: '+39',
    phonePrefixCountry: 'IT',
    phoneNumber: '3331234567',
    phone: '+393331234567',
    vehicleBrand: 'Iveco',
    vehicleModel: 'S-Way',
    registrationYear: '2024',
    vin: 'ZCFA1234567890123',
    licensePlate: 'AB123CD',
    vehicleRunning: 'yes',
    serviceType: 'Diagnosi EBS/ABS',
    problemDescription: 'Spia accesa sul quadro.',
    privacy: true,
    website: '',
  }
}

function careerFields() {
  return {
    firstName: 'Anna',
    lastName: 'Bianchi',
    email: 'anna@example.com',
    phone: '3331234567',
    role: 'Meccanico',
    message: 'Candidatura spontanea.',
    privacy: true,
    website: '',
  }
}

function multipart(fields, files = []) {
  const data = new FormData()
  Object.entries(fields).forEach(([name, value]) => data.append(name, String(value)))
  files.forEach(({ field, file }) => data.append(field, file, file.name))
  return data
}

function imageFile(name = 'mezzo.jpg', type = 'image/jpeg', size = 64) {
  const bytes = new Uint8Array(size)
  if (type === 'image/jpeg') bytes.set([0xff, 0xd8, 0xff])
  if (type === 'image/png') bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  if (type === 'image/webp') {
    bytes.set([0x52, 0x49, 0x46, 0x46])
    bytes.set([0x57, 0x45, 0x42, 0x50], 8)
  }
  return new File([bytes], name, { type })
}

function pdfFile(name = 'curriculum.pdf', size = 64) {
  const bytes = new Uint8Array(size)
  bytes.set([0x25, 0x50, 0x44, 0x46, 0x2d])
  return new File([bytes], name, { type: 'application/pdf' })
}

function request(path, body, json = false) {
  return new Request(`https://officinabelviso.it${path}`, {
    method: 'POST',
    body: json ? JSON.stringify(body) : body,
    headers: json ? { 'Content-Type': 'application/json' } : undefined,
  })
}

function env(secret = 'test-secret') {
  return {
    RESEND_API_KEY: secret,
    ASSETS: { fetch: async () => new Response('spa', { status: 200 }) },
  }
}

let resendPayload
let resendStatus = 200
globalThis.fetch = async (_url, init) => {
  resendPayload = JSON.parse(String(init?.body ?? '{}'))
  return new Response('{}', { status: resendStatus })
}

async function run(name, test) {
  resendPayload = undefined
  resendStatus = 200
  await test()
  console.log(`✓ ${name}`)
}

await run('contatto senza allegati (compatibilità JSON)', async () => {
  const response = await worker.fetch(request('/api/contact', quoteFields(), true), env())
  equal(response.status, 200, 'status')
  equal(resendPayload.attachments, undefined, 'allegati assenti')
})

await run('contatto con una immagine', async () => {
  const body = multipart(quoteFields(), [{ field: 'photos', file: imageFile() }])
  const response = await worker.fetch(request('/api/contact', body), env())
  equal(response.status, 200, 'status')
  equal(resendPayload.attachments.length, 1, 'numero allegati')
  equal(resendPayload.attachments[0].filename, 'mezzo.jpg', 'nome allegato')
})

await run('contatto con immagini multiple', async () => {
  const files = [
    { field: 'photos', file: imageFile('uno.jpg') },
    { field: 'photos', file: imageFile('due.png', 'image/png') },
    { field: 'photos', file: imageFile('tre.webp', 'image/webp') },
  ]
  const response = await worker.fetch(request('/api/contact', multipart(quoteFields(), files)), env())
  equal(response.status, 200, 'status')
  equal(resendPayload.attachments.length, 3, 'numero allegati')
})

await run('più di quattro immagini rifiutate', async () => {
  const files = Array.from({ length: 5 }, (_, index) => ({
    field: 'photos',
    file: imageFile(`${index}.jpg`),
  }))
  const response = await worker.fetch(request('/api/contact', multipart(quoteFields(), files)), env())
  equal(response.status, 413, 'status')
})

await run('immagine oltre 4 MB rifiutata', async () => {
  const file = imageFile('grande.jpg', 'image/jpeg', 4 * 1024 * 1024 + 1)
  const response = await worker.fetch(request('/api/contact', multipart(quoteFields(), [{ field: 'photos', file }])), env())
  equal(response.status, 413, 'status')
})

await run('tipo immagine non consentito rifiutato', async () => {
  const file = new File([new Uint8Array([0x47, 0x49, 0x46])], 'foto.gif', { type: 'image/gif' })
  const response = await worker.fetch(request('/api/contact', multipart(quoteFields(), [{ field: 'photos', file }])), env())
  equal(response.status, 415, 'status')
})

await run('candidatura con PDF valido', async () => {
  const file = pdfFile()
  const response = await worker.fetch(request('/api/careers', multipart(careerFields(), [{ field: 'cv', file }])), env())
  equal(response.status, 200, 'status')
  equal(resendPayload.attachments[0].filename, 'curriculum.pdf', 'nome CV')
})

await run('candidatura con file non PDF rifiutata', async () => {
  const file = imageFile()
  const response = await worker.fetch(request('/api/careers', multipart(careerFields(), [{ field: 'cv', file }])), env())
  equal(response.status, 415, 'status')
})

await run('CV oltre 5 MB rifiutato', async () => {
  const file = pdfFile('grande.pdf', 5 * 1024 * 1024 + 1)
  const response = await worker.fetch(request('/api/careers', multipart(careerFields(), [{ field: 'cv', file }])), env())
  equal(response.status, 413, 'status')
})

await run('normalizzazione telefono italiano per chiamata e WhatsApp', async () => {
  const links = createPhoneLinks('333 123 4567', 'Mario')
  equal(links?.telUrl, 'tel:+393331234567', 'link telefono')
  assert(links?.whatsappUrl.startsWith('https://wa.me/393331234567?text='), 'link WhatsApp')
})

await run('nessun telefono significa nessuna CTA', async () => {
  equal(renderContactActions(), '', 'CTA assente')
})

await run('escape HTML dei dati utente', async () => {
  const fields = { ...quoteFields(), firstName: `<Mario & \"O'Rossi\">` }
  const response = await worker.fetch(request('/api/contact', fields, true), env())
  equal(response.status, 200, 'status')
  assert(!resendPayload.html.includes(`<Mario & \"O'Rossi\">`), 'input non escapato assente')
  assert(resendPayload.html.includes('&lt;Mario &amp; &quot;O&#039;Rossi&quot;&gt;'), 'entità HTML presenti')
})

await run('secret mancante restituisce errore controllato', async () => {
  const response = await worker.fetch(request('/api/contact', quoteFields(), true), env(null))
  equal(response.status, 500, 'status')
})

await run('errore Resend restituisce errore controllato', async () => {
  resendStatus = 500
  const response = await worker.fetch(request('/api/contact', quoteFields(), true), env())
  equal(response.status, 502, 'status')
})

await run('fallback SPA invariato', async () => {
  const response = await worker.fetch(new Request('https://officinabelviso.it/servizi'), env())
  equal(response.status, 200, 'status')
  equal(await response.text(), 'spa', 'risposta asset')
})

console.log('Tutti i test Worker sono passati.')
