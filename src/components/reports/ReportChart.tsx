import { useMemo } from 'react'
import { Currency, CurrencyRate, ConsultantContract, AdRevenue, IapRevenue, Employee, SmartAttendanceReport } from '../../types'
import { convertCurrency, formatCurrency } from '../../utils/currency'
import { calculateSalaryDeduction } from '../../utils/salary'

interface ReportChartProps {
  contracts: ConsultantContract[]
  adRevenue: AdRevenue[]
  iapRevenue: IapRevenue[]
  employees: Employee[]
  getEmployeeReports: (year: number, month: number) => Map<number, SmartAttendanceReport>
  displayCurrency: Currency
  rates: CurrencyRate[]
  currentYear: number
  currentMonth: number
}

interface MonthData {
  month: string
  year: number
  monthNum: number
  income: number
  expenses: number
}

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function ReportChart({
  contracts,
  adRevenue,
  iapRevenue,
  employees,
  getEmployeeReports,
  displayCurrency,
  rates,
  currentYear,
  currentMonth
}: ReportChartProps) {
  // Generate last 6 months of data
  const monthlyData = useMemo<MonthData[]>(() => {
    const data: MonthData[] = []

    for (let i = 5; i >= 0; i--) {
      let targetMonth = currentMonth - i
      let targetYear = currentYear

      while (targetMonth <= 0) {
        targetMonth += 12
        targetYear--
      }

      // Calculate income for this month
      const consultantTotal = contracts
        .filter(c => c.is_active)
        .reduce((sum, c) => sum + convertCurrency(c.monthly_fee, c.currency, displayCurrency, rates), 0)

      const adEntry = adRevenue.find(r => r.year === targetYear && r.month === targetMonth)
      const adTotal = adEntry ? convertCurrency(adEntry.amount, adEntry.currency, displayCurrency, rates) : 0

      const iapEntries = iapRevenue.filter(r => r.year === targetYear && r.month === targetMonth)
      const iapTotal = iapEntries.reduce((sum, r) => sum + convertCurrency(r.amount, r.currency, displayCurrency, rates), 0)

      const income = consultantTotal + adTotal + iapTotal

      // Calculate expenses for this month
      const reports = getEmployeeReports(targetYear, targetMonth)
      let expenses = 0
      employees.forEach(emp => {
        const convertedSalary = convertCurrency(emp.salary, emp.currency, displayCurrency, rates)
        const report = reports.get(emp.id)
        const deduction = report
          ? calculateSalaryDeduction(convertedSalary, report)
          : { adjustedSalary: convertedSalary }
        expenses += deduction.adjustedSalary
      })

      data.push({
        month: MONTH_ABBR[targetMonth - 1],
        year: targetYear,
        monthNum: targetMonth,
        income,
        expenses
      })
    }

    return data
  }, [contracts, adRevenue, iapRevenue, employees, getEmployeeReports, displayCurrency, rates, currentYear, currentMonth])

  // Calculate max value for scaling
  const maxValue = useMemo(() => {
    return Math.max(...monthlyData.flatMap(d => [d.income, d.expenses]), 1)
  }, [monthlyData])

  const getBarHeight = (value: number) => {
    return Math.max((value / maxValue) * 100, 2) // Minimum 2% height for visibility
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Monthly Trend</h3>

      {/* Chart area */}
      <div className="flex items-end gap-3 h-48 px-2">
        {monthlyData.map((data, index) => (
          <div key={`${data.year}-${data.monthNum}`} className="flex-1 flex flex-col items-center">
            <div className="w-full flex justify-center gap-1 h-40 items-end">
              {/* Income bar */}
              <div
                className="w-4 bg-green-500 rounded-t transition-all duration-300 hover:bg-green-400"
                style={{ height: `${getBarHeight(data.income)}%` }}
                title={`Income: ${formatCurrency(data.income, displayCurrency)}`}
              />
              {/* Expenses bar */}
              <div
                className="w-4 bg-red-400 rounded-t transition-all duration-300 hover:bg-red-300"
                style={{ height: `${getBarHeight(data.expenses)}%` }}
                title={`Expenses: ${formatCurrency(data.expenses, displayCurrency)}`}
              />
            </div>
            <span className={`text-xs mt-2 ${index === monthlyData.length - 1 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
              {data.month}
            </span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-gray-100">
        <span className="flex items-center gap-1.5 text-xs text-gray-600">
          <span className="w-3 h-3 bg-green-500 rounded-sm"></span>
          Income
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-600">
          <span className="w-3 h-3 bg-red-400 rounded-sm"></span>
          Expenses
        </span>
      </div>
    </div>
  )
}
