import { useState, useMemo } from 'react'
import { AdRevenue, AdRevenueInput, Currency, CurrencyRate } from '../types'
import { convertCurrency, formatCurrency, MONTHS } from '../utils/currency'

interface Props {
  revenue: AdRevenue[]
  displayCurrency: Currency
  rates: CurrencyRate[]
  onBack: () => void
  onSet: (revenue: AdRevenueInput) => Promise<AdRevenue>
  onDelete: (id: number) => Promise<void>
}


export default function AdRevenueDetail({
  revenue,
  displayCurrency,
  rates,
  onBack,
  onSet,
  onDelete
}: Props) {
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<AdRevenueInput>({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    amount: 0,
    currency: 'USD',
    notes: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSet(formData)
    setShowForm(false)
    setFormData({
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      amount: 0,
      currency: 'USD',
      notes: ''
    })
  }

  const handleEdit = (entry: AdRevenue) => {
    setFormData({
      year: entry.year,
      month: entry.month,
      amount: entry.amount,
      currency: entry.currency,
      notes: entry.notes || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this entry?')) {
      await onDelete(id)
    }
  }

  // Group by year
  const byYear = revenue.reduce((acc, r) => {
    if (!acc[r.year]) acc[r.year] = []
    acc[r.year].push(r)
    return acc
  }, {} as Record<number, AdRevenue[]>)

  const years = Object.keys(byYear).map(Number).sort((a, b) => b - a)

  const totalThisYear = revenue
    .filter(r => r.year === new Date().getFullYear())
    .reduce((sum, r) => sum + convertCurrency(r.amount, r.currency, displayCurrency, rates), 0)

  const summaryTotals = useMemo(() => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1

    // This month (current, possibly incomplete)
    const thisMonthEntries = revenue.filter(r => r.year === currentYear && r.month === currentMonth)
    const thisMonthTotal = thisMonthEntries.reduce((sum, r) =>
      sum + convertCurrency(r.amount, r.currency, displayCurrency, rates), 0)

    // Last month
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1
    const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear
    const lastMonthEntries = revenue.filter(r => r.year === lastMonthYear && r.month === lastMonth)
    const lastMonthTotal = lastMonthEntries.reduce((sum, r) =>
      sum + convertCurrency(r.amount, r.currency, displayCurrency, rates), 0)

    // Helper for N months back (exclusive of current month)
    const isWithinMonths = (entry: AdRevenue, months: number) => {
      const entryDate = new Date(entry.year, entry.month - 1)
      const cutoff = new Date(currentYear, currentMonth - 1 - months)
      return entryDate >= cutoff && entryDate < new Date(currentYear, currentMonth - 1)
    }

    // Last 3 months
    const last3MonthsEntries = revenue.filter(r => isWithinMonths(r, 3))
    const last3MonthsTotal = last3MonthsEntries.reduce((sum, r) =>
      sum + convertCurrency(r.amount, r.currency, displayCurrency, rates), 0)

    // Last 12 months
    const lastYearEntries = revenue.filter(r => isWithinMonths(r, 12))
    const lastYearTotal = lastYearEntries.reduce((sum, r) =>
      sum + convertCurrency(r.amount, r.currency, displayCurrency, rates), 0)

    return { thisMonthTotal, lastMonthTotal, last3MonthsTotal, lastYearTotal }
  }, [revenue, displayCurrency, rates])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Ad Revenue</h2>
            <p className="text-sm text-gray-500">
              {new Date().getFullYear()} total: {formatCurrency(totalThisYear, displayCurrency)}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Entry
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">This Month</p>
          <p className="text-xl font-bold text-yellow-600">
            {formatCurrency(summaryTotals.thisMonthTotal, displayCurrency)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Last Month</p>
          <p className="text-xl font-bold text-yellow-600">
            {formatCurrency(summaryTotals.lastMonthTotal, displayCurrency)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Last 3 Months</p>
          <p className="text-xl font-bold text-yellow-600">
            {formatCurrency(summaryTotals.last3MonthsTotal, displayCurrency)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Last Year</p>
          <p className="text-xl font-bold text-yellow-600">
            {formatCurrency(summaryTotals.lastYearTotal, displayCurrency)}
          </p>
        </div>
      </div>

      {/* Revenue by Year */}
      {years.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          No ad revenue entries yet. Add your first entry to get started.
        </div>
      ) : (
        years.map(year => (
          <div key={year} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="font-medium text-gray-800">{year}</h3>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {byYear[year].sort((a, b) => b.month - a.month).map(entry => (
                  <tr key={entry.id}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {MONTHS[entry.month - 1]}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-900">
                        {formatCurrency(entry.amount, entry.currency)}
                      </div>
                      {entry.currency !== displayCurrency && (
                        <div className="text-sm text-gray-500">
                          ({formatCurrency(convertCurrency(entry.amount, entry.currency, displayCurrency, rates), displayCurrency)})
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {entry.notes || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleEdit(entry)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Ad Revenue Entry</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={e => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) || new Date().getFullYear() }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    min="2000"
                    max="2100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                  <select
                    value={formData.month}
                    onChange={e => setFormData(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {MONTHS.map((month, i) => (
                      <option key={i} value={i + 1}>{month}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={e => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select
                    value={formData.currency}
                    onChange={e => setFormData(prev => ({ ...prev, currency: e.target.value as Currency }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="IDR">IDR (Rp)</option>
                    <option value="SEK">SEK (kr)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., AdMob, AdSense"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
