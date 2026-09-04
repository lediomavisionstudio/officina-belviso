import {
  type ReactNode,
  useCallback,
  useMemo,
  useState,
} from 'react'
import type { QuoteServiceId, ServiceId } from '../../config/services'
import { QuoteRequestContext } from '../../hooks/quoteRequestContext'

export function QuoteRequestProvider({ children }: { children: ReactNode }) {
  const [serviceType, setServiceType] = useState<QuoteServiceId | ''>('')

  const requestQuoteForService = useCallback((serviceId: ServiceId) => {
    setServiceType(serviceId)
  }, [])

  const value = useMemo(
    () => ({ requestQuoteForService, serviceType, setServiceType }),
    [requestQuoteForService, serviceType],
  )

  return (
    <QuoteRequestContext.Provider value={value}>
      {children}
    </QuoteRequestContext.Provider>
  )
}
