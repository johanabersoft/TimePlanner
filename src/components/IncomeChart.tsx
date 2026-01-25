import { useMemo } from 'react'
import { ConsultantContract, AdRevenue, IapRevenue, Currency, CurrencyRate } from '../types'
import { convertCurrency, formatCurrency } from '../utils/currency'

interface Props {
  contracts: ConsultantContract[]
  adRevenue: AdRevenue[]
  iapRevenue: IapRevenue[]
  displayCurrency: Currency
  rates: CurrencyRate[]
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function IncomeChart({ contracts, adRevenue, iapRevenue, displayCurrency, rates }: Props) {
  // Calculate monthly data for the current year
  const chartData = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth() + 1

    // Monthly consultant fee (sum of all active contracts)
    const monthlyConsultant = contracts
      .filter(c => c.is_active)
      .reduce((sum, c) => sum + convertCurrency(c.monthly_fee, c.currency, displayCurrency, rates), 0)

    return MONTHS.slice(0, currentMonth).map((month, i) => {
      const monthNum = i + 1

      // Ad revenue for this month
      const ad = adRevenue.find(r => r.year === currentYear && r.month === monthNum)
      const adAmount = ad ? convertCurrency(ad.amount, ad.currency, displayCurrency, rates) : 0

      // IAP revenue for this month (sum all apps and stores)
      const iapAmount = iapRevenue
        .filter(r => r.year === currentYear && r.month === monthNum)
        .reduce((sum, r) => sum + convertCurrency(r.amount, r.currency, displayCurrency, rates), 0)

      return {
        month,
        consultant: monthlyConsultant,
        ads: adAmount,
        iap: iapAmount,
        total: monthlyConsultant + adAmount + iapAmount
      }
    })
  }, [contracts, adRevenue, iapRevenue, displayCurrency, rates])

  // Find max value for scaling
  const maxTotal = Math.max(...chartData.map(d => d.total), 1)

  // Calculate totals for legend
  const totals = chartData.reduce(
    (acc, d) => ({
      consultant: acc.consultant + d.consultant,
      ads: acc.ads + d.ads,
      iap: acc.iap + d.iap
    }),
    { consultant: 0, ads: 0, iap: 0 }
  )

  if (chartData.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No data available for the current year yet.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Simple bar chart */}
      <div className="flex items-end gap-2 h-64">
        {chartData.map((data, i) => (
          <div key={i} className="flex-1 flex flex-col items-center">
            <div className="w-full flex flex-col-reverse" style={{ height: '200px' }}>
              {/* Stacked bars */}
              <div
                className="w-full bg-indigo-500 rounded-t-sm"
                style={{ height: `${(data.consultant / maxTotal) * 100}%` }}
                title={`Consultant: ${formatCurrency(data.consultant, displayCurrency)}`}
              />
              <div
                className="w-full bg-green-500"
                style={{ height: `${(data.ads / maxTotal) * 100}%` }}
                title={`Ads: ${formatCurrency(data.ads, displayCurrency)}`}
              />
              <div
                className="w-full bg-purple-500 rounded-t-sm"
                style={{ height: `${(data.iap / maxTotal) * 100}%` }}
                title={`IAP: ${formatCurrency(data.iap, displayCurrency)}`}
              />
            </div>
            <span className="text-xs text-gray-500 mt-2">{data.month}</span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-indigo-500 rounded-sm" />
          <span className="text-sm text-gray-600">
            Consultant ({formatCurrency(totals.consultant, displayCurrency)})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-sm" />
          <span className="text-sm text-gray-600">
            Ads ({formatCurrency(totals.ads, displayCurrency)})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-500 rounded-sm" />
          <span className="text-sm text-gray-600">
            IAP ({formatCurrency(totals.iap, displayCurrency)})
          </span>
        </div>
      </div>
    </div>
  )
}
