import type { SeoMetadata } from './seo'

export type AppRoute = {
  path: string
  component: 'cookiePolicy' | 'future' | 'home' | 'privacyPolicy'
  pageTitle?: string
  seo: SeoMetadata
}
