import { useState, useEffect } from 'react'
import { Employee, Currency, EmployeeInput } from '../types'
import { CURRENCIES } from '../utils/currency'

interface EmployeeFormProps {
  employee: Employee | null
  onSave: (data: EmployeeInput) => Promise<void>
  onCancel: () => void
}

// Format number with thousand separators
function formatNumberWithSeparators(value: string | number): string {
  const num = typeof value === 'string' ? value.replace(/[^\d.]/g, '') : value.toString()
  if (!num) return ''

  const parts = num.split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return parts.join('.')
}

// Parse formatted string back to number
function parseFormattedNumber(value: string): string {
  return value.replace(/,/g, '')
}

export default function EmployeeForm({ employee, onSave, onCancel }: EmployeeFormProps) {
  const [name, setName] = useState('')
  const [position, setPosition] = useState('')
  const [salary, setSalary] = useState('')
  const [displaySalary, setDisplaySalary] = useState('')
  const [currency, setCurrency] = useState<Currency>('USD')
  const [startDate, setStartDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (employee) {
      setName(employee.name)
      setPosition(employee.position)
      setSalary(employee.salary.toString())
      setDisplaySalary(formatNumberWithSeparators(employee.salary))
      setCurrency(employee.currency)
      setStartDate(employee.start_date)
    } else {
      // Default to today for new employees
      setStartDate(new Date().toISOString().split('T')[0])
    }
  }, [employee])

  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    const rawValue = parseFormattedNumber(input)

    // Only allow valid number characters
    if (rawValue && !/^\d*\.?\d*$/.test(rawValue)) return

    setSalary(rawValue)
    setDisplaySalary(formatNumberWithSeparators(rawValue))
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!position.trim()) {
      newErrors.position = 'Position is required'
    }

    const salaryNum = parseFloat(salary)
    if (isNaN(salaryNum) || salaryNum < 0) {
      newErrors.salary = 'Please enter a valid salary amount'
    }

    if (!startDate) {
      newErrors.startDate = 'Start date is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setSaving(true)
    try {
      await onSave({
        name: name.trim(),
        position: position.trim(),
        salary: parseFloat(salary),
        currency,
        start_date: startDate
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {employee ? 'Edit Employee' : 'Add Employee'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`mt-1 block w-full rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="John Doe"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="position" className="block text-sm font-medium text-gray-700">
              Position
            </label>
            <input
              type="text"
              id="position"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className={`mt-1 block w-full rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 ${
                errors.position ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Software Developer"
            />
            {errors.position && <p className="mt-1 text-sm text-red-600">{errors.position}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="salary" className="block text-sm font-medium text-gray-700">
                Monthly Salary
              </label>
              <input
                type="text"
                id="salary"
                value={displaySalary}
                onChange={handleSalaryChange}
                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 font-mono text-lg ${
                  errors.salary ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="5,000,000"
              />
              {errors.salary && <p className="mt-1 text-sm text-red-600">{errors.salary}</p>}
            </div>

            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
                Currency
              </label>
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500"
              >
                {CURRENCIES.map((curr) => (
                  <option key={curr} value={curr}>
                    {curr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={`mt-1 block w-full rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 ${
                errors.startDate ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.startDate && <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : employee ? 'Update' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
