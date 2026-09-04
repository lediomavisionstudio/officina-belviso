import {
  type ReactNode,
  useCallback,
  useMemo,
  useState,
} from 'react'
import {
  clearRevokedCategoryCookies,
  createConsent,
  defaultConsentCategories,
  readStoredConsent,
  type ConsentCategories,
  type StoredConsent,
  writeStoredConsent,
} from '../../config/cookieConsent'
import { CookieConsentContext } from '../../hooks/cookieConsentContext'
import { CookieConsentDialog } from './CookieConsentDialog'

type ConsentView = 'banner' | 'preferences' | null

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<StoredConsent | null>(() =>
    readStoredConsent(),
  )
  const [view, setView] = useState<ConsentView>(() =>
    readStoredConsent() ? null : 'banner',
  )

  const persistConsent = useCallback(
    (categories: ConsentCategories) => {
      const nextConsent = createConsent(categories)
      clearRevokedCategoryCookies(consent, nextConsent)
      writeStoredConsent(nextConsent)
      setConsent(nextConsent)
      setView(null)
    },
    [consent],
  )

  const rejectOptional = useCallback(() => {
    persistConsent(defaultConsentCategories)
  }, [persistConsent])

  const acceptAll = useCallback(() => {
    persistConsent({
      necessary: true,
      preferences: true,
      analytics: true,
      marketing: true,
      externalMedia: true,
    })
  }, [persistConsent])

  const enableExternalMedia = useCallback(() => {
    persistConsent({
      necessary: true,
      preferences: consent?.preferences ?? false,
      analytics: consent?.analytics ?? false,
      marketing: consent?.marketing ?? false,
      externalMedia: true,
    })
  }, [consent, persistConsent])

  const categories = useMemo<ConsentCategories>(
    () => ({
      necessary: true,
      preferences: consent?.preferences ?? false,
      analytics: consent?.analytics ?? false,
      marketing: consent?.marketing ?? false,
      externalMedia: consent?.externalMedia ?? false,
    }),
    [consent],
  )

  const contextValue = useMemo(
    () => ({
      categories,
      consent,
      enableExternalMedia,
      openPreferences: () => setView('preferences'),
    }),
    [categories, consent, enableExternalMedia],
  )

  return (
    <CookieConsentContext.Provider value={contextValue}>
      {children}
      {view ? (
        <CookieConsentDialog
          categories={categories}
          hasStoredConsent={consent !== null}
          view={view}
          onAcceptAll={acceptAll}
          onClose={consent ? () => setView(null) : rejectOptional}
          onCustomize={() => setView('preferences')}
          onReject={rejectOptional}
          onSave={persistConsent}
        />
      ) : null}
    </CookieConsentContext.Provider>
  )
}
