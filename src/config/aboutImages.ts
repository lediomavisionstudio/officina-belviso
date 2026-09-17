export type AboutImage = {
  alt: string
  id: 'nonno' | 'targhetta' | 'selfie' | 'squadra' | 'furgone'
  label: string
  objectPosition: string
  src: string
}

export const ABOUT_CAROUSEL_INTERVAL_MS = 3000

export const aboutImages: readonly AboutImage[] = [
  {
    id: 'nonno',
    label: 'Nonno',
    src: '/assets/about/chi-siamo-nonno.webp',
    alt: 'Felice Belviso, fondatore di Officina Belviso',
    objectPosition: '50% 34%',
  },
  {
    id: 'targhetta',
    label: 'Targhetta',
    src: '/assets/about/chi-siamo-targhetta.webp',
    alt: 'Il team di Officina Belviso con la targa Mech Point',
    objectPosition: '50% 54%',
  },
  {
    id: 'selfie',
    label: 'Selfie',
    src: '/assets/about/chi-siamo-selfie.webp',
    alt: 'Il team di Officina Belviso davanti al furgone aziendale',
    objectPosition: '50% 48%',
  },
  {
    id: 'squadra',
    label: 'Squadra',
    src: '/assets/about/chi-siamo-squadra.webp',
    alt: 'Il team di Officina Belviso all’interno dell’officina',
    objectPosition: '50% 50%',
  },
  {
    id: 'furgone',
    label: 'Furgone',
    src: '/assets/about/chi-siamo-furgone.webp',
    alt: 'Il furgone di Officina Belviso davanti alla sede',
    objectPosition: '38% 50%',
  },
] as const
