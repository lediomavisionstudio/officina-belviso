export type PlaceholderPhoto = {
  image: {
    alt: string
    objectPosition?: string
    src: string
    srcSet?: string
  }
  sourceUrl: string
}

const responsiveWidths = [640, 960, 1280, 1920]

function pexelsPhoto(
  id: number,
  sourceUrl: string,
  alt: string,
  objectPosition = 'center',
): PlaceholderPhoto {
  const baseUrl = `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg`
  const urlForWidth = (width: number) =>
    `${baseUrl}?auto=compress&cs=tinysrgb&w=${width}`

  return {
    image: {
      alt,
      objectPosition,
      src: urlForWidth(1280),
      srcSet: responsiveWidths
        .map((width) => `${urlForWidth(width)} ${width}w`)
        .join(', '),
    },
    sourceUrl,
  }
}

export const placeholderImageSource = {
  provider: 'Pexels',
  licenseUrl: 'https://www.pexels.com/legal-pages/license/',
} as const

export const placeholderImages = {
  hero: {
    image: {
      alt: 'Tecnico al lavoro sull\u2019impianto di un veicolo industriale',
      src: '/assets/home-hero-officina-panoramica.webp?v=1',
    },
    sourceUrl: '/assets/home-hero-officina-panoramica.webp',
  },
  about: pexelsPhoto(
    7019371,
    'https://www.pexels.com/photo/auto-mechanic-working-on-car-shop-7019371/',
    'Tecnici al lavoro su veicoli industriali in officina',
    '58% center',
  ),
  services: [
    {
      image: {
        alt: 'Tecnico di Officina Belviso durante un intervento sull’impianto frenante',
        objectPosition: '50% 32%',
        src: '/assets/services/impianto-frenante.webp',
      },
      sourceUrl: '/assets/services/impianto-frenante.webp',
    },
    {
      image: {
        alt: 'Tecnico di Officina Belviso durante un intervento sull’impianto ad aria compressa',
        objectPosition: '50% 30%',
        src: '/assets/services/servizio-aria-compressa.webp',
      },
      sourceUrl: '/assets/services/servizio-aria-compressa.webp',
    },
    {
      image: {
        alt: 'Tecnico di Officina Belviso durante una diagnosi EBS e ABS su un veicolo industriale',
        objectPosition: '50% 52%',
        src: '/assets/services/servizio-diagnosi-ebs-abs.webp',
      },
      sourceUrl: '/assets/services/servizio-diagnosi-ebs-abs.webp',
    },
    {
      image: {
        alt: 'Veicolo industriale sottoposto a diagnosi ECAS presso Officina Belviso',
        objectPosition: '50% 58%',
        src: '/assets/services/servizio-diagnosi-ecas.webp',
      },
      sourceUrl: '/assets/services/servizio-diagnosi-ecas.webp',
    },
    {
      image: {
        alt: 'Sospensioni di un veicolo industriale durante un intervento in officina',
        objectPosition: '50% 50%',
        src: '/assets/services/servizio-sospensioni.webp',
      },
      sourceUrl: '/assets/services/servizio-sospensioni.webp',
    },
    {
      image: {
        alt: 'Veicolo industriale presso la sede di Officina Belviso',
        objectPosition: '50% 41%',
        src: '/assets/services/manutenzione-veicoli-industriali.webp',
      },
      sourceUrl: '/assets/services/manutenzione-veicoli-industriali.webp',
    },
  ],
  works: [
    {
      image: {
        alt: 'Tecnico di Officina Belviso durante una diagnosi elettronica',
        objectPosition: '50% 48%',
        src: '/assets/works/lavoro-diagnosi-elettronica.webp',
      },
      sourceUrl: '/assets/works/lavoro-diagnosi-elettronica.webp',
    },
    {
      image: {
        alt: 'Impianti frenanti di un veicolo industriale durante un intervento in officina',
        src: '/assets/works/sistemi-frenanti.webp',
      },
      sourceUrl: '/assets/works/sistemi-frenanti.webp',
    },
    {
      image: {
        alt: 'Modulo di controllo per impianti pneumatici di veicoli industriali',
        objectPosition: '50% 18%',
        src: '/assets/works/impianti-pneumatici.webp',
      },
      sourceUrl: '/assets/works/impianti-pneumatici.webp',
    },
    {
      image: {
        alt: 'Tecnico di Officina Belviso durante un intervento sulle sospensioni',
        objectPosition: '50% 30%',
        src: '/assets/works/lavoro-sospensioni.webp',
      },
      sourceUrl: '/assets/works/lavoro-sospensioni.webp',
    },
    {
      image: {
        alt: 'Tecnico di Officina Belviso durante un intervento di manutenzione programmata',
        src: '/assets/works/manutenzione-programmata.webp',
      },
      sourceUrl: '/assets/works/manutenzione-programmata.webp',
    },
  ],
  career: pexelsPhoto(
    7018506,
    'https://www.pexels.com/photo/auto-mechanics-at-work-7018506/',
    'Squadra di tecnici al lavoro sotto un veicolo industriale',
    '52% center',
  ),
} as const
