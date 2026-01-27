import { useState, useEffect, useCallback } from 'react'
import { Employee, Attendance, AttendanceStatus, AttendanceViewMode, DailyAttendanceEntry, VacationBalance } from '../types'
import { useAttendance } from '../hooks/useAttendance'
import { MONTHS } from '../utils/currency'

interface AttendanceCalendarProps {
  employees: Employee[]
  selectedEmployee: Employee | null
  onSelectEmployee: (employee: Employee | null) => void
}

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  worked: 'bg-green-500',
  sick: 'bg-yellow-500',
  vacation: 'bg-blue-500'
}

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  worked: 'Worked',
  sick: 'Sick',
  vacation: 'Vacation'
}

// Helper to check if a date is a weekday
function isWeekday(date: Date): boolean {
  const day = date.getDay()
  return day !== 0 && day !== 6
}

export default function AttendanceCalendar({
  employees,
  selectedEmployee,
  onSelectEmployee
}: AttendanceCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<AttendanceViewMode>('daily')
  const [dailyEntries, setDailyEntries] = useState<DailyAttendanceEntry[]>([])
  const [dailyLoading, setDailyLoading] = useState(false)

  // Vacation balance state
  const [vacationBalances, setVacationBalances] = useState<Map<number, VacationBalance>>(new Map())
  const [selectedEmployeeVacationBalance, setSelectedEmployeeVacationBalance] = useState<VacationBalance | null>(null)
  const [showVacationWarning, setShowVacationWarning] = useState(false)
  const [pendingVacationAction, setPendingVacationAction] = useState<{ employeeId: number; employeeName: string } | null>(null)

  const {
    attendance,
    fetchByEmployee,
    fetchAllEmployeesForDate,
    setAttendance,
    loading,
    getVacationBalance
  } = useAttendance()

  // Filter out any undefined/null employees
  const validEmployees = employees.filter((emp): emp is Employee => emp != null && emp.id != null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Format date for display
  const formatDateDisplay = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Get today's date string
  const getTodayString = (): string => {
    const today = new Date()
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  }

  // Fetch attendance for month view
  useEffect(() => {
    if (viewMode === 'month' && selectedEmployee) {
      const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`
      fetchByEmployee(selectedEmployee.id, monthStr)
    }
  }, [selectedEmployee, year, month, fetchByEmployee, viewMode])

  // Fetch all employees for daily view
  const fetchDailyData = useCallback(async () => {
    if (viewMode !== 'daily') return

    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`
    setDailyLoading(true)
    try {
      const entries = await fetchAllEmployeesForDate(dateStr)
      setDailyEntries(entries)
    } finally {
      setDailyLoading(false)
    }
  }, [currentDate, viewMode, fetchAllEmployeesForDate])

  useEffect(() => {
    fetchDailyData()
  }, [fetchDailyData])

  // Fetch vacation balance for selected employee in month view
  useEffect(() => {
    if (viewMode === 'month' && selectedEmployee) {
      const fetchBalance = async () => {
        const balance = await getVacationBalance(selectedEmployee.id, year)
        setSelectedEmployeeVacationBalance(balance)
      }
      fetchBalance()
    } else {
      setSelectedEmployeeVacationBalance(null)
    }
  }, [viewMode, selectedEmployee, year, getVacationBalance])

  // Fetch vacation balances for all employees in daily view
  useEffect(() => {
    if (viewMode === 'daily' && dailyEntries.length > 0) {
      const fetchAllBalances = async () => {
        const balanceMap = new Map<number, VacationBalance>()
        const currentYear = currentDate.getFullYear()

        await Promise.all(
          dailyEntries.map(async (entry) => {
            const balance = await getVacationBalance(entry.employee_id, currentYear)
            if (balance) {
              balanceMap.set(entry.employee_id, balance)
            }
          })
        )

        setVacationBalances(balanceMap)
      }
      fetchAllBalances()
    }
  }, [viewMode, dailyEntries, currentDate, getVacationBalance])

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = new Date(year, month, 1).getDay()


  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const goToPreviousDay = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() - 1)
    setCurrentDate(newDate)
  }

  const goToNextDay = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + 1)
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const getAttendanceForDate = (date: string): Attendance | undefined => {
    return attendance.find(a => a.date === date)
  }

  const handleDateClick = (day: number) => {
    if (!selectedEmployee) return
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    setSelectedDate(dateStr)
  }

  const handleSetStatus = async (status: AttendanceStatus, skipWarning = false) => {
    if (!selectedEmployee || !selectedDate) return

    // Check vacation balance before setting vacation status
    if (status === 'vacation' && !skipWarning) {
      const currentRecord = getAttendanceForDate(selectedDate)
      if (selectedEmployeeVacationBalance && selectedEmployeeVacationBalance.remaining <= 0 && currentRecord?.status !== 'vacation') {
        // Show warning modal
        setPendingVacationAction({ employeeId: selectedEmployee.id, employeeName: selectedEmployee.name })
        setShowVacationWarning(true)
        return
      }
    }

    await setAttendance({
      employee_id: selectedEmployee.id,
      date: selectedDate,
      status,
      notes: ''
    })
    setSelectedDate(null)

    // Refresh vacation balance for this employee
    if (status === 'vacation') {
      const updatedBalance = await getVacationBalance(selectedEmployee.id, year)
      setSelectedEmployeeVacationBalance(updatedBalance)
    }
  }

  // Handle vacation warning modal actions for month view
  const handleMonthVacationWarningConfirm = () => {
    if (pendingVacationAction && selectedEmployee && selectedDate) {
      handleSetStatus('vacation', true)
    }
    setShowVacationWarning(false)
    setPendingVacationAction(null)
  }

  // Handle status change in daily view
  const handleDailyStatusChange = async (employeeId: number, status: AttendanceStatus | null, skipWarning = false) => {
    // Check vacation balance before setting vacation status
    if (status === 'vacation' && !skipWarning) {
      const balance = vacationBalances.get(employeeId)
      const entry = dailyEntries.find(e => e.employee_id === employeeId)
      if (balance && balance.remaining <= 0 && entry?.status !== 'vacation') {
        // Show warning modal
        setPendingVacationAction({ employeeId, employeeName: entry?.employee_name || 'Employee' })
        setShowVacationWarning(true)
        return
      }
    }

    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`

    // Update optimistically
    setDailyEntries(prev => prev.map(entry =>
      entry.employee_id === employeeId
        ? { ...entry, status }
        : entry
    ))

    if (status === null) {
      // For smart defaults, we don't actually delete - we just don't store "worked" for weekdays
      // The UI will show as "worked" (default) but no record exists
      await window.electronAPI.attendance.deleteByEmployeeAndDate(employeeId, dateStr)
    } else {
      await setAttendance({
        employee_id: employeeId,
        date: dateStr,
        status,
        notes: ''
      })
    }

    // Refresh data and update vacation balances
    fetchDailyData()

    // Refresh vacation balance for this employee
    if (status === 'vacation' || status === null) {
      const updatedBalance = await getVacationBalance(employeeId, currentDate.getFullYear())
      if (updatedBalance) {
        setVacationBalances(prev => new Map(prev).set(employeeId, updatedBalance))
      }
    }
  }

  // Handle vacation warning modal actions
  const handleVacationWarningConfirm = () => {
    if (pendingVacationAction) {
      handleDailyStatusChange(pendingVacationAction.employeeId, 'vacation', true)
    }
    setShowVacationWarning(false)
    setPendingVacationAction(null)
  }

  const handleVacationWarningCancel = () => {
    setShowVacationWarning(false)
    setPendingVacationAction(null)
  }

  // Get effective status for daily view (with smart defaults)
  const getEffectiveStatus = (entry: DailyAttendanceEntry): AttendanceStatus | 'default' => {
    if (entry.status) return entry.status
    // Smart default: weekdays are "worked" by default
    if (isWeekday(currentDate)) return 'default'
    return 'default' // Weekend with no status shows as empty/default
  }

  // Get vacation badge color based on remaining days
  const getVacationBadgeColor = (balance: VacationBalance): string => {
    if (balance.remaining <= 0) return 'bg-red-100 text-red-700 border-red-300'
    if (balance.remaining <= 3) return 'bg-yellow-100 text-yellow-700 border-yellow-300'
    return 'bg-blue-100 text-blue-700 border-blue-300'
  }

  // Calculate daily summary
  const getDailySummary = () => {
    const isWeekdayDate = isWeekday(currentDate)
    let worked = 0
    let sick = 0
    let vacation = 0

    dailyEntries.forEach(entry => {
      if (entry.status === 'sick') sick++
      else if (entry.status === 'vacation') vacation++
      else if (entry.status === 'worked' || (isWeekdayDate && !entry.status)) worked++
    })

    return { worked, sick, vacation }
  }

  const renderCalendarDays = () => {
    const days = []

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-gray-50" />)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const attendanceRecord = getAttendanceForDate(dateStr)
      const isToday = getTodayString() === dateStr
      const isSelected = selectedDate === dateStr
      const dayDate = new Date(year, month, day)
      const isWeekend = !isWeekday(dayDate)

      // Smart default: show worked indicator for weekdays without explicit record
      const showSmartDefault = !attendanceRecord && !isWeekend && selectedEmployee

      days.push(
        <div
          key={day}
          onClick={() => handleDateClick(day)}
          className={`h-24 p-2 border border-gray-200 cursor-pointer transition-colors ${
            isWeekend ? 'bg-gray-50' : 'bg-white'
          } ${isSelected ? 'ring-2 ring-primary-500' : ''} ${
            selectedEmployee ? 'hover:bg-gray-100' : ''
          }`}
        >
          <div className="flex justify-between items-start">
            <span
              className={`text-sm font-medium ${
                isToday
                  ? 'bg-primary-600 text-white w-6 h-6 rounded-full flex items-center justify-center'
                  : 'text-gray-900'
              }`}
            >
              {day}
            </span>
            {attendanceRecord && (
              <span
                className={`w-3 h-3 rounded-full ${STATUS_COLORS[attendanceRecord.status]}`}
                title={STATUS_LABELS[attendanceRecord.status]}
              />
            )}
            {showSmartDefault && (
              <span
                className="w-3 h-3 rounded-full bg-green-300 border border-green-500"
                title="Worked (default)"
              />
            )}
          </div>
          {attendanceRecord && (
            <div className="mt-1">
              <span
                className={`inline-block px-2 py-0.5 text-xs text-white rounded ${
                  STATUS_COLORS[attendanceRecord.status]
                }`}
              >
                {STATUS_LABELS[attendanceRecord.status]}
              </span>
            </div>
          )}
          {showSmartDefault && (
            <div className="mt-1">
              <span className="inline-block px-2 py-0.5 text-xs text-green-700 bg-green-100 rounded border border-green-300">
                Worked
              </span>
            </div>
          )}
        </div>
      )
    }

    return days
  }

  const renderDailyView = () => {
    const summary = getDailySummary()
    const isWeekdayDate = isWeekday(currentDate)

    return (
      <div className="bg-white rounded-lg shadow">
        {/* Daily View Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <button
              onClick={goToPreviousDay}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {formatDateDisplay(currentDate)}
              </h3>
              {!isWeekdayDate && (
                <span className="text-sm text-gray-500">Weekend</span>
              )}
            </div>
            <button
              onClick={goToNextDay}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Today
          </button>
        </div>

        {/* Employee List */}
        {dailyLoading ? (
          <div className="p-8 text-center text-gray-500">Loading employees...</div>
        ) : dailyEntries.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No employees found. Add employees first.</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {dailyEntries.map((entry) => {
              const effectiveStatus = getEffectiveStatus(entry)
              const balance = vacationBalances.get(entry.employee_id)

              return (
                <div key={entry.employee_id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium">
                      {entry.employee_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{entry.employee_name}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">{entry.position}</span>
                        {balance && (
                          <span className={`text-xs px-2 py-0.5 rounded border ${getVacationBadgeColor(balance)}`}>
                            {balance.remaining}/{balance.allowance} vacation
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {/* Worked button */}
                    <button
                      onClick={() => handleDailyStatusChange(
                        entry.employee_id,
                        // If already worked (explicit or default on weekday), clear it
                        entry.status === 'worked' ? null : 'worked'
                      )}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors flex items-center gap-1 ${
                        entry.status === 'worked'
                          ? 'bg-green-500 text-white border-green-500'
                          : effectiveStatus === 'default' && isWeekdayDate
                          ? 'bg-green-100 text-green-700 border-green-300'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {(entry.status === 'worked' || (effectiveStatus === 'default' && isWeekdayDate)) && (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      Worked
                    </button>

                    {/* Sick button */}
                    <button
                      onClick={() => handleDailyStatusChange(
                        entry.employee_id,
                        entry.status === 'sick' ? null : 'sick'
                      )}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                        entry.status === 'sick'
                          ? 'bg-yellow-500 text-white border-yellow-500'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Sick
                    </button>

                    {/* Vacation button */}
                    <button
                      onClick={() => handleDailyStatusChange(
                        entry.employee_id,
                        entry.status === 'vacation' ? null : 'vacation'
                      )}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                        entry.status === 'vacation'
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Vacation
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Summary Footer */}
        {dailyEntries.length > 0 && (
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <div className="flex gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-gray-600">Worked: <strong>{summary.worked}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-gray-600">Sick: <strong>{summary.sick}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-gray-600">Vacation: <strong>{summary.vacation}</strong></span>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderMonthView = () => (
    <>
      {/* Employee Selector */}
      <div className="bg-white rounded-lg shadow p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Employee
        </label>
        <select
          value={selectedEmployee?.id || ''}
          onChange={(e) => {
            const employee = validEmployees.find(emp => emp.id === parseInt(e.target.value))
            onSelectEmployee(employee || null)
          }}
          className="block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">Choose an employee...</option>
          {validEmployees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.name} - {emp.position}
            </option>
          ))}
        </select>
      </div>

      {/* Vacation Balance Card */}
      {selectedEmployee && selectedEmployeeVacationBalance && (
        <div className="bg-white rounded-lg shadow p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Vacation Balance ({selectedEmployeeVacationBalance.year})
          </h4>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    selectedEmployeeVacationBalance.remaining <= 0
                      ? 'bg-red-500'
                      : selectedEmployeeVacationBalance.remaining <= 3
                      ? 'bg-yellow-500'
                      : 'bg-blue-500'
                  }`}
                  style={{ width: `${(selectedEmployeeVacationBalance.remaining / selectedEmployeeVacationBalance.allowance) * 100}%` }}
                />
              </div>
            </div>
            <div className="text-right">
              <div className={`text-lg font-semibold ${
                selectedEmployeeVacationBalance.remaining <= 0
                  ? 'text-red-600'
                  : selectedEmployeeVacationBalance.remaining <= 3
                  ? 'text-yellow-600'
                  : 'text-blue-600'
              }`}>
                {selectedEmployeeVacationBalance.remaining} remaining
              </div>
              <div className="text-sm text-gray-500">
                {selectedEmployeeVacationBalance.used} used of {selectedEmployeeVacationBalance.allowance}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Calendar */}
      <div className="bg-white rounded-lg shadow">
        {/* Calendar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h3 className="text-lg font-semibold text-gray-900">
              {MONTHS[month]} {year}
            </h3>
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Today
          </button>
        </div>

        {/* Day Names */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {dayNames.map((day) => (
            <div
              key={day}
              className="py-2 text-center text-sm font-medium text-gray-500 bg-gray-50"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading attendance...</div>
        ) : (
          <div className="grid grid-cols-7">{renderCalendarDays()}</div>
        )}
      </div>

      {/* Status Selection Modal */}
      {selectedDate && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Set Attendance for {selectedEmployee.name}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {new Date(selectedDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>

            <div className="space-y-2">
              {(Object.keys(STATUS_LABELS) as AttendanceStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => handleSetStatus(status)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors hover:bg-gray-50 ${
                    getAttendanceForDate(selectedDate)?.status === status
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full ${STATUS_COLORS[status]}`} />
                  <span className="font-medium">{STATUS_LABELS[status]}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setSelectedDate(null)}
              className="mt-4 w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  )

  return (
    <div className="space-y-4">
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between bg-white rounded-lg shadow p-4">
        <div className="flex gap-4">
          {(Object.keys(STATUS_LABELS) as AttendanceStatus[]).map((status) => (
            <div key={status} className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${STATUS_COLORS[status]}`} />
              <span className="text-sm text-gray-600">{STATUS_LABELS[status]}</span>
            </div>
          ))}
        </div>

        <div className="flex rounded-lg overflow-hidden border border-gray-300">
          <button
            onClick={() => setViewMode('month')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              viewMode === 'month'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setViewMode('daily')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              viewMode === 'daily'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Daily
          </button>
        </div>
      </div>

      {/* Render appropriate view */}
      {viewMode === 'daily' ? renderDailyView() : renderMonthView()}

      {/* Vacation Warning Modal */}
      {showVacationWarning && pendingVacationAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                Vacation Allowance Exhausted
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              <strong>{pendingVacationAction.employeeName}</strong> has used all 14 vacation days for this year.
              Do you still want to mark this day as vacation?
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleVacationWarningCancel}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={viewMode === 'month' ? handleMonthVacationWarningConfirm : handleVacationWarningConfirm}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Set Vacation Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
