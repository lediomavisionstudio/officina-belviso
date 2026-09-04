import { useContext } from 'react'
import { QuoteRequestContext } from './quoteRequestContext'

export function useQuoteRequest() {
  const context = useContext(QuoteRequestContext)
  if (!context) {
    throw new Error('useQuoteRequest must be used within QuoteRequestProvider')
  }
  return context
}
