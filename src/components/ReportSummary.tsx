import { useState, useEffect, useMemo } from 'react'
import { Employee, Currency, CurrencyRate, SmartAttendanceReport } from '../types'
import { useAttendance } from '../hooks/useAttendance'
import { convertCurrency, formatCurrency } from '../utils/currency'
import { calculateSalaryDeduction } from '../utils/salary'

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
  const [allEmployeeReports, setAllEmployeeReports] = useState<Map<number, SmartAttendanceReport>>(new Map())
  const [loading, setLoading] = useState(false)
  const [loadingAll, setLoadingAll] = useState(false)

  const { getSmartMonthlyReport } = useAttendance()

  // Filter out any undefined/null employees - memoize to prevent infinite useEffect loops
  const validEmployees = useMemo(
    () => employees.filter((emp): emp is Employee => emp != null && emp.id != null),
    [employees]
  )

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
      } finally {
        setLoadingAll(false)
      }
    }

    fetchAllReports()
  }, [selectedEmployee, validEmployees, selectedYear, selectedMonth, getSmartMonthlyReport])

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
                {monthlyReport && monthlyReport.sick > 0 && monthlyReport.workdays > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    {(() => {
                      const convertedSalary = convertCurrency(selectedEmployee.salary, selectedEmployee.currency, displayCurrency, rates)
                      const deduction = calculateSalaryDeduction(convertedSalary, monthlyReport)
                      return (
                        <>
                          <p className="text-sm text-gray-500">
                            Adjusted ({months[selectedMonth - 1]}):
                          </p>
                          <p className="text-lg font-semibold text-primary-600">
                            {formatCurrency(deduction.adjustedSalary, displayCurrency)}
                          </p>
                          <p className="text-sm text-red-600">
                            -{formatCurrency(deduction.deductionAmount, displayCurrency)} ({deduction.sickDays} sick day{deduction.sickDays !== 1 ? 's' : ''})
                          </p>
                        </>
                      )
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading reports...</div>
          ) : (
            <div className="space-y-6">
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

                    {/* Salary Adjustment Section */}
                    {monthlyReport.sick > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h5 className="text-sm font-medium text-gray-700 mb-3">Salary Adjustment</h5>
                        {(() => {
                          const convertedSalary = convertCurrency(selectedEmployee.salary, selectedEmployee.currency, displayCurrency, rates)
                          const deduction = calculateSalaryDeduction(convertedSalary, monthlyReport)
                          return (
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-500">Base Salary</span>
                                <span className="font-medium">{formatCurrency(deduction.baseSalary, displayCurrency)}</span>
                              </div>
                              <div className="flex justify-between text-red-600">
                                <span>Sick Day Deduction ({deduction.sickDays} day{deduction.sickDays !== 1 ? 's' : ''})</span>
                                <span>-{formatCurrency(deduction.deductionAmount, displayCurrency)}</span>
                              </div>
                              <div className="flex justify-between pt-2 border-t border-gray-100">
                                <span className="font-medium text-gray-700">Adjusted Salary</span>
                                <span className="font-bold text-primary-600">{formatCurrency(deduction.adjustedSalary, displayCurrency)}</span>
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                    )}
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
          {loadingAll ? (
            <div className="text-center py-8 text-gray-500">Loading reports...</div>
          ) : (
            <>
              {/* Monthly Total Summary Panel */}
              {(() => {
                let totalBaseSalary = 0
                let totalAdjustedSalary = 0
                let totalSickDays = 0

                validEmployees.forEach((employee) => {
                  const convertedSalary = convertCurrency(
                    employee.salary,
                    employee.currency,
                    displayCurrency,
                    rates
                  )
                  const report = allEmployeeReports.get(employee.id)
                  const deduction = report
                    ? calculateSalaryDeduction(convertedSalary, report)
                    : { baseSalary: convertedSalary, adjustedSalary: convertedSalary, deductionAmount: 0, sickDays: 0, workdays: 0 }

                  totalBaseSalary += convertedSalary
                  totalAdjustedSalary += deduction.adjustedSalary
                  totalSickDays += deduction.sickDays
                })

                const totalDeduction = totalBaseSalary - totalAdjustedSalary

                return (
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <div className="text-sm text-gray-500">Employees</div>
                        <div className="text-lg font-semibold">{validEmployees.length}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Base Salary</div>
                        <div className="text-lg font-semibold">{formatCurrency(totalBaseSalary, displayCurrency)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Sick Days</div>
                        <div className="text-lg font-semibold">
                          {totalSickDays > 0 ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              {totalSickDays}
                            </span>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Adjusted Salary</div>
                        <div className="text-lg font-semibold text-primary-600">
                          {formatCurrency(totalAdjustedSalary, displayCurrency)}
                        </div>
                        {totalDeduction > 0 && (
                          <div className="text-xs text-red-600">-{formatCurrency(totalDeduction, displayCurrency)}</div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })()}
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
                      Base Salary
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sick Days
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Adjusted Salary
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
                    const report = allEmployeeReports.get(employee.id)
                    const deduction = report
                      ? calculateSalaryDeduction(convertedSalary, report)
                      : { baseSalary: convertedSalary, adjustedSalary: convertedSalary, deductionAmount: 0, sickDays: 0, workdays: 0 }

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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          {deduction.sickDays > 0 ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              {deduction.sickDays}
                            </span>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
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
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Click on an employee to view detailed attendance reports
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="bg-white rounded-lg shadow p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Legend</h4>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded" />
            <span className="text-sm text-gray-600">Worked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded" />
            <span className="text-sm text-gray-600">Sick Leave (deducted)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded" />
            <span className="text-sm text-gray-600">Vacation (paid)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
