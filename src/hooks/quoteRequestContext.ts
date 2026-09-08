import { createContext } from 'react'
import type { QuoteServiceId, ServiceId } from '../config/services'

export type QuoteRequestContextValue = {
  requestQuoteForService: (serviceId: ServiceId) => void
  selectedInterventions: QuoteServiceId[]
  setSelectedInterventions: (serviceIds: QuoteServiceId[]) => void
}

export const QuoteRequestContext =
  createContext<QuoteRequestContextValue | null>(null)
