import type { SiteConfig } from '../types/site'

export const siteConfig = {
  name: 'Officina Belviso',
  description:
    'Manutenzione e riparazione per veicoli industriali, con attenzione alla sicurezza e alla continuità operativa.',
  siteUrl: null,
  business: {
    fiscalCode: '033776520726',
    vatNumber: '033776520726',
    pec: 'belviso.snc@pec.it',
    recipientCode: 'KRRH6B9',
  },
  contact: {
    companyName: 'Officina Belviso S.N.C.',
    address: [
      'Viale Sindaco Gerardo De Caro 9-11',
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
    facebook: null,
    instagram: null,
    linkedin: null,
    whatsapp: null,
  },
  credits: {
    label: 'Ledioma Vision Studio',
    url: 'https://ledioma.it',
  },
  googleBusiness: {
    rating: 4.9,
    reviewCount: 29,
    profileUrl: null,
    writeReviewUrl: null,
    reviews: [
      {
        rating: 5,
        text: 'Testo della recensione Google da sostituire con il contenuto verificato del profilo.',
        author: 'Nome cliente',
      },
      {
        rating: 5,
        text: 'Seconda recensione dimostrativa, predisposta per un aggiornamento manuale o tramite API.',
        author: 'Nome cliente',
      },
      {
        rating: 5,
        text: 'Terza recensione dimostrativa da sostituire con una testimonianza pubblicata su Google.',
        author: 'Nome cliente',
      },
    ],
  },
  googleMapsUrl:
    'https://www.google.com/maps/search/?api=1&query=Officina%20Belviso%20S.N.C.%20Viale%20Sindaco%20Gerardo%20De%20Caro%209-11%2070016%20Noicattaro%20BA',
} satisfies SiteConfig
