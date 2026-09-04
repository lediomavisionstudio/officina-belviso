import { createContext } from 'react'
import type {
  ConsentCategories,
  StoredConsent,
} from '../config/cookieConsent'

export type CookieConsentContextValue = {
  categories: ConsentCategories
  consent: StoredConsent | null
  enableExternalMedia: () => void
  openPreferences: () => void
}

export const CookieConsentContext =
  createContext<CookieConsentContextValue | null>(null)
