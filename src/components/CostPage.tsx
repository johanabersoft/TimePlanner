import { useState, useMemo } from 'react'
import { Cost, CostInput, Currency, CurrencyRate } from '../types'
import { useCosts } from '../hooks/useCosts'
import { convertCurrency, formatCurrency, MONTHS } from '../utils/currency'

interface Props {
  displayCurrency: Currency
  rates: CurrencyRate[]
}

export default function CostPage({ displayCurrency, rates }: Props) {
  const { costs, categories, loading, error, createCost, updateCost, deleteCost } = useCosts()
  const [showForm, setShowForm] = useState(false)
  const [editingCost, setEditingCost] = useState<Cost | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>('')

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  const defaultFormData: CostInput = {
    name: '',
    category: '',
    amount: 0,
    currency: 'USD',
    year: currentYear,
    month: currentMonth,
    is_recurring: false,
    is_active: true,
    notes: ''
  }

  const [formData, setFormData] = useState<CostInput>(defaultFormData)

  // Calculate cost total for a given target month
  // One-time: costs matching that exact month
  // Recurring: active recurring costs whose start (year/month) <= target month
  const getMonthTotal = (targetYear: number, targetMonth: number): number => {
    let total = 0
    for (const cost of costs) {
      const costDate = cost.year * 12 + cost.month
      const targetDate = targetYear * 12 + targetMonth

      if (cost.is_recurring) {
        if (cost.is_active && costDate <= targetDate) {
          total += convertCurrency(cost.amount, cost.currency, displayCurrency, rates)
        }
      } else {
        if (cost.year === targetYear && cost.month === targetMonth) {
          total += convertCurrency(cost.amount, cost.currency, displayCurrency, rates)
        }
      }
    }
    return total
  }

  const summaryTotals = useMemo(() => {
    const thisMonthTotal = getMonthTotal(currentYear, currentMonth)

    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1
    const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear
    const lastMonthTotal = getMonthTotal(lastMonthYear, lastMonth)

    // Last 3 months (3 months preceding current)
    let last3MonthsTotal = 0
    let y = currentYear
    let m = currentMonth
    for (let i = 0; i < 3; i++) {
      m--
      if (m === 0) { m = 12; y-- }
      last3MonthsTotal += getMonthTotal(y, m)
    }

    return { thisMonthTotal, lastMonthTotal, last3MonthsTotal }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [costs, displayCurrency, rates, currentYear, currentMonth])

  const recurringCosts = costs.filter(c => c.is_recurring)
  const oneTimeCosts = costs.filter(c => !c.is_recurring)

  const filteredRecurring = categoryFilter
    ? recurringCosts.filter(c => c.category === categoryFilter)
    : recurringCosts

  const filteredOneTime = categoryFilter
    ? oneTimeCosts.filter(c => c.category === categoryFilter)
    : oneTimeCosts

  // Group one-time costs by year
  const oneTimeByYear = filteredOneTime.reduce((acc, c) => {
    if (!acc[c.year]) acc[c.year] = []
    acc[c.year].push(c)
    return acc
  }, {} as Record<number, Cost[]>)
  const oneTimeYears = Object.keys(oneTimeByYear).map(Number).sort((a, b) => b - a)

  const handleOpenAdd = () => {
    setEditingCost(null)
    setFormData(defaultFormData)
    setShowForm(true)
  }

  const handleEdit = (cost: Cost) => {
    setEditingCost(cost)
    setFormData({
      name: cost.name,
      category: cost.category,
      amount: cost.amount,
      currency: cost.currency,
      year: cost.year,
      month: cost.month,
      is_recurring: cost.is_recurring,
      is_active: cost.is_active,
      notes: cost.notes || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this cost?')) {
      await deleteCost(id)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingCost) {
      await updateCost(editingCost.id, formData)
    } else {
      await createCost(formData)
    }
    setShowForm(false)
    setEditingCost(null)
    setFormData(defaultFormData)
  }

  const handleToggleActive = async (cost: Cost) => {
    await updateCost(cost.id, { is_active: !cost.is_active })
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading costs...</div>
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Costs</h2>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Cost
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">This Month</p>
          <p className="text-xl font-bold text-rose-600">
            {formatCurrency(summaryTotals.thisMonthTotal, displayCurrency)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Last Month</p>
          <p className="text-xl font-bold text-rose-600">
            {formatCurrency(summaryTotals.lastMonthTotal, displayCurrency)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Last 3 Months</p>
          <p className="text-xl font-bold text-rose-600">
            {formatCurrency(summaryTotals.last3MonthsTotal, displayCurrency)}
          </p>
        </div>
      </div>

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Filter by category:</label>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          >
            <option value="">All categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      )}

      {/* Recurring Costs */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="font-medium text-gray-800">Recurring Costs</h3>
        </div>
        {filteredRecurring.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">
            No recurring costs.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRecurring.map(cost => (
                <tr key={cost.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                    {cost.name}
                    {cost.notes && (
                      <span className="block text-xs text-gray-400">{cost.notes}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                      {cost.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-900">
                      {formatCurrency(cost.amount, cost.currency)}
                    </div>
                    {cost.currency !== displayCurrency && (
                      <div className="text-sm text-gray-500">
                        ({formatCurrency(convertCurrency(cost.amount, cost.currency, displayCurrency, rates), displayCurrency)})
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {MONTHS[cost.month - 1]} {cost.year}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleActive(cost)}
                      className={`px-2 py-1 text-xs rounded-full font-medium ${
                        cost.is_active
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {cost.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => handleEdit(cost)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(cost.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* One-time Costs */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="font-medium text-gray-800">One-time Costs</h3>
        </div>
        {oneTimeYears.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">
            No one-time costs.
          </div>
        ) : (
          oneTimeYears.map(year => (
            <div key={year}>
              <div className="px-6 py-2 bg-gray-50 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">{year}</span>
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {oneTimeByYear[year].sort((a, b) => b.month - a.month).map(cost => (
                    <tr key={cost.id}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        {cost.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                          {cost.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-900">
                          {formatCurrency(cost.amount, cost.currency)}
                        </div>
                        {cost.currency !== displayCurrency && (
                          <div className="text-sm text-gray-500">
                            ({formatCurrency(convertCurrency(cost.amount, cost.currency, displayCurrency, rates), displayCurrency)})
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {MONTHS[cost.month - 1]}
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-sm">
                        {cost.notes || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleEdit(cost)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(cost.id)}
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
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              {editingCost ? 'Edit Cost' : 'Add Cost'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., AWS Hosting"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  list="cost-categories"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Hosting, Software, Services"
                  required
                />
                <datalist id="cost-categories">
                  {categories.map(cat => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={e => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) || currentYear }))}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="costType"
                      checked={!formData.is_recurring}
                      onChange={() => setFormData(prev => ({ ...prev, is_recurring: false }))}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">One-time</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="costType"
                      checked={formData.is_recurring}
                      onChange={() => setFormData(prev => ({ ...prev, is_recurring: true }))}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">Recurring monthly</span>
                  </label>
                </div>
              </div>

              {formData.is_recurring && (
                <div className="flex items-center gap-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active ?? true}
                      onChange={e => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                  <span className="text-sm text-gray-700">Active</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Additional details"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingCost(null) }}
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
