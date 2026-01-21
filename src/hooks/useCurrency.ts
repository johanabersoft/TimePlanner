import { useState, useEffect, useCallback } from 'react'
import { Currency, CurrencyRate } from '../types'
import { convertCurrency, formatCurrency } from '../utils/currency'

interface UseCurrencyReturn {
  rates: CurrencyRate[]
  displayCurrency: Currency
  loading: boolean
  error: string | null
  lastUpdated: string | null
  setDisplayCurrency: (currency: Currency) => void
  fetchRates: () => Promise<void>
  refreshRates: () => Promise<boolean>
  convert: (amount: number, from: Currency, to?: Currency) => number
  format: (amount: number, currency?: Currency) => string
}

export function useCurrency(): UseCurrencyReturn {
  const [rates, setRates] = useState<CurrencyRate[]>([])
  const [displayCurrency, setDisplayCurrency] = useState<Currency>('USD')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const fetchRates = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await window.electronAPI.currency.getRates()
      // Filter out any invalid data
      const validData = Array.isArray(data) ? data.filter(r => r && r.from_curr && r.to_curr) : []
      setRates(validData)

      // Get the most recent update time
      if (validData.length > 0) {
        const mostRecent = validData.reduce((latest, rate) =>
          rate.updated > latest ? rate.updated : latest
          , validData[0].updated)
        setLastUpdated(mostRecent)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch currency rates')
      setRates([])
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshRates = useCallback(async (): Promise<boolean> => {
    try {
      setError(null)
      const result = await window.electronAPI.currency.fetchLatest()
      if (result.success) {
        await fetchRates()
        return true
      } else {
        setError(result.error || 'Failed to refresh rates')
        return false
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh currency rates')
      return false
    }
  }, [fetchRates])

  const convert = useCallback((amount: number, from: Currency, to?: Currency): number => {
    return convertCurrency(amount, from, to || displayCurrency, rates)
  }, [rates, displayCurrency])

  const format = useCallback((amount: number, currency?: Currency): string => {
    return formatCurrency(amount, currency || displayCurrency)
  }, [displayCurrency])

  useEffect(() => {
    fetchRates()
  }, [fetchRates])

  return {
    rates,
    displayCurrency,
    loading,
    error,
    lastUpdated,
    setDisplayCurrency,
    fetchRates,
    refreshRates,
    convert,
    format
  }
}
