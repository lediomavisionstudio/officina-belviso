import { useSyncExternalStore } from 'react'
import { SeoMeta } from '../components/seo/SeoMeta'
import { appRoutes, notFoundRoute } from '../constants/routes'
import { FuturePage } from '../pages/FuturePage'
import { HomePage } from '../pages/HomePage'
import { CookiePolicyPage } from '../pages/CookiePolicyPage'
import { PrivacyPolicyPage } from '../pages/PrivacyPolicyPage'
import { normalizePathname } from '../utils/path'

function subscribeToLocationChange(callback: () => void) {
  window.addEventListener('popstate', callback)
  return () => window.removeEventListener('popstate', callback)
}

function getCurrentPathname() {
  return normalizePathname(window.location.pathname)
}

export function AppRouter() {
  const pathname = useSyncExternalStore(
    subscribeToLocationChange,
    getCurrentPathname,
    () => '/',
  )
  const route =
    appRoutes.find((candidate) => candidate.path === pathname) ?? notFoundRoute

  const page =
    route.component === 'home' ? (
      <HomePage />
    ) : route.component === 'cookiePolicy' ? (
      <CookiePolicyPage />
    ) : route.component === 'privacyPolicy' ? (
      <PrivacyPolicyPage />
    ) : (
      <FuturePage route={route} />
    )

  return (
    <>
      <SeoMeta metadata={route.seo} />
      {page}
    </>
  )
}
