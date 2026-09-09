export type AboutImage = {
  alt: string
  id: 'nonno' | 'targhetta' | 'selfie' | 'squadra' | 'furgone'
  label: string
  mobileSrc: string
  objectPosition: string
  src: string
}

export const ABOUT_CAROUSEL_INTERVAL_MS = 3000

export const aboutImages: readonly AboutImage[] = [
  {
    id: 'nonno',
    label: 'Nonno',
    mobileSrc: '/assets/about/chi-siamo-nonno.jpg',
    src: '/assets/about/chi-siamo-nonno.png',
    alt: 'Felice Belviso, fondatore di Officina Belviso',
    objectPosition: '50% 34%',
  },
  {
    id: 'targhetta',
    label: 'Targhetta',
    mobileSrc: '/assets/about/chi-siamo-targhetta.jpg',
    src: '/assets/about/chi-siamo-targhetta.png',
    alt: 'Il team di Officina Belviso con la targa Mech Point',
    objectPosition: '50% 54%',
  },
  {
    id: 'selfie',
    label: 'Selfie',
    mobileSrc: '/assets/about/chi-siamo-selfie.jpg',
    src: '/assets/about/chi-siamo-selfie.png',
    alt: 'Il team di Officina Belviso davanti al furgone aziendale',
    objectPosition: '50% 48%',
  },
  {
    id: 'squadra',
    label: 'Squadra',
    mobileSrc: '/assets/about/chi-siamo-squadra.jpg',
    src: '/assets/about/chi-siamo-squadra.png',
    alt: 'Il team di Officina Belviso all’interno dell’officina',
    objectPosition: '50% 50%',
  },
  {
    id: 'furgone',
    label: 'Furgone',
    mobileSrc: '/assets/about/chi-siamo-furgone.jpg',
    src: '/assets/about/chi-siamo-furgone.png',
    alt: 'Il furgone di Officina Belviso davanti alla sede',
    objectPosition: '38% 50%',
  },
] as const
