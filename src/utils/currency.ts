import { Currency, CurrencyRate } from '../types'

export function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency,
  rates: CurrencyRate[]
): number {
  if (from === to) return amount
  if (!rates || rates.length === 0) return amount
  if (amount == null || isNaN(amount)) return 0

  const rate = rates.find(r => r.from_curr === from && r.to_curr === to)
  if (rate) {
    return amount * rate.rate
  }

  // Try converting through USD as intermediate
  const fromToUsd = rates.find(r => r.from_curr === from && r.to_curr === 'USD')
  const usdToTarget = rates.find(r => r.from_curr === 'USD' && r.to_curr === to)

  if (fromToUsd && usdToTarget) {
    return amount * fromToUsd.rate * usdToTarget.rate
  }

  console.warn(`No conversion rate found for ${from} to ${to}`)
  return amount
}

export function formatCurrency(amount: number, currency: Currency): string {
  const formatters: Record<Currency, Intl.NumberFormat> = {
    IDR: new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }),
    USD: new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }),
    SEK: new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  return formatters[currency].format(amount)
}

export function getCurrencySymbol(currency: Currency): string {
  const symbols: Record<Currency, string> = {
    IDR: 'Rp',
    USD: '$',
    SEK: 'kr'
  }
  return symbols[currency]
}

export function getCurrencyName(currency: Currency): string {
  const names: Record<Currency, string> = {
    IDR: 'Indonesian Rupiah',
    USD: 'US Dollar',
    SEK: 'Swedish Krona'
  }
  return names[currency]
}

export const CURRENCIES: Currency[] = ['USD', 'IDR', 'SEK']
