export type SeoMetadata = {
  title: string
  description: string
  canonicalPath: string
  robots?: 'index, follow' | 'noindex, nofollow'
  openGraph?: {
    title?: string
    description?: string
    image?: string
  }
  twitter?: {
    card?: 'summary' | 'summary_large_image'
    title?: string
    description?: string
    image?: string
  }
}
