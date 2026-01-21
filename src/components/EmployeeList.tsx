import { Employee, Currency, CurrencyRate } from '../types'
import { convertCurrency, formatCurrency } from '../utils/currency'

interface EmployeeListProps {
  employees: Employee[]
  selectedEmployee: Employee | null
  onSelect: (employee: Employee) => void
  onEdit: (employee: Employee) => void
  onDelete: (id: number) => void
  displayCurrency: Currency
  rates: CurrencyRate[]
}

export default function EmployeeList({
  employees,
  selectedEmployee,
  onSelect,
  onEdit,
  onDelete,
  displayCurrency,
  rates
}: EmployeeListProps) {
  // Filter out any undefined/null employees
  const validEmployees = employees.filter((emp): emp is Employee => emp != null && emp.id != null)

  if (validEmployees.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No employees</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by adding a new employee.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Position
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Salary
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Start Date
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
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
            const isSelected = selectedEmployee?.id === employee.id

            return (
              <tr
                key={employee.id}
                onClick={() => onSelect(employee)}
                className={`cursor-pointer transition-colors ${
                  isSelected ? 'bg-primary-50' : 'hover:bg-gray-50'
                }`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium">
                      {employee.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{employee.position}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatCurrency(convertedSalary, displayCurrency)}
                  </div>
                  {employee.currency !== displayCurrency && (
                    <div className="text-xs text-gray-500">
                      ({formatCurrency(employee.salary, employee.currency)})
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(employee.start_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit(employee)
                    }}
                    className="text-primary-600 hover:text-primary-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(employee.id)
                    }}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
