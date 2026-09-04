import { useContext } from 'react'
import { CookieConsentContext } from './cookieConsentContext'

export function useCookieConsent() {
  const context = useContext(CookieConsentContext)

  if (!context) {
    throw new Error(
      'useCookieConsent deve essere utilizzato dentro CookieConsentProvider.',
    )
  }

  return context
}
