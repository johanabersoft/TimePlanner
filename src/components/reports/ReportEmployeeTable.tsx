import { useState, useMemo } from 'react'
import { Employee, Currency, CurrencyRate, SmartAttendanceReport } from '../../types'
import { convertCurrency, formatCurrency } from '../../utils/currency'
import { calculateSalaryDeduction } from '../../utils/salary'

type SortKey = 'name' | 'position' | 'salary' | 'sickDays' | 'adjusted'
type SortDir = 'asc' | 'desc'

interface ReportEmployeeTableProps {
  employees: Employee[]
  reports: Map<number, SmartAttendanceReport>
  displayCurrency: Currency
  rates: CurrencyRate[]
  onSelectEmployee: (employee: Employee) => void
  monthLabel: string
}

export default function ReportEmployeeTable({
  employees,
  reports,
  displayCurrency,
  rates,
  onSelectEmployee,
  monthLabel
}: ReportEmployeeTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const getSortIndicator = (key: SortKey) => {
    if (sortKey !== key) return null
    return sortDir === 'asc' ? ' ↑' : ' ↓'
  }

  const sortedEmployees = useMemo(() => {
    return [...employees].sort((a, b) => {
      const modifier = sortDir === 'asc' ? 1 : -1

      switch (sortKey) {
        case 'name':
          return modifier * a.name.localeCompare(b.name)
        case 'position':
          return modifier * a.position.localeCompare(b.position)
        case 'salary': {
          const salaryA = convertCurrency(a.salary, a.currency, displayCurrency, rates)
          const salaryB = convertCurrency(b.salary, b.currency, displayCurrency, rates)
          return modifier * (salaryA - salaryB)
        }
        case 'sickDays': {
          const reportA = reports.get(a.id)
          const reportB = reports.get(b.id)
          const sickA = reportA?.sick || 0
          const sickB = reportB?.sick || 0
          return modifier * (sickA - sickB)
        }
        case 'adjusted': {
          const salaryA = convertCurrency(a.salary, a.currency, displayCurrency, rates)
          const salaryB = convertCurrency(b.salary, b.currency, displayCurrency, rates)
          const reportA = reports.get(a.id)
          const reportB = reports.get(b.id)
          const deductionA = reportA
            ? calculateSalaryDeduction(salaryA, reportA)
            : { adjustedSalary: salaryA }
          const deductionB = reportB
            ? calculateSalaryDeduction(salaryB, reportB)
            : { adjustedSalary: salaryB }
          return modifier * (deductionA.adjustedSalary - deductionB.adjustedSalary)
        }
        default:
          return 0
      }
    })
  }, [employees, reports, sortKey, sortDir, displayCurrency, rates])

  const headerClass = "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none transition-colors"

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">
          Employee Details - {monthLabel}
        </h3>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
        >
          {isCollapsed ? 'Expand' : 'Collapse'}
          <svg
            className={`w-4 h-4 transform transition-transform ${isCollapsed ? '' : 'rotate-180'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Table */}
      {!isCollapsed && (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th onClick={() => handleSort('name')} className={headerClass}>
                    Name{getSortIndicator('name')}
                  </th>
                  <th onClick={() => handleSort('position')} className={headerClass}>
                    Position{getSortIndicator('position')}
                  </th>
                  <th onClick={() => handleSort('salary')} className={`${headerClass} text-right`}>
                    Base Salary{getSortIndicator('salary')}
                  </th>
                  <th onClick={() => handleSort('sickDays')} className={`${headerClass} text-center`}>
                    Sick Days{getSortIndicator('sickDays')}
                  </th>
                  <th onClick={() => handleSort('adjusted')} className={`${headerClass} text-right`}>
                    Adjusted Salary{getSortIndicator('adjusted')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedEmployees.map((employee) => {
                  const convertedSalary = convertCurrency(employee.salary, employee.currency, displayCurrency, rates)
                  const report = reports.get(employee.id)
                  const deduction = report
                    ? calculateSalaryDeduction(convertedSalary, report)
                    : { baseSalary: convertedSalary, adjustedSalary: convertedSalary, deductionAmount: 0, sickDays: 0, workdays: 0 }

                  return (
                    <tr
                      key={employee.id}
                      onClick={() => onSelectEmployee(employee)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onSelectEmployee(employee)
                        }
                      }}
                      tabIndex={0}
                      className="hover:bg-gray-50 cursor-pointer focus:outline-none focus:bg-primary-50 transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-medium">
                            {employee.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {employee.position}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                        {formatCurrency(convertedSalary, displayCurrency)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                        {deduction.sickDays > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            {deduction.sickDays}
                          </span>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                        {deduction.sickDays > 0 ? (
                          <div>
                            <span className="font-medium text-gray-900">
                              {formatCurrency(deduction.adjustedSalary, displayCurrency)}
                            </span>
                            <span className="block text-xs text-red-600">
                              -{formatCurrency(deduction.deductionAmount, displayCurrency)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-900">{formatCurrency(convertedSalary, displayCurrency)}</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Click on an employee to view detailed attendance reports
            </p>
          </div>
        </>
      )}
    </div>
  )
}
