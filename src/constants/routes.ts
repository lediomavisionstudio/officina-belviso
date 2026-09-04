import type { AppRoute } from '../types/routes'

const homeDescription =
  'Officina Belviso offre diagnosi, manutenzione e riparazione per veicoli industriali, con interventi orientati a sicurezza e affidabilità.'

function futurePageSeo(
  title: string,
  description: string,
  canonicalPath: string,
) {
  return {
    title: `${title} | Officina Belviso`,
    description,
    canonicalPath,
    robots: 'noindex, nofollow',
  } as const
}

export const appRoutes = [
  {
    path: '/',
    component: 'home',
    seo: {
      title: 'Officina Belviso | Assistenza veicoli industriali',
      description: homeDescription,
      canonicalPath: '/',
    },
  },
  {
    path: '/chi-siamo',
    component: 'future',
    pageTitle: 'Chi siamo',
    seo: futurePageSeo(
      'Chi siamo',
      'Pagina Chi siamo di Officina Belviso.',
      '/chi-siamo',
    ),
  },
  {
    path: '/servizi',
    component: 'future',
    pageTitle: 'Servizi',
    seo: futurePageSeo(
      'Servizi',
      'Pagina Servizi di Officina Belviso.',
      '/servizi',
    ),
  },
  {
    path: '/lavori',
    component: 'future',
    pageTitle: 'Lavori',
    seo: futurePageSeo(
      'Lavori',
      'Pagina Lavori di Officina Belviso.',
      '/lavori',
    ),
  },
  {
    path: '/preventivo',
    component: 'future',
    pageTitle: 'Preventivo',
    seo: futurePageSeo(
      'Preventivo',
      'Pagina Preventivo di Officina Belviso.',
      '/preventivo',
    ),
  },
  {
    path: '/lavora-con-noi',
    component: 'future',
    pageTitle: 'Lavora con noi',
    seo: futurePageSeo(
      'Lavora con noi',
      'Pagina Lavora con noi di Officina Belviso.',
      '/lavora-con-noi',
    ),
  },
  {
    path: '/contatti',
    component: 'future',
    pageTitle: 'Contatti',
    seo: futurePageSeo(
      'Contatti',
      'Pagina Contatti di Officina Belviso.',
      '/contatti',
    ),
  },
  {
    path: '/privacy-policy',
    component: 'privacyPolicy',
    pageTitle: 'Privacy policy',
    seo: futurePageSeo(
      'Privacy policy',
      'Informativa privacy di Officina Belviso.',
      '/privacy-policy',
    ),
  },
  {
    path: '/cookie-policy',
    component: 'cookiePolicy',
    pageTitle: 'Cookie policy',
    seo: futurePageSeo(
      'Cookie policy',
      'Informativa cookie di Officina Belviso.',
      '/cookie-policy',
    ),
  },
  {
    path: '/404',
    component: 'future',
    pageTitle: 'Pagina non trovata',
    seo: futurePageSeo(
      'Pagina non trovata',
      'La pagina richiesta non è disponibile.',
      '/404',
    ),
  },
] as const satisfies readonly AppRoute[]

export const notFoundRoute: AppRoute = appRoutes.at(-1)!
