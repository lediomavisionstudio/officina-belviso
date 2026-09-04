import { createContext } from 'react'
import type { QuoteServiceId, ServiceId } from '../config/services'

export type QuoteRequestContextValue = {
  requestQuoteForService: (serviceId: ServiceId) => void
  serviceType: QuoteServiceId | ''
  setServiceType: (serviceId: QuoteServiceId | '') => void
}

export const QuoteRequestContext =
  createContext<QuoteRequestContextValue | null>(null)
