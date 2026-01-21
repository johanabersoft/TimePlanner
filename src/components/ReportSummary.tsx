import { useState, useEffect } from 'react'
import { Employee, Currency, CurrencyRate, SmartAttendanceReport } from '../types'
import { useAttendance } from '../hooks/useAttendance'
import { convertCurrency, formatCurrency } from '../utils/currency'

interface ReportSummaryProps {
  employees: Employee[]
  selectedEmployee: Employee | null
  onSelectEmployee: (employee: Employee | null) => void
  displayCurrency: Currency
  rates: CurrencyRate[]
}

export default function ReportSummary({
  employees,
  selectedEmployee,
  onSelectEmployee,
  displayCurrency,
  rates
}: ReportSummaryProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [monthlyReport, setMonthlyReport] = useState<SmartAttendanceReport | null>(null)
  const [yearlyReport, setYearlyReport] = useState<SmartAttendanceReport | null>(null)
  const [loading, setLoading] = useState(false)

  const { getSmartMonthlyReport, getSmartYearlyReport } = useAttendance()

  // Filter out any undefined/null employees
  const validEmployees = employees.filter((emp): emp is Employee => emp != null && emp.id != null)

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  useEffect(() => {
    async function fetchReports() {
      if (!selectedEmployee) {
        setMonthlyReport(null)
        setYearlyReport(null)
        return
      }

      setLoading(true)
      try {
        const [monthly, yearly] = await Promise.all([
          getSmartMonthlyReport(selectedEmployee.id, selectedYear, selectedMonth),
          getSmartYearlyReport(selectedEmployee.id, selectedYear)
        ])
        setMonthlyReport(monthly)
        setYearlyReport(yearly)
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [selectedEmployee, selectedYear, selectedMonth, getSmartMonthlyReport, getSmartYearlyReport])

  if (validEmployees.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No data to report</h3>
        <p className="mt-1 text-sm text-gray-500">Add employees to generate reports.</p>
      </div>
    )
  }

  const renderAttendanceBar = (report: SmartAttendanceReport | null) => {
    if (!report || report.workdays === 0) return null

    const workedPct = (report.worked / report.workdays) * 100
    const sickPct = (report.sick / report.workdays) * 100
    const vacationPct = (report.vacation / report.workdays) * 100

    return (
      <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden flex">
        <div
          className="bg-green-500 h-full"
          style={{ width: `${workedPct}%` }}
          title={`Worked: ${report.worked} days`}
        />
        <div
          className="bg-yellow-500 h-full"
          style={{ width: `${sickPct}%` }}
          title={`Sick: ${report.sick} days`}
        />
        <div
          className="bg-blue-500 h-full"
          style={{ width: `${vacationPct}%` }}
          title={`Vacation: ${report.vacation} days`}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employee
            </label>
            <select
              value={selectedEmployee?.id || ''}
              onChange={(e) => {
                const employee = validEmployees.find(emp => emp.id === parseInt(e.target.value))
                onSelectEmployee(employee || null)
              }}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All employees</option>
              {validEmployees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500"
            >
              {months.map((month, index) => (
                <option key={index} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Individual Employee Report */}
      {selectedEmployee && (
        <div className="space-y-6">
          {/* Employee Info Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-16 w-16 rounded-full bg-primary-600 flex items-center justify-center text-white text-2xl font-bold">
                  {selectedEmployee.name.charAt(0).toUpperCase()}
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold text-gray-900">{selectedEmployee.name}</h3>
                  <p className="text-gray-500">{selectedEmployee.position}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Monthly Salary</p>
                <p className="text-2xl font-bold text-primary-600">
                  {formatCurrency(
                    convertCurrency(selectedEmployee.salary, selectedEmployee.currency, displayCurrency, rates),
                    displayCurrency
                  )}
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading reports...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Monthly Report */}
              <div className="bg-white rounded-lg shadow p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">
                  {months[selectedMonth - 1]} {selectedYear}
                </h4>

                {monthlyReport && monthlyReport.workdays > 0 ? (
                  <>
                    {renderAttendanceBar(monthlyReport)}
                    <div className="mt-4 grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{monthlyReport.worked}</div>
                        <div className="text-sm text-gray-500">Worked</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">{monthlyReport.sick}</div>
                        <div className="text-sm text-gray-500">Sick</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{monthlyReport.vacation}</div>
                        <div className="text-sm text-gray-500">Vacation</div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Total workdays (weekdays)</span>
                        <span className="font-medium">{monthlyReport.workdays}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-gray-500 text-center py-4">No workdays in this period</p>
                )}
              </div>

              {/* Yearly Report */}
              <div className="bg-white rounded-lg shadow p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">
                  Year {selectedYear} Summary
                </h4>

                {yearlyReport && yearlyReport.workdays > 0 ? (
                  <>
                    {renderAttendanceBar(yearlyReport)}
                    <div className="mt-4 grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{yearlyReport.worked}</div>
                        <div className="text-sm text-gray-500">Worked</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">{yearlyReport.sick}</div>
                        <div className="text-sm text-gray-500">Sick</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{yearlyReport.vacation}</div>
                        <div className="text-sm text-gray-500">Vacation</div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Total workdays (weekdays)</span>
                        <span className="font-medium">{yearlyReport.workdays}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-gray-500 text-center py-4">No workdays in this period</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* All Employees Summary Table */}
      {!selectedEmployee && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              All Employees - {months[selectedMonth - 1]} {selectedYear}
            </h3>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Salary
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {validEmployees.map((employee) => {
                const convertedSalary = convertCurrency(
                  employee.salary,
                  employee.currency,
                  displayCurrency,
                  rates
                )

                return (
                  <tr
                    key={employee.id}
                    onClick={() => onSelectEmployee(employee)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium">
                          {employee.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {employee.position}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {formatCurrency(convertedSalary, displayCurrency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                      {new Date(employee.start_date).toLocaleDateString()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Click on an employee to view detailed attendance reports
            </p>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="bg-white rounded-lg shadow p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Legend</h4>
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded" />
            <span className="text-sm text-gray-600">Worked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded" />
            <span className="text-sm text-gray-600">Sick Leave</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded" />
            <span className="text-sm text-gray-600">Vacation</span>
          </div>
        </div>
      </div>
    </div>
  )
}
