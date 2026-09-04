export { serviceDefinitions as homeServices } from '../config/services'

export const gallerySlots = [
  {
    title: 'Diagnosi elettronica',
    description:
      'Analisi dei sistemi di bordo per individuare le anomalie e definire con precisione le attività necessarie.',
  },
  {
    title: 'Sistemi frenanti',
    description:
      'Verifiche e interventi dedicati al ripristino dell’efficienza e dell’affidabilità dell’impianto frenante.',
  },
  {
    title: 'Impianti pneumatici',
    description:
      'Controllo dei circuiti ad aria compressa e ricerca delle cause di perdite, anomalie o cali di pressione.',
  },
  {
    title: 'Sospensioni',
    description:
      'Manutenzione dei componenti meccanici e pneumatici che contribuiscono a stabilità, assetto e comfort del veicolo.',
  },
  {
    title: 'Manutenzione programmata',
    description:
      'Controlli periodici organizzati per preservare l’efficienza del mezzo e limitare il rischio di fermi imprevisti.',
  },
]

export const brandSlots = [
  {
    className: 'brand-slot--haldex',
    label: 'Haldex Brake System',
    src: '/assets/brands/logo-haldex-brake-system.png',
  },
  {
    className: 'brand-slot--knorr-bremse',
    label: 'Knorr-Bremse Officina Autorizzata',
    src: '/assets/brands/logo-knorr-bremse-officina-autorizzata.png',
  },
  {
    className: 'brand-slot--wabco',
    label: 'WABCO Service Partner',
    src: '/assets/brands/logo-wabco-service-partner.png',
  },
] as const
