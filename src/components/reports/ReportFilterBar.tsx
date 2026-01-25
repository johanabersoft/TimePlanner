import { Employee } from '../../types'

interface ReportFilterBarProps {
  employees: Employee[]
  selectedEmployee: Employee | null
  onSelectEmployee: (employee: Employee | null) => void
  selectedYear: number
  onSelectYear: (year: number) => void
  selectedMonth: number
  onSelectMonth: (month: number) => void
  onPrevMonth: () => void
  onNextMonth: () => void
  onReset: () => void
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export default function ReportFilterBar({
  employees,
  selectedEmployee,
  onSelectEmployee,
  selectedYear,
  onSelectYear,
  selectedMonth,
  onSelectMonth,
  onPrevMonth,
  onNextMonth,
  onReset
}: ReportFilterBarProps) {
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex flex-wrap items-end gap-4">
        {/* Left: Filter dropdowns */}
        <div className="flex flex-wrap gap-3 flex-1">
          {/* Employee Filter */}
          <div className="min-w-[160px]">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
              Employee
            </label>
            <select
              value={selectedEmployee?.id || ''}
              onChange={(e) => {
                const employee = employees.find(emp => emp.id === parseInt(e.target.value))
                onSelectEmployee(employee || null)
              }}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm"
            >
              <option value="">All employees</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div className="min-w-[100px]">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
              Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => onSelectYear(parseInt(e.target.value))}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Month Filter */}
          <div className="min-w-[130px]">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
              Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => onSelectMonth(parseInt(e.target.value))}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm"
            >
              {MONTHS.map((month, index) => (
                <option key={index} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Navigation */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={onPrevMonth}
              aria-label="Previous month"
              className="p-1.5 rounded hover:bg-gray-200 transition-colors"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="px-3 text-sm font-medium text-gray-700 min-w-[100px] text-center">
              {MONTHS[selectedMonth - 1].substring(0, 3)} {selectedYear}
            </span>
            <button
              onClick={onNextMonth}
              aria-label="Next month"
              className="p-1.5 rounded hover:bg-gray-200 transition-colors"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <button
            onClick={onReset}
            className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Data scope label */}
      <p className="mt-3 text-xs text-gray-500 border-t border-gray-100 pt-3">
        Showing: {selectedEmployee?.name || 'All employees'} · {MONTHS[selectedMonth - 1]} {selectedYear}
      </p>
    </div>
  )
}
