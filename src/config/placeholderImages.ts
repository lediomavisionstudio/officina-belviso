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
      src: '/assets/home-hero-officina-panoramica.png?v=1',
    },
    sourceUrl: '/assets/home-hero-officina-panoramica.png',
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
        src: '/assets/services/impianto-frenante.png',
      },
      sourceUrl: '/assets/services/impianto-frenante.png',
    },
    {
      image: {
        alt: 'Tecnico di Officina Belviso durante un intervento sull’impianto ad aria compressa',
        objectPosition: '50% 30%',
        src: '/assets/services/servizio-aria-compressa.png',
      },
      sourceUrl: '/assets/services/servizio-aria-compressa.png',
    },
    {
      image: {
        alt: 'Tecnico di Officina Belviso durante una diagnosi EBS e ABS su un veicolo industriale',
        objectPosition: '50% 52%',
        src: '/assets/services/servizio-diagnosi-ebs-abs.png',
      },
      sourceUrl: '/assets/services/servizio-diagnosi-ebs-abs.png',
    },
    {
      image: {
        alt: 'Veicolo industriale sottoposto a diagnosi ECAS presso Officina Belviso',
        objectPosition: '50% 58%',
        src: '/assets/services/servizio-diagnosi-ecas.png',
      },
      sourceUrl: '/assets/services/servizio-diagnosi-ecas.png',
    },
    {
      image: {
        alt: 'Sospensioni di un veicolo industriale durante un intervento in officina',
        objectPosition: '50% 50%',
        src: '/assets/services/servizio-sospensioni.png',
      },
      sourceUrl: '/assets/services/servizio-sospensioni.png',
    },
    {
      image: {
        alt: 'Veicolo industriale presso la sede di Officina Belviso',
        objectPosition: '50% 41%',
        src: '/assets/services/manutenzione-veicoli-industriali.png',
      },
      sourceUrl: '/assets/services/manutenzione-veicoli-industriali.png',
    },
  ],
  works: [
    {
      image: {
        alt: 'Tecnico di Officina Belviso durante una diagnosi elettronica',
        objectPosition: '50% 48%',
        src: '/assets/works/lavoro-diagnosi-elettronica.png',
      },
      sourceUrl: '/assets/works/lavoro-diagnosi-elettronica.png',
    },
    {
      image: {
        alt: 'Impianti frenanti di un veicolo industriale durante un intervento in officina',
        src: '/assets/works/sistemi-frenanti.png',
      },
      sourceUrl: '/assets/works/sistemi-frenanti.png',
    },
    {
      image: {
        alt: 'Modulo di controllo per impianti pneumatici di veicoli industriali',
        objectPosition: '50% 18%',
        src: '/assets/works/impianti-pneumatici.png',
      },
      sourceUrl: '/assets/works/impianti-pneumatici.png',
    },
    {
      image: {
        alt: 'Tecnico di Officina Belviso durante un intervento sulle sospensioni',
        objectPosition: '50% 30%',
        src: '/assets/works/lavoro-sospensioni.png',
      },
      sourceUrl: '/assets/works/lavoro-sospensioni.png',
    },
    {
      image: {
        alt: 'Tecnico di Officina Belviso durante un intervento di manutenzione programmata',
        src: '/assets/works/manutenzione-programmata.png',
      },
      sourceUrl: '/assets/works/manutenzione-programmata.png',
    },
  ],
  career: pexelsPhoto(
    7018506,
    'https://www.pexels.com/photo/auto-mechanics-at-work-7018506/',
    'Squadra di tecnici al lavoro sotto un veicolo industriale',
    '52% center',
  ),
} as const
