export const CONSENT_COOKIE_NAME = 'belviso_cookie_consent'
export const CONSENT_VERSION = '2'
export const CONSENT_DURATION_DAYS = 183

export type ConsentCategory =
  | 'necessary'
  | 'preferences'
  | 'analytics'
  | 'marketing'
  | 'externalMedia'

export type ConsentCategories = Record<ConsentCategory, boolean>

export type StoredConsent = ConsentCategories & {
  consentId: string
  updatedAt: string
  version: string
}

export type RegistryEntry = {
  category: ConsentCategory
  duration: string
  firstParty: boolean
  id: string
  kind: 'cookie' | 'service'
  name: string
  policyUrl?: string
  provider: string
  purpose: string
  removableCookieNames: readonly string[]
}

export type ExternalResourceAuditEntry = {
  category: 'external-resource'
  duration: string
  firstParty: false
  id: string
  loadedBeforeConsent: boolean
  name: string
  policyUrl: string
  provider: string
  purpose: string
  storageDetected: boolean
}

export const defaultConsentCategories: ConsentCategories = {
  necessary: true,
  preferences: false,
  analytics: false,
  marketing: false,
  externalMedia: false,
}

export const consentCategoryDetails = {
  necessary: {
    label: 'Cookie necessari',
    description:
      'Necessari per il funzionamento e la sicurezza del sito e per memorizzare le preferenze relative ai cookie.',
  },
  preferences: {
    label: 'Preferenze',
    description:
      'Memorizzano scelte facoltative dell’utente. Nessun servizio di questa categoria è attualmente attivo.',
  },
  analytics: {
    label: 'Analitici',
    description:
      'Consentono misurazioni statistiche facoltative. Nessun sistema analytics è attualmente installato.',
  },
  marketing: {
    label: 'Marketing',
    description:
      'Consentono profilazione o pubblicità personalizzata. Nessun sistema marketing è attualmente installato.',
  },
  externalMedia: {
    label: 'Contenuti esterni',
    description:
      'Permettono di caricare servizi incorporati di terze parti, attualmente Google Maps.',
  },
} as const satisfies Record<
  ConsentCategory,
  { description: string; label: string }
>

export const cookieRegistry = {
  necessary: [
    {
      id: 'belviso-consent-preferences',
      name: CONSENT_COOKIE_NAME,
      provider: 'Officina Belviso S.N.C.',
      purpose: 'Memorizza la versione e le categorie di consenso selezionate.',
      category: 'necessary',
      duration: `${CONSENT_DURATION_DAYS} giorni`,
      firstParty: true,
      kind: 'cookie',
      policyUrl: undefined,
      removableCookieNames: [],
    },
  ],
  preferences: [],
  analytics: [],
  marketing: [],
  externalMedia: [
    {
      id: 'google-maps-embed',
      name: 'Google Maps Embed',
      provider: 'Google LLC',
      purpose: 'Mostra la posizione dell’officina tramite una mappa incorporata.',
      category: 'externalMedia',
      duration:
        'Gestita dal fornitore; TODO: verificare periodicamente la configurazione e le durate dichiarate da Google.',
      firstParty: false,
      kind: 'service',
      policyUrl: 'https://policies.google.com/privacy',
      removableCookieNames: [],
    },
  ],
} as const satisfies Record<ConsentCategory, readonly RegistryEntry[]>

export const externalResourceAudit = [
  {
    id: 'pexels-image-cdn',
    name: 'Pexels Image CDN',
    provider: 'Pexels, brand di Canva Germany GmbH',
    purpose:
      'Distribuisce le fotografie temporanee utilizzate nelle sezioni del sito.',
    category: 'external-resource',
    duration: 'Nessuna durata di storage applicativo rilevata nel browser.',
    firstParty: false,
    loadedBeforeConsent: true,
    storageDetected: false,
    policyUrl: 'https://www.pexels.com/privacy-policy/',
  },
] as const satisfies readonly ExternalResourceAuditEntry[]

export const cookiePolicyMetadata = {
  version: CONSENT_VERSION,
  updatedAt: '2 settembre 2026',
} as const

export function createConsent(
  categories: ConsentCategories,
): StoredConsent {
  const consentId =
    typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `consent-${Date.now()}-${Math.random().toString(36).slice(2)}`

  return {
    ...categories,
    necessary: true,
    consentId,
    updatedAt: new Date().toISOString(),
    version: CONSENT_VERSION,
  }
}

export function readStoredConsent(): StoredConsent | null {
  const cookie = document.cookie
    .split('; ')
    .find((item) => item.startsWith(`${CONSENT_COOKIE_NAME}=`))

  if (!cookie) return null

  try {
    const parsed = JSON.parse(
      decodeURIComponent(cookie.slice(CONSENT_COOKIE_NAME.length + 1)),
    ) as Partial<StoredConsent>
    const hasValidCategories = (
      ['preferences', 'analytics', 'marketing', 'externalMedia'] as const
    ).every((category) => typeof parsed[category] === 'boolean')

    if (
      parsed.version !== CONSENT_VERSION ||
      parsed.necessary !== true ||
      typeof parsed.consentId !== 'string' ||
      typeof parsed.updatedAt !== 'string' ||
      !hasValidCategories
    ) {
      return null
    }

    return parsed as StoredConsent
  } catch {
    return null
  }
}

export function writeStoredConsent(consent: StoredConsent) {
  const maxAge = CONSENT_DURATION_DAYS * 24 * 60 * 60
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${CONSENT_COOKIE_NAME}=${encodeURIComponent(
    JSON.stringify(consent),
  )}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`
}

export function clearRevokedCategoryCookies(
  previous: StoredConsent | null,
  next: StoredConsent,
) {
  ;(
    ['preferences', 'analytics', 'marketing', 'externalMedia'] as const
  ).forEach((category) => {
    if (!previous?.[category] || next[category]) return

    cookieRegistry[category].forEach((entry) => {
      entry.removableCookieNames.forEach((name) => {
        document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`
      })
    })
  })
}
