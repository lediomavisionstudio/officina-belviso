export const serviceDefinitions = [
  {
    id: 'brakes',
    title: 'Impianto frenante',
    quoteLabel: 'Impianto frenante',
    description:
      'Diagnosi, manutenzione e riparazione degli impianti frenanti, con verifiche mirate a sicurezza, efficienza e affidabilità.',
  },
  {
    id: 'compressed-air',
    title: 'Aria compressa',
    quoteLabel: 'Aria compressa',
    description:
      'Controllo di compressori, valvole, tubazioni e circuiti pneumatici per individuare perdite, anomalie e cali di pressione.',
  },
  {
    id: 'abs',
    title: 'Diagnosi ABS',
    quoteLabel: 'Diagnosi ABS',
    description:
      'Analisi elettronica del sistema antibloccaggio, verifica dei sensori e individuazione delle anomalie che possono compromettere la frenata.',
  },
  {
    id: 'ebs',
    title: 'Diagnosi EBS',
    quoteLabel: 'Diagnosi EBS',
    description:
      'Controllo del sistema frenante elettronico e dei suoi componenti per identificare guasti e ripristinare un funzionamento corretto.',
  },
  {
    id: 'ecas',
    title: 'Diagnosi ECAS',
    quoteLabel: 'Diagnosi ECAS',
    description:
      'Verifica della gestione elettronica delle sospensioni pneumatiche, dei sensori e dei dispositivi di regolazione dell’assetto.',
  },
  {
    id: 'suspension',
    title: 'Sospensioni',
    quoteLabel: 'Sospensioni',
    description:
      'Manutenzione e riparazione dei sistemi di sospensione meccanici e pneumatici per preservare stabilità, comfort e controllo.',
  },
  {
    id: 'maintenance',
    title: 'Manutenzione veicoli industriali',
    quoteLabel: 'Manutenzione programmata',
    description:
      'Controlli periodici e interventi programmati per prevenire anomalie, ridurre i fermi e mantenere il veicolo efficiente.',
  },
] as const

export type ServiceId = (typeof serviceDefinitions)[number]['id']
export type QuoteServiceId = ServiceId | 'other'

export const quoteServiceOptions: Array<{
  label: string
  value: QuoteServiceId
}> = [
  ...serviceDefinitions.map(({ id, quoteLabel }) => ({
    label: quoteLabel,
    value: id,
  })),
  { label: 'Altro', value: 'other' },
]

const serviceIds = new Set<string>(serviceDefinitions.map(({ id }) => id))
const quoteServiceIds = new Set<string>(
  quoteServiceOptions.map(({ value }) => value),
)

export function isServiceId(value: unknown): value is ServiceId {
  return typeof value === 'string' && serviceIds.has(value)
}

export function isQuoteServiceId(value: unknown): value is QuoteServiceId {
  return typeof value === 'string' && quoteServiceIds.has(value)
}
