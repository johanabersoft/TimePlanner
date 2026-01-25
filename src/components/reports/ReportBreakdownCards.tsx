import { Currency } from '../../types'
import { formatCurrency } from '../../utils/currency'

interface IncomeBreakdown {
  consultant: number
  ads: number
  iap: number
  total: number
}

interface ExpenseBreakdown {
  totalBase: number
  totalAdjusted: number
  totalSickDays: number
  totalDeduction: number
}

interface ReportBreakdownCardsProps {
  income: IncomeBreakdown
  expenses: ExpenseBreakdown
  displayCurrency: Currency
}

export default function ReportBreakdownCards({
  income,
  expenses,
  displayCurrency
}: ReportBreakdownCardsProps) {
  // Calculate percentages for income breakdown
  const getPercentage = (value: number, total: number) => {
    if (total === 0) return 0
    return Math.round((value / total) * 100)
  }

  const incomeItems = [
    { label: 'Consultant Fees', amount: income.consultant, color: 'bg-indigo-500', textColor: 'text-indigo-600' },
    { label: 'IAP Revenue', amount: income.iap, color: 'bg-purple-500', textColor: 'text-purple-600' },
    { label: 'Ad Revenue', amount: income.ads, color: 'bg-green-500', textColor: 'text-green-600' }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Income Breakdown */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          Income Breakdown
        </h3>
        <div className="space-y-3">
          {incomeItems.map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 ${item.color} rounded-sm`}></span>
                <span className="text-sm text-gray-600">{item.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-medium ${item.textColor}`}>
                  {formatCurrency(item.amount, displayCurrency)}
                </span>
                <span className="text-xs text-gray-400 w-10 text-right">
                  {getPercentage(item.amount, income.total)}%
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Total</span>
          <span className="text-lg font-semibold text-green-600">
            {formatCurrency(income.total, displayCurrency)}
          </span>
        </div>
      </div>

      {/* Expense Breakdown */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
          Expense Breakdown
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Base Salary Total</span>
            <span className="text-sm font-medium text-gray-900">
              {formatCurrency(expenses.totalBase, displayCurrency)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Sick Day Deductions</span>
            <span className="text-sm font-medium text-green-600">
              -{formatCurrency(expenses.totalDeduction, displayCurrency)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Sick Days</span>
            {expenses.totalSickDays > 0 ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                {expenses.totalSickDays} day{expenses.totalSickDays !== 1 ? 's' : ''}
              </span>
            ) : (
              <span className="text-sm text-gray-400">0</span>
            )}
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Adjusted Total</span>
          <span className="text-lg font-semibold text-red-600">
            {formatCurrency(expenses.totalAdjusted, displayCurrency)}
          </span>
        </div>
        <p className="mt-3 text-xs text-gray-400 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Adjusted = salary after sick day deductions
        </p>
      </div>
    </div>
  )
}
