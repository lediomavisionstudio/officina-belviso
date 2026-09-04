type ContactConfig = {
  companyName: string
  address: readonly string[]
  phone: string | null
  email: string | null
}

type BusinessConfig = {
  fiscalCode: string
  vatNumber: string
  pec: string
  recipientCode: string
}

export type OpeningHour = {
  day: string
  periods: readonly string[]
}

export type GoogleReview = {
  author: string
  rating: number
  text: string
}

type GoogleBusinessConfig = {
  profileUrl: string | null
  rating: number
  reviewCount: number
  reviews: readonly GoogleReview[]
  writeReviewUrl: string | null
}

type SocialConfig = {
  facebook: string | null
  instagram: string | null
  linkedin: string | null
  whatsapp: string | null
}

type CreditsConfig = {
  label: string
  url: string
}

export type SiteConfig = {
  name: string
  description: string
  siteUrl: string | null
  business: BusinessConfig
  contact: ContactConfig
  openingHours: readonly OpeningHour[]
  social: SocialConfig
  credits: CreditsConfig
  googleBusiness: GoogleBusinessConfig
  googleMapsUrl: string | null
}
