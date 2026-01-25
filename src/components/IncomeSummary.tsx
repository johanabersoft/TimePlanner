import { useState, useMemo } from 'react'
import { useIncome } from '../hooks/useIncome'
import { Currency, CurrencyRate, Employee } from '../types'
import { convertCurrency, formatCurrency } from '../utils/currency'
import ConsultantFeesDetail from './ConsultantFeesDetail'
import AdRevenueDetail from './AdRevenueDetail'
import IapRevenueDetail from './IapRevenueDetail'
import IncomeChart from './IncomeChart'

type IncomeView = 'summary' | 'consultant' | 'ads' | 'iap'

interface Props {
  displayCurrency: Currency
  rates: CurrencyRate[]
  employees: Employee[]
}

export default function IncomeSummary({ displayCurrency, rates, employees }: Props) {
  const [view, setView] = useState<IncomeView>('summary')
  const {
    contracts,
    adRevenue,
    iapRevenue,
    loading,
    error,
    createContract,
    updateContract,
    deleteContract,
    setAdRevenue,
    deleteAdRevenue,
    setIapRevenue,
    deleteIapRevenue
  } = useIncome()

  // Calculate totals in display currency
  const totals = useMemo(() => {
    // Consultant fees - only active contracts
    const consultantTotal = contracts
      .filter(c => c.is_active)
      .reduce((sum, c) => {
        const converted = convertCurrency(c.monthly_fee, c.currency, displayCurrency, rates)
        return sum + converted
      }, 0)

    // Ad revenue - last month (current month is incomplete)
    const now = new Date()
    const lastMonth = now.getMonth() === 0 ? 12 : now.getMonth()
    const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
    const adLastMonth = adRevenue.find(r => r.year === lastMonthYear && r.month === lastMonth)
    const adTotal = adLastMonth
      ? convertCurrency(adLastMonth.amount, adLastMonth.currency, displayCurrency, rates)
      : 0

    // IAP revenue - last month (current month is incomplete)
    const iapLastMonth = iapRevenue.filter(r => r.year === lastMonthYear && r.month === lastMonth)
    const iapTotal = iapLastMonth.reduce((sum, r) => {
      const converted = convertCurrency(r.amount, r.currency, displayCurrency, rates)
      return sum + converted
    }, 0)

    return {
      consultant: consultantTotal,
      ads: adTotal,
      iap: iapTotal,
      total: consultantTotal + adTotal + iapTotal
    }
  }, [contracts, adRevenue, iapRevenue, displayCurrency, rates])

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading income data...</div>
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
        {error}
      </div>
    )
  }

  if (view === 'consultant') {
    return (
      <ConsultantFeesDetail
        contracts={contracts}
        employees={employees}
        displayCurrency={displayCurrency}
        rates={rates}
        onBack={() => setView('summary')}
        onCreate={createContract}
        onUpdate={updateContract}
        onDelete={deleteContract}
      />
    )
  }

  if (view === 'ads') {
    return (
      <AdRevenueDetail
        revenue={adRevenue}
        displayCurrency={displayCurrency}
        rates={rates}
        onBack={() => setView('summary')}
        onSet={setAdRevenue}
        onDelete={deleteAdRevenue}
      />
    )
  }

  if (view === 'iap') {
    return (
      <IapRevenueDetail
        revenue={iapRevenue}
        displayCurrency={displayCurrency}
        rates={rates}
        onBack={() => setView('summary')}
        onSet={setIapRevenue}
        onDelete={deleteIapRevenue}
      />
    )
  }

  // Summary view
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Consultant Fees Card */}
        <button
          onClick={() => setView('consultant')}
          className="bg-white rounded-lg shadow p-6 text-left hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-sm text-gray-500">
              {contracts.filter(c => c.is_active).length} active
            </span>
          </div>
          <h3 className="text-lg font-medium text-gray-900">Consultant Fees</h3>
          <p className="text-2xl font-bold text-indigo-600 mt-2">
            {formatCurrency(totals.consultant, displayCurrency)}
          </p>
          <p className="text-sm text-gray-500 mt-1">Monthly recurring</p>
        </button>

        {/* Ad Revenue Card */}
        <button
          onClick={() => setView('ads')}
          className="bg-white rounded-lg shadow p-6 text-left hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
            </div>
            <span className="text-sm text-gray-500">
              {adRevenue.length} entries
            </span>
          </div>
          <h3 className="text-lg font-medium text-gray-900">Ad Revenue</h3>
          <p className="text-2xl font-bold text-green-600 mt-2">
            {formatCurrency(totals.ads, displayCurrency)}
          </p>
          <p className="text-sm text-gray-500 mt-1">Last month</p>
        </button>

        {/* IAP Revenue Card */}
        <button
          onClick={() => setView('iap')}
          className="bg-white rounded-lg shadow p-6 text-left hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-sm text-gray-500">
              {iapRevenue.length} entries
            </span>
          </div>
          <h3 className="text-lg font-medium text-gray-900">In-App Purchases</h3>
          <p className="text-2xl font-bold text-purple-600 mt-2">
            {formatCurrency(totals.iap, displayCurrency)}
          </p>
          <p className="text-sm text-gray-500 mt-1">Last month</p>
        </button>
      </div>

      {/* Total */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium opacity-90">Total Monthly Income</h3>
            <p className="text-3xl font-bold mt-2">
              {formatCurrency(totals.total, displayCurrency)}
            </p>
          </div>
          <div className="text-right text-sm opacity-75">
            <p>Consultant: {formatCurrency(totals.consultant, displayCurrency)}</p>
            <p>Ads: {formatCurrency(totals.ads, displayCurrency)}</p>
            <p>IAP: {formatCurrency(totals.iap, displayCurrency)}</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Income Breakdown</h3>
        <IncomeChart
          contracts={contracts}
          adRevenue={adRevenue}
          iapRevenue={iapRevenue}
          displayCurrency={displayCurrency}
          rates={rates}
        />
      </div>
    </div>
  )
}
