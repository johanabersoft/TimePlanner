import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Employee, Currency, CurrencyRate, SmartAttendanceReport } from '../../types'
import { useAttendance } from '../../hooks/useAttendance'
import { useIncome } from '../../hooks/useIncome'
import { convertCurrency } from '../../utils/currency'
import { calculateSalaryDeduction } from '../../utils/salary'

import ReportFilterBar from './ReportFilterBar'
import ReportKpiGrid from './ReportKpiGrid'
import ReportBreakdownCards from './ReportBreakdownCards'
import ReportChart from './ReportChart'
import ReportEmployeeTable from './ReportEmployeeTable'
import ReportEmployeeDetail from './ReportEmployeeDetail'
import ReportEmptyState from './ReportEmptyState'

interface ReportPageProps {
  employees: Employee[]
  selectedEmployee: Employee | null
  onSelectEmployee: (employee: Employee | null) => void
  displayCurrency: Currency
  rates: CurrencyRate[]
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export default function ReportPage({
  employees,
  selectedEmployee,
  onSelectEmployee,
  displayCurrency,
  rates
}: ReportPageProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [monthlyReport, setMonthlyReport] = useState<SmartAttendanceReport | null>(null)
  const [allEmployeeReports, setAllEmployeeReports] = useState<Map<number, SmartAttendanceReport>>(new Map())
  const [loading, setLoading] = useState(false)
  const [loadingAll, setLoadingAll] = useState(false)

  // Cache for chart data (stores reports for multiple months)
  const chartReportsCache = useRef<Map<string, Map<number, SmartAttendanceReport>>>(new Map())

  const { getSmartMonthlyReport } = useAttendance()
  const { contracts, adRevenue, iapRevenue, loading: incomeLoading } = useIncome()

  // Filter out any undefined/null employees
  const validEmployees = useMemo(
    () => employees.filter((emp): emp is Employee => emp != null && emp.id != null),
    [employees]
  )

  // Calculate income totals for selected month/year
  const incomeForPeriod = useMemo(() => {
    const consultantTotal = contracts
      .filter(c => c.is_active)
      .reduce((sum, c) => {
        const converted = convertCurrency(c.monthly_fee, c.currency, displayCurrency, rates)
        return sum + converted
      }, 0)

    const adEntry = adRevenue.find(r => r.year === selectedYear && r.month === selectedMonth)
    const adTotal = adEntry
      ? convertCurrency(adEntry.amount, adEntry.currency, displayCurrency, rates)
      : 0

    const iapEntries = iapRevenue.filter(r => r.year === selectedYear && r.month === selectedMonth)
    const iapTotal = iapEntries.reduce((sum, r) => {
      const converted = convertCurrency(r.amount, r.currency, displayCurrency, rates)
      return sum + converted
    }, 0)

    return {
      consultant: consultantTotal,
      ads: adTotal,
      iap: iapTotal,
      total: consultantTotal + adTotal + iapTotal
    }
  }, [contracts, adRevenue, iapRevenue, selectedYear, selectedMonth, displayCurrency, rates])

  // Calculate salary totals for all employees
  const salaryTotals = useMemo(() => {
    if (selectedEmployee) {
      return { totalBase: 0, totalAdjusted: 0, totalSickDays: 0, totalDeduction: 0 }
    }

    let totalBaseSalary = 0
    let totalAdjustedSalary = 0
    let totalSickDays = 0

    validEmployees.forEach((employee) => {
      const convertedSalary = convertCurrency(employee.salary, employee.currency, displayCurrency, rates)
      const report = allEmployeeReports.get(employee.id)
      const deduction = report
        ? calculateSalaryDeduction(convertedSalary, report)
        : { baseSalary: convertedSalary, adjustedSalary: convertedSalary, deductionAmount: 0, sickDays: 0, workdays: 0 }

      totalBaseSalary += convertedSalary
      totalAdjustedSalary += deduction.adjustedSalary
      totalSickDays += deduction.sickDays
    })

    return {
      totalBase: totalBaseSalary,
      totalAdjusted: totalAdjustedSalary,
      totalSickDays,
      totalDeduction: totalBaseSalary - totalAdjustedSalary
    }
  }, [selectedEmployee, validEmployees, allEmployeeReports, displayCurrency, rates])

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12)
      setSelectedYear(selectedYear - 1)
    } else {
      setSelectedMonth(selectedMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1)
      setSelectedYear(selectedYear + 1)
    } else {
      setSelectedMonth(selectedMonth + 1)
    }
  }

  const handleReset = () => {
    const now = new Date()
    setSelectedYear(now.getFullYear())
    setSelectedMonth(now.getMonth() + 1)
  }

  // Fetch individual employee report
  useEffect(() => {
    async function fetchReports() {
      if (!selectedEmployee) {
        setMonthlyReport(null)
        return
      }

      setLoading(true)
      try {
        const monthly = await getSmartMonthlyReport(selectedEmployee.id, selectedYear, selectedMonth)
        setMonthlyReport(monthly)
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [selectedEmployee, selectedYear, selectedMonth, getSmartMonthlyReport])

  // Fetch reports for all employees when "All Employees" view is active
  useEffect(() => {
    async function fetchAllReports() {
      if (selectedEmployee || validEmployees.length === 0) {
        return
      }

      setLoadingAll(true)
      try {
        const reports = new Map<number, SmartAttendanceReport>()
        await Promise.all(
          validEmployees.map(async (emp) => {
            const report = await getSmartMonthlyReport(emp.id, selectedYear, selectedMonth)
            if (report) {
              reports.set(emp.id, report)
            }
          })
        )
        setAllEmployeeReports(reports)

        // Cache for chart
        const cacheKey = `${selectedYear}-${selectedMonth}`
        chartReportsCache.current.set(cacheKey, reports)
      } finally {
        setLoadingAll(false)
      }
    }

    fetchAllReports()
  }, [selectedEmployee, validEmployees, selectedYear, selectedMonth, getSmartMonthlyReport])

  // Function to get employee reports for a specific month (for chart)
  const getEmployeeReportsForMonth = useCallback((year: number, month: number): Map<number, SmartAttendanceReport> => {
    const cacheKey = `${year}-${month}`
    const cached = chartReportsCache.current.get(cacheKey)
    if (cached) return cached

    // Return empty map if not cached - chart will show 0 expenses for uncached months
    return new Map()
  }, [])

  const monthLabel = `${MONTHS[selectedMonth - 1]} ${selectedYear}`

  // Empty state: no employees
  if (validEmployees.length === 0) {
    return <ReportEmptyState variant="no-employees" />
  }

  // Individual employee view
  if (selectedEmployee) {
    return (
      <div className="space-y-6">
        {/* Filter Bar */}
        <ReportFilterBar
          employees={validEmployees}
          selectedEmployee={selectedEmployee}
          onSelectEmployee={onSelectEmployee}
          selectedYear={selectedYear}
          onSelectYear={setSelectedYear}
          selectedMonth={selectedMonth}
          onSelectMonth={setSelectedMonth}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onReset={handleReset}
        />

        {/* Employee Detail View */}
        <ReportEmployeeDetail
          employee={selectedEmployee}
          report={monthlyReport}
          displayCurrency={displayCurrency}
          rates={rates}
          loading={loading}
          monthLabel={monthLabel}
        />
      </div>
    )
  }

  // All employees view
  const isLoading = loadingAll || incomeLoading

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <ReportFilterBar
        employees={validEmployees}
        selectedEmployee={selectedEmployee}
        onSelectEmployee={onSelectEmployee}
        selectedYear={selectedYear}
        onSelectYear={setSelectedYear}
        selectedMonth={selectedMonth}
        onSelectMonth={setSelectedMonth}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onReset={handleReset}
      />

      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
          <div className="text-center text-gray-500">Loading data...</div>
        </div>
      ) : (
        <>
          {/* KPI Grid */}
          <ReportKpiGrid
            totalIncome={incomeForPeriod.total}
            totalExpenses={salaryTotals.totalAdjusted}
            displayCurrency={displayCurrency}
            monthLabel={monthLabel}
          />

          {/* Breakdown Cards */}
          <ReportBreakdownCards
            income={incomeForPeriod}
            expenses={salaryTotals}
            displayCurrency={displayCurrency}
          />

          {/* Chart */}
          <ReportChart
            contracts={contracts}
            adRevenue={adRevenue}
            iapRevenue={iapRevenue}
            employees={validEmployees}
            getEmployeeReports={getEmployeeReportsForMonth}
            displayCurrency={displayCurrency}
            rates={rates}
            currentYear={selectedYear}
            currentMonth={selectedMonth}
          />

          {/* Employee Table */}
          <ReportEmployeeTable
            employees={validEmployees}
            reports={allEmployeeReports}
            displayCurrency={displayCurrency}
            rates={rates}
            onSelectEmployee={onSelectEmployee}
            monthLabel={monthLabel}
          />
        </>
      )}
    </div>
  )
}
