import { useState } from 'react'
import { View, Employee, Currency } from './types'
import { useEmployees } from './hooks/useEmployees'
import { useCurrency } from './hooks/useCurrency'
import EmployeeList from './components/EmployeeList'
import EmployeeForm from './components/EmployeeForm'
import AttendanceCalendar from './components/AttendanceCalendar'
import SalaryDisplay from './components/SalaryDisplay'
import ReportPage from './components/reports/ReportPage'
import IncomeSummary from './components/IncomeSummary'

function App() {
  const [currentView, setCurrentView] = useState<View>('employees')
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [showEmployeeForm, setShowEmployeeForm] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)

  const {
    employees,
    loading: employeesLoading,
    error: employeesError,
    createEmployee,
    updateEmployee,
    deleteEmployee
  } = useEmployees()

  const {
    rates,
    displayCurrency,
    setDisplayCurrency,
    refreshRates,
    loading: currencyLoading,
    lastUpdated
  } = useCurrency()

  // Filter out any invalid employees at the top level
  const validEmployees = employees.filter((emp): emp is Employee => emp != null && emp.id != null)

  const handleAddEmployee = () => {
    setEditingEmployee(null)
    setShowEmployeeForm(true)
  }

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee)
    setShowEmployeeForm(true)
  }

  const handleSaveEmployee = async (data: Omit<Employee, 'id' | 'created_at'>) => {
    if (editingEmployee) {
      await updateEmployee(editingEmployee.id, data)
    } else {
      await createEmployee(data)
    }
    setShowEmployeeForm(false)
    setEditingEmployee(null)
  }

  const handleDeleteEmployee = async (id: number) => {
    if (confirm('Are you sure you want to delete this employee?')) {
      await deleteEmployee(id)
      if (selectedEmployee?.id === id) {
        setSelectedEmployee(null)
      }
    }
  }

  const handleSelectEmployee = (employee: Employee) => {
    setSelectedEmployee(employee)
  }

  const navItems: { view: View; label: string; icon: string }[] = [
    { view: 'employees', label: 'Employees', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z' },
    { view: 'attendance', label: 'Attendance', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { view: 'salaries', label: 'Salaries', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { view: 'reports', label: 'Reports', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { view: 'income', label: 'Income', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' }
  ]

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-primary-800 text-white">
        <div className="p-4 border-b border-primary-700">
          <h1 className="text-xl font-bold">TimePlanner</h1>
          <p className="text-sm text-primary-300">Employee Management</p>
        </div>

        <nav className="p-4">
          <ul className="space-y-2">
            {navItems.map(({ view, label, icon }) => (
              <li key={view}>
                <button
                  onClick={() => setCurrentView(view)}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                    currentView === view
                      ? 'bg-primary-600 text-white'
                      : 'text-primary-200 hover:bg-primary-700 hover:text-white'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                  </svg>
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Currency Selector */}
        <div className="absolute bottom-0 left-0 w-64 p-4 border-t border-primary-700">
          <label className="block text-sm text-primary-300 mb-2">Display Currency</label>
          <select
            value={displayCurrency}
            onChange={(e) => setDisplayCurrency(e.target.value as Currency)}
            className="w-full bg-primary-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="USD">USD ($)</option>
            <option value="IDR">IDR (Rp)</option>
            <option value="SEK">SEK (kr)</option>
          </select>
          <button
            onClick={refreshRates}
            disabled={currencyLoading}
            className="mt-2 w-full text-sm text-primary-300 hover:text-white disabled:opacity-50"
          >
            {currencyLoading ? 'Updating...' : 'Update rates'}
          </button>
          {lastUpdated && (
            <p className="mt-1 text-xs text-primary-400">
              Last updated: {new Date(lastUpdated).toLocaleDateString()}
            </p>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {employeesError && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {employeesError}
            </div>
          )}

          {currentView === 'employees' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Employees</h2>
                <button
                  onClick={handleAddEmployee}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Employee
                </button>
              </div>

              {employeesLoading ? (
                <div className="text-center py-8 text-gray-500">Loading employees...</div>
              ) : (
                <EmployeeList
                  employees={validEmployees}
                  selectedEmployee={selectedEmployee}
                  onSelect={handleSelectEmployee}
                  onEdit={handleEditEmployee}
                  onDelete={handleDeleteEmployee}
                  displayCurrency={displayCurrency}
                  rates={rates}
                />
              )}
            </div>
          )}

          {currentView === 'attendance' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Attendance</h2>
              {validEmployees.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No employees yet. Add employees first to track attendance.
                </div>
              ) : (
                <AttendanceCalendar
                  employees={validEmployees}
                  selectedEmployee={selectedEmployee}
                  onSelectEmployee={setSelectedEmployee}
                />
              )}
            </div>
          )}

          {currentView === 'salaries' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Salaries</h2>
              <SalaryDisplay
                employees={validEmployees}
                displayCurrency={displayCurrency}
                rates={rates}
              />
            </div>
          )}

          {currentView === 'reports' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Reports</h2>
              <ReportPage
                employees={validEmployees}
                selectedEmployee={selectedEmployee}
                onSelectEmployee={setSelectedEmployee}
                displayCurrency={displayCurrency}
                rates={rates}
              />
            </div>
          )}

          {currentView === 'income' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Income</h2>
              <IncomeSummary
                displayCurrency={displayCurrency}
                rates={rates}
                employees={validEmployees}
              />
            </div>
          )}
        </div>
      </main>

      {/* Employee Form Modal */}
      {showEmployeeForm && (
        <EmployeeForm
          employee={editingEmployee}
          onSave={handleSaveEmployee}
          onCancel={() => {
            setShowEmployeeForm(false)
            setEditingEmployee(null)
          }}
        />
      )}
    </div>
  )
}

export default App
