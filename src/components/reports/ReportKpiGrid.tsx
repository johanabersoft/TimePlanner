import { Currency } from '../../types'
import { formatCurrency } from '../../utils/currency'

interface ReportKpiGridProps {
  totalIncome: number
  totalExpenses: number
  totalCosts: number
  displayCurrency: Currency
  monthLabel: string
}

export default function ReportKpiGrid({
  totalIncome,
  totalExpenses,
  totalCosts,
  displayCurrency,
  monthLabel
}: ReportKpiGridProps) {
  const allExpenses = totalExpenses + totalCosts
  const netAmount = totalIncome - allExpenses
  const isProfit = netAmount >= 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Total Income */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Income</p>
            <p className="text-2xl font-semibold text-gray-900 mt-2">
              {formatCurrency(totalIncome, displayCurrency)}
            </p>
          </div>
          <div className="p-2 bg-green-100 rounded-lg">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">Revenue from all sources</p>
      </div>

      {/* Total Expenses */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Expenses</p>
            <p className="text-2xl font-semibold text-gray-900 mt-2">
              {formatCurrency(allExpenses, displayCurrency)}
            </p>
          </div>
          <div className="p-2 bg-red-100 rounded-lg">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">Salaries & operating costs</p>
      </div>

      {/* Net Profit/Loss - Hero Card */}
      <div
        className={`rounded-xl p-5 shadow-sm ${
          isProfit
            ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white'
            : 'bg-gradient-to-br from-orange-500 to-orange-600 text-white'
        }`}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium opacity-90 uppercase tracking-wide">
              Net {isProfit ? 'Profit' : 'Loss'}
            </p>
            <p className="text-3xl font-bold mt-2">
              {isProfit ? '+' : ''}{formatCurrency(netAmount, displayCurrency)}
            </p>
          </div>
          <div className={`p-2 rounded-lg ${isProfit ? 'bg-emerald-400/30' : 'bg-orange-400/30'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>
        <p className="text-sm mt-2 opacity-75">{monthLabel}</p>
      </div>
    </div>
  )
}
