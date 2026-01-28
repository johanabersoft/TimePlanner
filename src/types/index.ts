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

// Vacation balance tracking
export interface VacationBalance {
  allowance: number    // Always 14
  used: number         // Days taken this year
  remaining: number    // 14 - used
  year: number
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

// Cost types
export interface Cost {
  id: number
  name: string
  category: string
  amount: number
  currency: Currency
  year: number
  month: number
  is_recurring: boolean
  is_active: boolean
  notes: string | null
  created_at: string
}

export interface CostInput {
  name: string
  category: string
  amount: number
  currency: Currency
  year: number
  month: number
  is_recurring: boolean
  is_active?: boolean
  notes?: string
}

// Navigation types
export type View = 'employees' | 'attendance' | 'salaries' | 'reports' | 'income' | 'costs'

// Income types
export type Platform = 'ios' | 'android'

export interface ConsultantContract {
  id: number
  company_name: string
  monthly_fee: number
  currency: Currency
  start_date: string
  is_active: boolean
  vat_rate: number | null
  created_at: string
  employees?: Employee[]
}

export interface ConsultantContractInput {
  company_name: string
  monthly_fee: number
  currency: Currency
  start_date: string
  is_active?: boolean
  vat_rate?: number | null
  employee_ids?: number[]
}

export interface AdRevenue {
  id: number
  year: number
  month: number
  amount: number
  currency: Currency
  notes: string | null
  created_at: string
}

export interface AdRevenueInput {
  year: number
  month: number
  amount: number
  currency: Currency
  notes?: string
}

export interface IapRevenue {
  id: number
  platform: Platform
  year: number
  month: number
  amount: number
  currency: Currency
  created_at: string
}

export interface IapRevenueInput {
  platform: Platform
  year: number
  month: number
  amount: number
  currency: Currency
}

export interface IncomeSummary {
  consultantTotal: number
  adRevenueTotal: number
  iapTotal: number
  grandTotal: number
  currency: Currency
}

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
  income: {
    // Consultant contracts
    getContracts: () => Promise<ConsultantContract[]>
    getContract: (id: number) => Promise<ConsultantContract | undefined>
    createContract: (contract: ConsultantContractInput) => Promise<ConsultantContract>
    updateContract: (id: number, contract: Partial<ConsultantContractInput>) => Promise<ConsultantContract | undefined>
    deleteContract: (id: number) => Promise<boolean>
    // Ad revenue
    getAdRevenue: (year?: number) => Promise<AdRevenue[]>
    setAdRevenue: (revenue: AdRevenueInput) => Promise<AdRevenue>
    deleteAdRevenue: (id: number) => Promise<boolean>
    // IAP
    getIapRevenue: (year?: number) => Promise<IapRevenue[]>
    setIapRevenue: (revenue: IapRevenueInput) => Promise<IapRevenue>
    deleteIapRevenue: (id: number) => Promise<boolean>
  }
  costs: {
    getAll: () => Promise<Cost[]>
    getCategories: () => Promise<string[]>
    create: (cost: CostInput) => Promise<Cost>
    update: (id: number, cost: Partial<CostInput>) => Promise<Cost | undefined>
    delete: (id: number) => Promise<boolean>
  }
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
