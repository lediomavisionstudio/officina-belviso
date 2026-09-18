import type { SiteConfig } from '../types/site'

const googleReviewsUrl =
  'https://www.google.com/maps/search/?api=1&query=Officina%20Belviso%20S.N.C.%2C%20Viale%20Sindaco%20Gerardo%20Decaro%209%2F11%2C%2070016%20Noicattaro%20BA'

export const siteConfig = {
  name: 'Officina Belviso',
  description:
    'Manutenzione e riparazione per veicoli industriali, con attenzione alla sicurezza e alla continuità operativa.',
  siteUrl: 'https://officinabelviso.it',
  business: {
    fiscalCode: '033776520726',
    vatNumber: '033776520726',
    pec: 'belviso.snc@pec.it',
    recipientCode: 'KRRH6B9',
  },
  contact: {
    companyName: 'Officina Belviso S.N.C.',
    address: [
      'Viale Sindaco Gerardo Decaro 9/11, Zona P.I.P.',
      '70016 Noicattaro (BA)',
    ],
    phone: '080 4783792',
    email: 'belviso.snc@virgilio.it',
  },
  openingHours: [
    { day: 'Lunedì', periods: ['08:00 - 13:00', '15:00 - 19:00'] },
    { day: 'Martedì', periods: ['08:00 - 13:00', '15:00 - 19:00'] },
    { day: 'Mercoledì', periods: ['08:00 - 13:00', '15:00 - 19:00'] },
    { day: 'Giovedì', periods: ['08:00 - 13:00', '15:00 - 19:00'] },
    { day: 'Venerdì', periods: ['08:00 - 13:00', '15:00 - 19:00'] },
    { day: 'Sabato', periods: ['08:00 - 13:00'] },
    { day: 'Domenica', periods: ['Chiuso'] },
  ],
  social: {
    facebook: 'https://www.facebook.com/officinabelviso',
    instagram: 'https://www.instagram.com/officina.belviso?igsi=cGR5cmtxd2k1YWJ1&utm_source=qr',
    linkedin: null,
    whatsapp: null,
  },
  credits: {
    label: 'Ledioma Vision Studio',
    url: 'https://1.lediomavisionstudio.workers.dev/',
  },
  googleBusiness: {
    rating: 4.9,
    reviewCount: 29,
    profileUrl: googleReviewsUrl,
    writeReviewUrl: googleReviewsUrl,
    reviews: [
      {
        author: 'Vito Giuliano',
        rating: 5,
        text: 'Sei un autista di mezzi pesanti? Vuoi che il tuo mezzo sia affidabile per ogni viaggio? Bene sei nei posto giusto, troverai all\'interno di questa officina …',
      },
      {
        author: 'Mark Belvis',
        rating: 5,
        text: 'Grande officina con grandi lavoratori:Pino,Enzo,Nico e Gabriele Belviso. Andate forti.Da Marco!!!',
      },
      {
        author: 'Davide Ricci',
        rating: 5,
        text: 'Personale serio rapido ed efficiente',
      },
    ],
  },
  googleMapsUrl:
    'https://www.google.com/maps/search/?api=1&query=Officina%20Belviso%20S.N.C.%20Viale%20Sindaco%20Gerardo%20Decaro%209%2F11%2C%20Zona%20P.I.P.%2070016%20Noicattaro%20BA',
} satisfies SiteConfig

const schemaDayByItalianName: Readonly<Record<string, string>> = {
  Lunedì: 'https://schema.org/Monday',
  Martedì: 'https://schema.org/Tuesday',
  Mercoledì: 'https://schema.org/Wednesday',
  Giovedì: 'https://schema.org/Thursday',
  Venerdì: 'https://schema.org/Friday',
  Sabato: 'https://schema.org/Saturday',
  Domenica: 'https://schema.org/Sunday',
}

export const localBusinessStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'AutoRepair',
  name: siteConfig.name,
  url: `${siteConfig.siteUrl}/`,
  telephone: siteConfig.contact.phone,
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Viale Sindaco Gerardo De Caro 9/11, Zona P.I.P.',
    addressLocality: 'Noicattaro',
    addressRegion: 'BA',
    postalCode: '70016',
    addressCountry: 'IT',
  },
  openingHoursSpecification: siteConfig.openingHours.flatMap(({ day, periods }) =>
    periods.flatMap((period) => {
      const [opens, closes] = period.split(' - ')
      const dayOfWeek = schemaDayByItalianName[day]

      return dayOfWeek && opens && closes
        ? [{ '@type': 'OpeningHoursSpecification', dayOfWeek, opens, closes }]
        : []
    }),
  ),
} as const
