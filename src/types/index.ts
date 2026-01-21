// Employee types
export interface Employee {
  id: number
  name: string
  position: string
  salary: number
  currency: Currency
  start_date: string
  created_at: string
}

export interface EmployeeInput {
  name: string
  position: string
  salary: number
  currency: Currency
  start_date: string
}

// Attendance types
export type AttendanceStatus = 'worked' | 'sick' | 'vacation'

export interface Attendance {
  id: number
  employee_id: number
  date: string
  status: AttendanceStatus
  notes: string | null
}

export interface AttendanceInput {
  employee_id: number
  date: string
  status: AttendanceStatus
  notes?: string
}

export interface AttendanceWithEmployee extends Attendance {
  employee_name: string
}

export interface AttendanceReport {
  worked: number
  sick: number
  vacation: number
  total: number
}

// Smart defaults report (calculates worked days based on workdays - exceptions)
export interface SmartAttendanceReport {
  workdays: number      // Total weekdays in period
  worked: number        // Calculated: workdays - sick - vacation
  sick: number          // Days explicitly marked sick
  vacation: number      // Days explicitly marked vacation
}

// Daily attendance view types
export interface DailyAttendanceEntry {
  employee_id: number
  employee_name: string
  position: string
  status: AttendanceStatus | null  // null means no explicit record (use smart default)
  attendance_id: number | null
}

export interface BulkAttendanceInput {
  date: string
  entries: Array<{
    employee_id: number
    status: AttendanceStatus | null  // null to clear/delete record
  }>
}

export type AttendanceViewMode = 'month' | 'daily'

// Currency types
export type Currency = 'IDR' | 'USD' | 'SEK'

export interface CurrencyRate {
  id: number
  from_curr: Currency
  to_curr: Currency
  rate: number
  updated: string
}

export interface CurrencyRateInput {
  from_curr: Currency
  to_curr: Currency
  rate: number
}

// Navigation types
export type View = 'employees' | 'attendance' | 'salaries' | 'reports'

// Electron API types
export interface ElectronAPI {
  employees: {
    getAll: () => Promise<Employee[]>
    getById: (id: number) => Promise<Employee | undefined>
    create: (employee: EmployeeInput) => Promise<Employee>
    update: (id: number, employee: Partial<EmployeeInput>) => Promise<Employee | undefined>
    delete: (id: number) => Promise<boolean>
  }
  attendance: {
    getByEmployee: (employeeId: number, month?: string) => Promise<Attendance[]>
    getByDate: (date: string) => Promise<AttendanceWithEmployee[]>
    getAllEmployeesForDate: (date: string) => Promise<DailyAttendanceEntry[]>
    set: (attendance: AttendanceInput) => Promise<Attendance>
    bulkSet: (date: string, entries: Array<{ employee_id: number; status: AttendanceStatus | null }>) => Promise<void>
    delete: (id: number) => Promise<boolean>
    deleteByEmployeeAndDate: (employeeId: number, date: string) => Promise<boolean>
    getMonthlyReport: (employeeId: number, year: number, month: number) => Promise<AttendanceReport>
    getYearlyReport: (employeeId: number, year: number) => Promise<AttendanceReport>
    getSmartMonthlyReport: (employeeId: number, year: number, month: number) => Promise<SmartAttendanceReport>
    getSmartYearlyReport: (employeeId: number, year: number) => Promise<SmartAttendanceReport>
  }
  currency: {
    getRates: () => Promise<CurrencyRate[]>
    updateRates: (rates: CurrencyRateInput[]) => Promise<void>
    fetchLatest: () => Promise<{ success: boolean; rates?: CurrencyRateInput[]; error?: string }>
  }
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
