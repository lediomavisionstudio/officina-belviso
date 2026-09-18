interface AssetsBinding {
  fetch(request: Request): Promise<Response>
}

interface Env {
  ASSETS: AssetsBinding
  RESEND_API_KEY?: string
}

type JsonObject = Record<string, unknown>

type SubmittedFile = {
  fieldName: string
  file: File
}

type ValidatedAttachment = {
  file: File
  filename: string
}

type ParsedSubmission = {
  fields: JsonObject
  files: SubmittedFile[]
}

type EmailRow = {
  label: string
  value: string
}

type EmailSection = {
  title: string
  rows: EmailRow[]
  variant?: 'highlight'
}

type ContactActions = {
  callLabel: string
  firstName: string
  phone: string
  whatsappMessage: string
  whatsappLabel: string
}

type PhoneLinks = {
  telUrl: string
  whatsappUrl: string
}

type EmailTemplateOptions = {
  automatedMessage: string
  contactActions?: ContactActions
  heading: string
  sections: EmailSection[]
}

class RequestError extends Error {
  readonly status: number

  constructor(status: number) {
    super('Invalid request')
    this.status = status
  }
}

const RESEND_ENDPOINT = 'https://api.resend.com/emails'
const EMAIL_FROM = 'Officina Belviso <sito@officinabelviso.it>'
const MAX_JSON_BODY_BYTES = 32 * 1024
const MAX_MULTIPART_QUOTE_BYTES = 18 * 1024 * 1024
const MAX_MULTIPART_CAREER_BYTES = 6 * 1024 * 1024
const MAX_PHOTO_FILES = 4
const MAX_PHOTO_BYTES = 4 * 1024 * 1024
const MAX_CV_BYTES = 5 * 1024 * 1024
const IMAGE_TYPES = new Map([
  ['image/jpeg', new Set(['jpg', 'jpeg'])],
  ['image/png', new Set(['png'])],
  ['image/webp', new Set(['webp'])],
])
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const quoteServiceLabels = new Set([
  'Impianto frenante',
  'Aria compressa',
  'Diagnosi EBS/ABS',
  'Diagnosi ECAS',
  'Sospensioni',
  'Manutenzione programmata',
  'Altro',
])

function jsonResponse(status: number, body: JsonObject) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

