import { Employee, Currency, CurrencyRate } from '../types'
import { convertCurrency, formatCurrency, getCurrencyName } from '../utils/currency'

interface SalaryDisplayProps {
  employees: Employee[]
  displayCurrency: Currency
  rates: CurrencyRate[]
}

export default function SalaryDisplay({
  employees,
  displayCurrency,
  rates
}: SalaryDisplayProps) {
  // Filter out any undefined/null employees
  const validEmployees = employees.filter((emp): emp is Employee => emp != null && emp.id != null)

  if (validEmployees.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No salary data</h3>
        <p className="mt-1 text-sm text-gray-500">Add employees to view salary information.</p>
      </div>
    )
  }

  const totalInDisplayCurrency = validEmployees.reduce((sum, emp) => {
    return sum + convertCurrency(emp.salary, emp.currency, displayCurrency, rates)
  }, 0)

  const groupedByCurrency = validEmployees.reduce((groups, emp) => {
    if (!groups[emp.currency]) {
      groups[emp.currency] = []
    }
    groups[emp.currency].push(emp)
    return groups
  }, {} as Record<Currency, Employee[]>)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-primary-100 text-primary-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Employees</p>
              <p className="text-2xl font-semibold text-gray-900">{validEmployees.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Monthly Payroll</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(totalInDisplayCurrency, displayCurrency)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Average Salary</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(totalInDisplayCurrency / validEmployees.length, displayCurrency)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Currency info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-blue-700">
            Displaying all amounts in {getCurrencyName(displayCurrency)} ({displayCurrency}).
            Change the display currency in the sidebar.
          </span>
        </div>
      </div>

      {/* Salary Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
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
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                In {displayCurrency}
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
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium">
                        {employee.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                        <div className="text-xs text-gray-500">
                          Since {new Date(employee.start_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{employee.position}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm text-gray-900">
                      {formatCurrency(employee.salary, employee.currency)}
                    </div>
                    <div className="text-xs text-gray-500">{employee.currency}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(convertedSalary, displayCurrency)}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td colSpan={3} className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                Total Monthly Payroll
              </td>
              <td className="px-6 py-4 text-right text-lg font-bold text-primary-600">
                {formatCurrency(totalInDisplayCurrency, displayCurrency)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Breakdown by Currency */}
      {Object.keys(groupedByCurrency).length > 1 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Breakdown by Currency</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(Object.entries(groupedByCurrency) as [Currency, Employee[]][]).map(([currency, emps]) => {
              const total = emps.reduce((sum, emp) => sum + emp.salary, 0)
              const convertedTotal = convertCurrency(total, currency, displayCurrency, rates)

              return (
                <div key={currency} className="border border-gray-200 rounded-lg p-4">
                  <div className="text-sm text-gray-500">{getCurrencyName(currency)}</div>
                  <div className="text-xl font-semibold text-gray-900 mt-1">
                    {formatCurrency(total, currency)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {emps.length} employee{emps.length !== 1 ? 's' : ''}
                  </div>
                  {currency !== displayCurrency && (
                    <div className="text-sm text-primary-600 mt-2">
                      = {formatCurrency(convertedTotal, displayCurrency)}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
