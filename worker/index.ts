interface AssetsBinding {
  fetch(request: Request): Promise<Response>
}

interface Env {
  ASSETS: AssetsBinding
  RESEND_API_KEY?: string
}

type JsonObject = Record<string, unknown>

type EmailRow = {
  label: string
  value: string
}

type EmailSection = {
  title: string
  rows: EmailRow[]
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
const MAX_BODY_BYTES = 32 * 1024
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
  if (body.privacy !== true) throw new RequestError(400)
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

function displayValue(value: string) {
  return value || 'Non indicato'
}

function renderText(sections: EmailSection[]) {
  return sections
    .map((section) => [
      section.title.toUpperCase(),
      ...section.rows.map((row) => `${row.label}: ${displayValue(row.value)}`),
    ].join('\n'))
    .join('\n\n')
}

function renderHtml(title: string, sections: EmailSection[]) {
  const content = sections.map((section) => `
    <section style="margin:0 0 24px">
      <h2 style="font-size:18px;margin:0 0 12px;color:#1f2937">${escapeHtml(section.title)}</h2>
      <table role="presentation" style="border-collapse:collapse;width:100%">
        ${section.rows.map((row) => `
          <tr>
            <th style="border-bottom:1px solid #e5e7eb;padding:8px 12px 8px 0;text-align:left;vertical-align:top;width:38%;color:#4b5563">${escapeHtml(row.label)}</th>
            <td style="border-bottom:1px solid #e5e7eb;padding:8px 0;white-space:pre-wrap;color:#111827">${escapeHtml(displayValue(row.value))}</td>
          </tr>`).join('')}
      </table>
    </section>`).join('')

  return `<!doctype html><html lang="it"><body style="font-family:Arial,sans-serif;line-height:1.5;margin:0;padding:24px;background:#f3f4f6;color:#111827"><main style="max-width:680px;margin:auto;padding:28px;background:#fff;border-radius:12px"><h1 style="font-size:24px;margin:0 0 24px">${escapeHtml(title)}</h1>${content}</main></body></html>`
}

async function parseBody(request: Request) {
  const contentType = request.headers.get('Content-Type')?.split(';', 1)[0].trim().toLowerCase()
  if (contentType !== 'application/json') throw new RequestError(415)

  const contentLength = Number(request.headers.get('Content-Length') ?? 0)
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    throw new RequestError(413)
  }

  const text = await request.text()
  if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) {
    throw new RequestError(413)
  }

  try {
    const parsed: unknown = JSON.parse(text)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new RequestError(400)
    }
    return parsed as JsonObject
  } catch (error) {
    if (error instanceof RequestError) throw error
    throw new RequestError(400)
  }
}

function quoteEmail(body: JsonObject) {
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
        { label: 'Prefisso / Paese', value: `${phonePrefix} (${phonePrefixCountry})` },
      ],
    },
    {
      title: 'Dati veicolo',
      rows: [
        { label: 'Marca', value: vehicleBrand },
        { label: 'Modello', value: vehicleModel },
        { label: 'Anno di immatricolazione', value: registrationYear },
        { label: 'Numero di telaio (VIN)', value: vin },
        { label: 'Targa', value: licensePlate },
        { label: 'Veicolo marciante', value: vehicleRunning === 'yes' ? 'Sì' : 'No' },
      ],
    },
    {
      title: 'Problema e intervento richiesto',
      rows: [
        { label: 'Tipologia di intervento', value: selectedServices.join(', ') },
        { label: 'Descrizione del problema', value: problemDescription },
        { label: 'Privacy', value: 'Accettata' },
      ],
    },
  ]

  const title = `Nuova richiesta assistenza – ${firstName} ${lastName}`
  return {
    html: renderHtml(title, sections),
    replyTo: email,
    subject: title,
    text: `${title}\n\n${renderText(sections)}`,
    to: 'assistenza@officinabelviso.it',
  }
}

function careerEmail(body: JsonObject) {
  const firstName = stringField(body, 'firstName', 80, { required: true })
  const lastName = stringField(body, 'lastName', 80, { required: true })
  const email = stringField(body, 'email', 254, { required: true })
  const phone = stringField(body, 'phone', 32, { required: true })
  const role = stringField(body, 'role', 120)
  const message = stringField(body, 'message', 5000, { multiline: true })

  validEmail(email, true)
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
      ],
    },
    {
      title: 'Candidatura',
      rows: [
        { label: 'Posizione di interesse', value: role },
        { label: 'Presentazione', value: message },
        { label: 'Privacy', value: 'Accettata' },
      ],
    },
  ]

  const title = `Nuova candidatura – ${firstName} ${lastName}`
  return {
    html: renderHtml(title, sections),
    replyTo: email,
    subject: title,
    text: `${title}\n\n${renderText(sections)}`,
    to: 'info@officinabelviso.it',
  }
}

async function sendEmail(request: Request, env: Env, kind: 'career' | 'quote') {
  const body = await parseBody(request)
  const honeypot = stringField(body, 'website', 200)
  if (honeypot) return jsonResponse(200, { ok: true })

  if (!env.RESEND_API_KEY) {
    console.error('Resend configuration is missing')
    return jsonResponse(500, { ok: false })
  }

  const email = kind === 'quote' ? quoteEmail(body) : careerEmail(body)
  const resendPayload: JsonObject = {
    from: EMAIL_FROM,
    to: [email.to],
    subject: email.subject,
    html: email.html,
    text: email.text,
  }
  if (email.replyTo) resendPayload.reply_to = email.replyTo

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