function normalizeSingleLine(value: string) {
  return [...value]
    .map((character) => {
      const codePoint = character.codePointAt(0) ?? 0
      return codePoint < 32 || codePoint === 127 ? ' ' : character
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeMultiline(value: string) {
  return [...value.replace(/\r\n?/g, '\n')]
    .filter((character) => {
      const codePoint = character.codePointAt(0) ?? 0
      return codePoint === 10 || codePoint === 9 || (codePoint >= 32 && codePoint !== 127)
    })
    .join('')
    .trim()
}

function stringField(
  body: JsonObject,
  name: string,
  maxLength: number,
  options: { multiline?: boolean; required?: boolean } = {},
) {
  const rawValue = body[name]
  if (rawValue === undefined || rawValue === null) {
    if (options.required) throw new RequestError(400)
    return ''
  }
  if (typeof rawValue !== 'string') throw new RequestError(400)

  const value = options.multiline
    ? normalizeMultiline(rawValue)
    : normalizeSingleLine(rawValue)
  if ((options.required && !value) || value.length > maxLength) {
    throw new RequestError(400)
  }
  return value
}

function requiredConsent(body: JsonObject) {
  if (body.privacy !== true && body.privacy !== 'true' && body.privacy !== 'on') {
    throw new RequestError(400)
  }
}

function validEmail(email: string, required: boolean) {
  if ((required && !email) || (email && !EMAIL_PATTERN.test(email))) {
    throw new RequestError(400)
  }
}

function validPhone(phone: string) {
  const digits = phone.replace(/\D/g, '')
  if (!/^[+\d\s()./-]+$/.test(phone) || digits.length < 6 || digits.length > 18) {
    throw new RequestError(400)
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  })[character] ?? character)
}

function visibleRows(section: EmailSection) {
  return section.rows.filter((row) => row.value.trim())
}

function renderText(sections: EmailSection[]) {
  return sections
    .map((section) => {
      const rows = visibleRows(section)
      if (!rows.length) return ''
      return [
        section.title.toUpperCase(),
        ...rows.map((row) => `${row.label}: ${row.value}`),
      ].join('\n')
    })
    .filter(Boolean)
    .join('\n\n')
}

export function createPhoneLinks(
  phone: string,
  firstName: string,
  whatsappMessage = `Buongiorno ${firstName}, ti contattiamo da Officina Belviso.`,
): PhoneLinks | null {
  let digits = phone.replace(/\D/g, '')
  const trimmedPhone = phone.trim()
  if (trimmedPhone.startsWith('00')) digits = digits.slice(2)
  if (digits.length < 6 || digits.length > 18) return null

  const internationalDigits = trimmedPhone.startsWith('+') || trimmedPhone.startsWith('00')
    ? digits
    : digits.startsWith('39') && digits.length >= 11
      ? digits
      : `39${digits}`
  return {
    telUrl: `tel:+${internationalDigits}`,
    whatsappUrl: `https://wa.me/${internationalDigits}?text=${encodeURIComponent(whatsappMessage)}`,
  }
}

export function renderContactActions(actions?: ContactActions) {
  if (!actions?.phone) return ''
  const links = createPhoneLinks(actions.phone, actions.firstName, actions.whatsappMessage)
  if (!links) return ''

  return `
    <tr>
      <td class="email-content" style="padding:0 32px 28px">
        <h2 style="color:#171819;font-family:Arial,Helvetica,sans-serif;font-size:18px;line-height:1.3;margin:0 0 14px">Contatto rapido</h2>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td class="email-cta" width="50%" style="padding:0 6px 0 0">
              <a href="${links.telUrl}" style="background:#171819;border:1px solid #171819;border-radius:7px;color:#ffffff;display:block;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;line-height:20px;padding:13px 16px;text-align:center;text-decoration:none">${escapeHtml(actions.callLabel)}</a>
            </td>
            <td class="email-cta" width="50%" style="padding:0 0 0 6px">
              <a href="${links.whatsappUrl}" target="_blank" rel="noopener noreferrer" style="background:#168b51;border:1px solid #168b51;border-radius:7px;color:#ffffff;display:block;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;line-height:20px;padding:13px 16px;text-align:center;text-decoration:none">${escapeHtml(actions.whatsappLabel)}</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>`
}

function renderContactText(actions?: ContactActions) {
  if (!actions?.phone) return ''
  const links = createPhoneLinks(actions.phone, actions.firstName, actions.whatsappMessage)
  if (!links) return ''
  return [
    'CONTATTO RAPIDO',
    `${actions.callLabel}: ${links.telUrl}`,
    `${actions.whatsappLabel}: ${links.whatsappUrl}`,
  ].join('\n')
}

function renderSection(section: EmailSection) {
  const rows = visibleRows(section)
  if (!rows.length) return ''

  const body = section.variant === 'highlight'
    ? rows.map((row) => `
        <div style="background:#f6f6f6;border-left:4px solid #d51f26;border-radius:4px;color:#171819;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;padding:16px 18px;white-space:pre-wrap">
          ${rows.length > 1 ? `<strong style="display:block;margin-bottom:5px">${escapeHtml(row.label)}</strong>` : ''}${escapeHtml(row.value)}
        </div>`).join('<div style="height:10px;line-height:10px">&nbsp;</div>')
    : `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse">
          ${rows.map((row) => `
            <tr>
              <th class="email-label" width="38%" style="border-bottom:1px solid #e4e4e4;color:#606264;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:600;line-height:1.45;padding:10px 14px 10px 0;text-align:left;vertical-align:top">${escapeHtml(row.label)}</th>
              <td class="email-value" style="border-bottom:1px solid #e4e4e4;color:#171819;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.45;padding:10px 0;vertical-align:top;white-space:pre-wrap">${escapeHtml(row.value)}</td>
            </tr>`).join('')}
        </table>`

  return `
    <tr>
      <td class="email-content" style="padding:0 32px 28px">
        <h2 style="color:#171819;font-family:Arial,Helvetica,sans-serif;font-size:18px;line-height:1.3;margin:0 0 12px">${escapeHtml(section.title)}</h2>
        ${body}
      </td>
    </tr>`
}

function renderHtml({ automatedMessage, contactActions, heading, sections }: EmailTemplateOptions) {
  const content = sections
    .map((section, index) => `${renderSection(section)}${index === 0 ? renderContactActions(contactActions) : ''}`)
    .join('')

  return `<!doctype html>
<html lang="it">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="x-apple-disable-message-reformatting">
    <title>${escapeHtml(heading)}</title>
    <style>
      @media only screen and (max-width:560px) {
        .email-shell { width:100% !important; }
        .email-content { padding-left:20px !important; padding-right:20px !important; }
        .email-cta { display:block !important; width:100% !important; padding:0 0 10px !important; }
        .email-label { display:block !important; width:100% !important; padding-bottom:3px !important; border-bottom:0 !important; }
        .email-value { display:block !important; width:100% !important; padding-top:0 !important; }
      }
    </style>
  </head>
  <body style="background:#ececec;margin:0;padding:0;word-spacing:normal">
    <div style="display:none;font-size:1px;color:#ececec;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">${escapeHtml(heading)} ricevuta dal sito Officina Belviso.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#ececec;border-collapse:collapse">
      <tr>
        <td align="center" style="padding:24px 12px">
          <table class="email-shell" role="presentation" width="640" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff;border-collapse:separate;border-radius:10px;box-shadow:0 8px 28px rgba(0,0,0,.08);max-width:640px;overflow:hidden;width:100%">
            <tr>
              <td style="background:#171819;border-top:6px solid #d51f26;padding:28px 32px">
                <p style="color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:21px;font-weight:800;letter-spacing:.07em;line-height:1.2;margin:0 0 8px">OFFICINA BELVISO</p>
                <h1 style="color:#f1f1f1;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:500;line-height:1.4;margin:0">${escapeHtml(heading)}</h1>
              </td>
            </tr>
            <tr>
              <td class="email-content" style="color:#4a4c4e;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;padding:24px 32px 28px">
                È stata ricevuta una nuova comunicazione dal sito di Officina Belviso. I dati sono riportati di seguito.
              </td>
            </tr>
            ${content}
            <tr>
              <td class="email-content" style="background:#f6f6f6;border-top:1px solid #e3e3e3;color:#6b6d6f;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;padding:20px 32px;text-align:center">
                <strong style="color:#171819">Officina Belviso</strong><br>
                Viale Sindaco Gerardo De Caro 9/11, Zona P.I.P.<br>
                70016 Noicattaro (BA)<br><br>
                ${escapeHtml(automatedMessage)}<br>
                <a href="https://officinabelviso.it" style="color:#d51f26;text-decoration:underline">officinabelviso.it</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

function extensionOf(filename: string) {
  const extension = filename.split('.').pop()?.toLowerCase() ?? ''
  return /^[a-z0-9]{1,8}$/.test(extension) ? extension : ''
}

function sanitizeFilename(filename: string) {
  const basename = filename.split(/[\\/]/).pop() ?? 'allegato'
  const withoutControls = [...basename]
    .map((character) => {
      const codePoint = character.codePointAt(0) ?? 0
      return codePoint < 32 || codePoint === 127 ? '' : character
    })
    .join('')
  const cleaned = withoutControls
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9._ -]/g, '_')
    .replace(/\s+/g, ' ')
    .replace(/\.{2,}/g, '.')
    .trim()
    .slice(0, 120)
  return cleaned && cleaned !== '.' ? cleaned : 'allegato'
}

function startsWithBytes(bytes: Uint8Array, signature: number[]) {
  return signature.every((value, index) => bytes[index] === value)
}

async function hasExpectedSignature(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  if (file.type === 'image/jpeg') return startsWithBytes(bytes, [0xff, 0xd8, 0xff])
  if (file.type === 'image/png') {
    return startsWithBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  }
  if (file.type === 'image/webp') {
    return startsWithBytes(bytes, [0x52, 0x49, 0x46, 0x46])
      && startsWithBytes(bytes.slice(8), [0x57, 0x45, 0x42, 0x50])
  }
  if (file.type === 'application/pdf') {
    return startsWithBytes(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])
  }
  return false
}

async function validateAttachments(files: SubmittedFile[], kind: 'career' | 'quote') {
  const expectedField = kind === 'quote' ? 'photos' : 'cv'
  if (files.some(({ fieldName }) => fieldName !== expectedField)) {
    throw new RequestError(400)
  }

  if (kind === 'quote' && files.length > MAX_PHOTO_FILES) throw new RequestError(413)
  if (kind === 'career' && files.length > 1) throw new RequestError(413)

  const validated: ValidatedAttachment[] = []
  for (const { file } of files) {
    if (!file.size) throw new RequestError(400)
    const extension = extensionOf(file.name)

    if (kind === 'quote') {
      if (file.size > MAX_PHOTO_BYTES) throw new RequestError(413)
      const allowedExtensions = IMAGE_TYPES.get(file.type)
      if (!allowedExtensions?.has(extension)) throw new RequestError(415)
    } else {
      if (file.size > MAX_CV_BYTES) throw new RequestError(413)
      if (file.type !== 'application/pdf' || extension !== 'pdf') {
        throw new RequestError(415)
      }
    }

    if (!(await hasExpectedSignature(file))) throw new RequestError(415)
    validated.push({ file, filename: sanitizeFilename(file.name) })
  }
  return validated
}

async function parseBody(request: Request, kind: 'career' | 'quote'): Promise<ParsedSubmission> {
  const contentType = request.headers.get('Content-Type')?.split(';', 1)[0].trim().toLowerCase()
  const contentLength = Number(request.headers.get('Content-Length') ?? 0)
  const maximumRequestBytes = kind === 'quote'
    ? MAX_MULTIPART_QUOTE_BYTES
    : MAX_MULTIPART_CAREER_BYTES
  if (Number.isFinite(contentLength) && contentLength > maximumRequestBytes) {
    throw new RequestError(413)
  }

  if (contentType === 'application/json') {
    const text = await request.text()
    if (new TextEncoder().encode(text).byteLength > MAX_JSON_BODY_BYTES) {
      throw new RequestError(413)
    }

    try {
      const parsed: unknown = JSON.parse(text)
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new RequestError(400)
      }
      return { fields: parsed as JsonObject, files: [] }
    } catch (error) {
      if (error instanceof RequestError) throw error
      throw new RequestError(400)
    }
  }

  if (contentType !== 'multipart/form-data') throw new RequestError(415)

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    throw new RequestError(400)
  }

  const fields: JsonObject = {}
  const files: SubmittedFile[] = []
  let textBytes = 0
  formData.forEach((value, name) => {
    if (typeof value === 'string') {
      if (Object.hasOwn(fields, name)) throw new RequestError(400)
      textBytes += new TextEncoder().encode(value).byteLength
      if (textBytes > MAX_JSON_BODY_BYTES) throw new RequestError(413)
      fields[name] = value
    } else {
      files.push({ fieldName: name, file: value })
    }
  })

  return { fields, files }
}

function quoteEmail(body: JsonObject, attachments: ValidatedAttachment[]) {
  const firstName = stringField(body, 'firstName', 80, { required: true })
  const lastName = stringField(body, 'lastName', 80, { required: true })
  const company = stringField(body, 'company', 120)
  const email = stringField(body, 'email', 254)
  const phonePrefix = stringField(body, 'phonePrefix', 8, { required: true })
  const phonePrefixCountry = stringField(body, 'phonePrefixCountry', 3, { required: true })
  const phoneNumber = stringField(body, 'phoneNumber', 10, { required: true })
  const submittedPhone = stringField(body, 'phone', 24)
  const vehicleBrand = stringField(body, 'vehicleBrand', 80)
  const vehicleModel = stringField(body, 'vehicleModel', 100)
  const registrationYear = stringField(body, 'registrationYear', 4)
  const vin = stringField(body, 'vin', 50, { required: true })
  const licensePlate = stringField(body, 'licensePlate', 30)
  const vehicleRunning = stringField(body, 'vehicleRunning', 3, { required: true })
  const serviceType = stringField(body, 'serviceType', 400, { required: true })
  const problemDescription = stringField(body, 'problemDescription', 5000, {
    multiline: true,
    required: true,
  })

  validEmail(email, false)
  if (!/^\+\d{1,4}$/.test(phonePrefix) || !/^[A-Z]{2}$/.test(phonePrefixCountry)) {
    throw new RequestError(400)
  }
  if (!/^\d{6,10}$/.test(phoneNumber)) throw new RequestError(400)
  const phone = `${phonePrefix}${phoneNumber}`
  if (submittedPhone && submittedPhone !== phone) throw new RequestError(400)
  validPhone(phone)
  if (vehicleRunning !== 'yes' && vehicleRunning !== 'no') throw new RequestError(400)

  if (registrationYear) {
    const year = Number(registrationYear)
    if (!/^\d{4}$/.test(registrationYear) || year < 1900 || year > new Date().getUTCFullYear() + 1) {
      throw new RequestError(400)
    }
  }

  const selectedServices = serviceType.split(',').map((item) => item.trim()).filter(Boolean)
  if (!selectedServices.length || selectedServices.some((item) => !quoteServiceLabels.has(item))) {
    throw new RequestError(400)
  }
  requiredConsent(body)

  const sections: EmailSection[] = [
    {
      title: 'Dati cliente',
      rows: [
        { label: 'Nome', value: firstName },
        { label: 'Cognome', value: lastName },
        { label: 'Azienda', value: company },
        { label: 'Email', value: email },
        { label: 'Telefono', value: phone },
        { label: 'Paese del prefisso', value: phonePrefixCountry },
        { label: 'Informativa privacy', value: 'Accettata' },
      ],
    },
    {
      title: 'Dati veicolo',
      rows: [
        { label: 'Marca', value: vehicleBrand },
        { label: 'Modello', value: vehicleModel },
        { label: 'Anno di immatricolazione', value: registrationYear },
        { label: 'Targa', value: licensePlate },
        { label: 'Numero di telaio (VIN)', value: vin },
        { label: 'Veicolo marciante', value: vehicleRunning === 'yes' ? 'Sì' : 'No' },
      ],
    },
    {
      title: 'Intervento richiesto',
      variant: 'highlight',
      rows: [
        { label: 'Tipologia di intervento', value: selectedServices.join(', ') },
      ],
    },
    {
      title: 'Descrizione del problema',
      variant: 'highlight',
      rows: [
        { label: 'Descrizione del problema', value: problemDescription },
      ],
    },
    {
      title: 'Fotografie allegate',
      rows: attachments.map(({ filename }, index) => ({
        label: `Fotografia ${index + 1}`,
        value: filename,
      })),
    },
  ]

  const title = `Nuova richiesta di assistenza — ${firstName} ${lastName}`
  const contactActions: ContactActions = {
    callLabel: 'Chiama il cliente',
    firstName,
    phone,
    whatsappMessage: `Buongiorno ${firstName}, ti contattiamo da Officina Belviso in merito alla richiesta di assistenza inviata dal nostro sito.`,
    whatsappLabel: 'Scrivi su WhatsApp',
  }
  const automatedMessage = 'Questa email è stata generata automaticamente dal modulo di assistenza del sito.'
  return {
    html: renderHtml({
      automatedMessage,
      contactActions,
      heading: 'Nuova richiesta di assistenza',
      sections,
    }),
    replyTo: email,
    subject: title,
    text: `${title}\n\n${renderText(sections)}\n\n${renderContactText(contactActions)}\n\nOfficina Belviso\nViale Sindaco Gerardo De Caro 9/11, Zona P.I.P.\n70016 Noicattaro (BA)\n\n${automatedMessage}\nofficinabelviso.it`,
    to: 'assistenza@officinabelviso.it',
  }
}

function careerEmail(body: JsonObject, attachments: ValidatedAttachment[]) {
  const firstName = stringField(body, 'firstName', 80, { required: true })
  const lastName = stringField(body, 'lastName', 80, { required: true })
  const email = stringField(body, 'email', 254, { required: true })
  const submittedPhone = stringField(body, 'phone', 32, { required: true })
  const phonePrefix = stringField(body, 'phonePrefix', 8)
  const phonePrefixCountry = stringField(body, 'phonePrefixCountry', 3)
  const phoneNumber = stringField(body, 'phoneNumber', 10)
  const role = stringField(body, 'role', 120)
  const message = stringField(body, 'message', 5000, { multiline: true })

  validEmail(email, true)
  const hasStructuredPhone = Boolean(phonePrefix || phonePrefixCountry || phoneNumber)
  if (hasStructuredPhone) {
    if (!/^\+\d{1,4}$/.test(phonePrefix) || !/^[A-Z]{2}$/.test(phonePrefixCountry)) {
      throw new RequestError(400)
    }
    if (!/^\d{6,10}$/.test(phoneNumber)) throw new RequestError(400)
    if (submittedPhone !== `${phonePrefix}${phoneNumber}`) throw new RequestError(400)
  }
  const phone = hasStructuredPhone ? `${phonePrefix}${phoneNumber}` : submittedPhone
  validPhone(phone)
  requiredConsent(body)

  const sections: EmailSection[] = [
    {
      title: 'Dati candidato',
      rows: [
        { label: 'Nome', value: firstName },
        { label: 'Cognome', value: lastName },
        { label: 'Email', value: email },
        { label: 'Telefono', value: phone },
        { label: 'Informativa privacy', value: 'Accettata' },
      ],
    },
    {
      title: 'Candidatura',
      rows: [
        { label: 'Posizione di interesse', value: role },
      ],
    },
    {
      title: 'Presentazione',
      variant: 'highlight',
      rows: [
        { label: 'Presentazione', value: message },
      ],
    },
    {
      title: 'Curriculum allegato',
      rows: attachments.map(({ filename }) => ({
        label: 'Nome file',
        value: filename,
      })),
    },
  ]

  const title = `Nuova candidatura — ${firstName} ${lastName}`
  const contactActions: ContactActions = {
    callLabel: 'Chiama il candidato',
    firstName,
    phone,
    whatsappMessage: `Buongiorno ${firstName}, ti contattiamo da Officina Belviso in merito alla candidatura inviata dal nostro sito.`,
    whatsappLabel: 'Scrivi su WhatsApp',
  }
  const automatedMessage = 'Questa email è stata generata automaticamente dal modulo Lavora con noi del sito.'
  return {
    html: renderHtml({
      automatedMessage,
      contactActions,
      heading: 'Nuova candidatura',
      sections,
    }),
    replyTo: email,
    subject: title,
    text: `${title}\n\n${renderText(sections)}\n\n${renderContactText(contactActions)}\n\nOfficina Belviso\nViale Sindaco Gerardo De Caro 9/11, Zona P.I.P.\n70016 Noicattaro (BA)\n\n${automatedMessage}\nofficinabelviso.it`,
    to: 'info@officinabelviso.it',
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer)
  const chunkSize = 0x8000
  let binary = ''
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize))
  }
  return btoa(binary)
}

async function resendAttachments(attachments: ValidatedAttachment[]) {
  return Promise.all(attachments.map(async ({ file, filename }) => ({
    content: arrayBufferToBase64(await file.arrayBuffer()),
    filename,
  })))
}

async function sendEmail(request: Request, env: Env, kind: 'career' | 'quote') {
  const submission = await parseBody(request, kind)
  const body = submission.fields
  const honeypot = stringField(body, 'website', 200)
  if (honeypot) return jsonResponse(200, { ok: true })

  const attachments = await validateAttachments(submission.files, kind)

  if (!env.RESEND_API_KEY) {
    console.error('Resend configuration is missing')
    return jsonResponse(500, { ok: false })
  }

  const email = kind === 'quote'
    ? quoteEmail(body, attachments)
    : careerEmail(body, attachments)
  const resendPayload: JsonObject = {
    from: EMAIL_FROM,
    to: [email.to],
    subject: email.subject,
    html: email.html,
    text: email.text,
  }
  if (email.replyTo) resendPayload.reply_to = email.replyTo
  if (attachments.length) resendPayload.attachments = await resendAttachments(attachments)

  let resendResponse: Response
  try {
    resendResponse = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resendPayload),
    })
  } catch {
    console.error('Resend request could not be completed')
    return jsonResponse(502, { ok: false })
  }

  if (!resendResponse.ok) {
    console.error('Resend request failed', { status: resendResponse.status })
    return jsonResponse(502, { ok: false })
  }

  return jsonResponse(200, { ok: true })
}

export default {
  async fetch(request: Request, env: Env) {
    const { pathname } = new URL(request.url)

    if (pathname === '/api/contact' || pathname === '/api/careers') {
      if (request.method !== 'POST') {
        const response = jsonResponse(405, { ok: false })
        response.headers.set('Allow', 'POST')
        return response
      }

      try {
        return await sendEmail(
          request,
          env,
          pathname === '/api/contact' ? 'quote' : 'career',
        )
      } catch (error) {
        if (error instanceof RequestError) {
          return jsonResponse(error.status, { ok: false })
        }
        console.error('Unexpected form submission error')
        return jsonResponse(500, { ok: false })
      }
    }

    if (pathname.startsWith('/api/')) return jsonResponse(404, { ok: false })
    return env.ASSETS.fetch(request)
  },
}
