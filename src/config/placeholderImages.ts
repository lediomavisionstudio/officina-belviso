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
    pexelsPhoto(30470930, 'https://www.pexels.com/photo/automotive-brake-maintenance-in-workshop-30470930/', 'Dettaglio di un intervento professionale su un impianto frenante'),
    pexelsPhoto(9754814, 'https://www.pexels.com/photo/an-air-compressor-9754814/', 'Compressore d\u2019aria in un ambiente di lavoro industriale', '50% 55%'),
    pexelsPhoto(7564861, 'https://www.pexels.com/photo/mechanic-repairing-a-truck-engine-7564861/', 'Meccanico impegnato nella riparazione del motore di un camion', '50% 42%'),
    pexelsPhoto(7564860, 'https://www.pexels.com/photo/car-mechanic-at-work-7564860/', 'Tecnico al lavoro sui sistemi meccanici di un veicolo industriale', '58% 62%'),
    pexelsPhoto(6720515, 'https://www.pexels.com/photo/a-man-holding-a-tire-6720515/', 'Tecnico durante la manutenzione di una ruota per veicoli pesanti', '50% 45%'),
    pexelsPhoto(33814735, 'https://www.pexels.com/photo/mechanic-working-on-car-in-auto-workshop-33814735/', 'Officina moderna attrezzata per interventi di manutenzione', '35% center'),
  ],
  works: [
    pexelsPhoto(7006667, 'https://www.pexels.com/photo/a-person-fixing-a-truck-7006667/', 'Camion rosso durante un intervento tecnico in officina'),
    pexelsPhoto(7541360, 'https://www.pexels.com/photo/person-fixing-a-truck-7541360/', 'Intervento professionale sul motore di un camion industriale', '72% center'),
    pexelsPhoto(8985910, 'https://www.pexels.com/photo/set-of-tools-in-a-workshop-8985910/', 'Utensili professionali preparati per un intervento di precisione', '50% 58%'),
    pexelsPhoto(8985603, 'https://www.pexels.com/photo/mechanic-removing-a-tire-8985603/', 'Tecnico durante un intervento su ruota e sospensioni', '50% 48%'),
    pexelsPhoto(12203657, 'https://www.pexels.com/photo/men-beside-a-truck-12203657/', 'Tecnici impegnati nella manutenzione di un camion'),
  ],
  career: pexelsPhoto(
    7018506,
    'https://www.pexels.com/photo/auto-mechanics-at-work-7018506/',
    'Squadra di tecnici al lavoro sotto un veicolo industriale',
    '52% center',
  ),
} as const
