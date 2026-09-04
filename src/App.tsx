import { AppRouter } from './app/AppRouter'
import { QuoteRequestProvider } from './components/contact/QuoteRequestProvider'
import { CookieConsentProvider } from './components/privacy/CookieConsentProvider'

export function App() {
  return (
    <CookieConsentProvider>
      <QuoteRequestProvider>
        <AppRouter />
      </QuoteRequestProvider>
    </CookieConsentProvider>
  )
}
