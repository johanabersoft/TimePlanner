import { getSupabase } from './supabase'

// Types
interface Employee {
  id: number
  name: string
  position: string
  salary: number
  currency: string
  start_date: string
  created_at: string
}

interface Attendance {
  id: number
  employee_id: number
  date: string
  status: 'worked' | 'sick' | 'vacation'
  notes: string | null
}

interface CurrencyRate {
  id: number
  from_curr: string
  to_curr: string
  rate: number
  updated: string
}

interface AttendanceReport {
  worked: number
  sick: number
  vacation: number
  total: number
}

// Employee queries
export async function getAllEmployees(): Promise<Employee[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .order('name')

  if (error) throw error
  return data || []
}

export async function getEmployeeById(id: number): Promise<Employee | undefined> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', id)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data || undefined
}

export async function createEmployee(employee: Omit<Employee, 'id' | 'created_at'>): Promise<Employee> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('employees')
    .insert({
      name: employee.name,
      position: employee.position,
      salary: employee.salary,
      currency: employee.currency,
      start_date: employee.start_date
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateEmployee(
  id: number,
  employee: Partial<Omit<Employee, 'id' | 'created_at'>>
): Promise<Employee | undefined> {
  const supabase = getSupabase()

  const updateData: Record<string, unknown> = {}
  if (employee.name !== undefined) updateData.name = employee.name
  if (employee.position !== undefined) updateData.position = employee.position
  if (employee.salary !== undefined) updateData.salary = employee.salary
  if (employee.currency !== undefined) updateData.currency = employee.currency
  if (employee.start_date !== undefined) updateData.start_date = employee.start_date

  if (Object.keys(updateData).length === 0) {
    return getEmployeeById(id)
  }

  const { data, error } = await supabase
    .from('employees')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data || undefined
}

export async function deleteEmployee(id: number): Promise<boolean> {
  const supabase = getSupabase()
  const existing = await getEmployeeById(id)
  if (!existing) return false

  const { error } = await supabase
    .from('employees')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}

// Attendance queries
export async function getAttendanceByEmployee(employeeId: number, month?: string): Promise<Attendance[]> {
  const supabase = getSupabase()

  let query = supabase
    .from('attendance')
    .select('*')
    .eq('employee_id', employeeId)

  if (month) {
    // Use date range filter instead of LIKE for PostgreSQL DATE columns
    // month is expected in format 'YYYY-MM'
    const [year, mon] = month.split('-')
    const lastDay = new Date(parseInt(year), parseInt(mon), 0).getDate()
    const monthStart = `${month}-01`
    const monthEnd = `${month}-${String(lastDay).padStart(2, '0')}`
    query = query.gte('date', monthStart).lte('date', monthEnd).order('date')
  } else {
    query = query.order('date', { ascending: false })
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

export async function getAttendanceByDate(date: string): Promise<(Attendance & { employee_name: string })[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('attendance')
    .select(`
      *,
      employees!inner(name)
    `)
    .eq('date', date)
    .order('employees(name)')

  if (error) throw error

  return (data || []).map((row: { employees: { name: string } } & Attendance) => ({
    id: row.id,
    employee_id: row.employee_id,
    date: row.date,
    status: row.status,
    notes: row.notes,
    employee_name: row.employees.name
  }))
}

export async function setAttendance(attendance: Omit<Attendance, 'id'>): Promise<Attendance> {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('attendance')
    .upsert(
      {
        employee_id: attendance.employee_id,
        date: attendance.date,
        status: attendance.status,
        notes: attendance.notes || null
      },
      { onConflict: 'employee_id,date' }
    )
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteAttendance(id: number): Promise<boolean> {
  const supabase = getSupabase()

  const { data: existing } = await supabase
    .from('attendance')
    .select('id')
    .eq('id', id)
    .single()

  if (!existing) return false

  const { error } = await supabase
    .from('attendance')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}

export async function deleteAttendanceByEmployeeAndDate(employeeId: number, date: string): Promise<boolean> {
  const supabase = getSupabase()

  const { data: existing } = await supabase
    .from('attendance')
    .select('id')
    .eq('employee_id', employeeId)
    .eq('date', date)
    .single()

  if (!existing) return false

  const { error } = await supabase
    .from('attendance')
    .delete()
    .eq('employee_id', employeeId)
    .eq('date', date)

  if (error) throw error
  return true
}

// Get all employees with their attendance status for a specific date
export async function getAllEmployeesForDate(date: string): Promise<Array<{
  employee_id: number
  employee_name: string
  position: string
  status: 'worked' | 'sick' | 'vacation' | null
  attendance_id: number | null
}>> {
  const supabase = getSupabase()

  // Get all employees
  const { data: employees, error: empError } = await supabase
    .from('employees')
    .select('id, name, position')
    .order('name')

  if (empError) throw empError

  // Get attendance for the date
  const { data: attendance, error: attError } = await supabase
    .from('attendance')
    .select('id, employee_id, status')
    .eq('date', date)

  if (attError) throw attError

  const attendanceMap = new Map(
    (attendance || []).map((a: { id: number; employee_id: number; status: 'worked' | 'sick' | 'vacation' }) => [
      a.employee_id,
      { status: a.status, id: a.id }
    ])
  )

  return (employees || []).map((emp: { id: number; name: string; position: string }) => ({
    employee_id: emp.id,
    employee_name: emp.name,
    position: emp.position,
    status: attendanceMap.get(emp.id)?.status || null,
    attendance_id: attendanceMap.get(emp.id)?.id || null
  }))
}

// Bulk update attendance for multiple employees on a single date
export async function bulkSetAttendance(
  date: string,
  entries: Array<{ employee_id: number; status: 'worked' | 'sick' | 'vacation' | null }>
): Promise<void> {
  for (const entry of entries) {
    if (entry.status === null) {
      await deleteAttendanceByEmployeeAndDate(entry.employee_id, date)
    } else {
      await setAttendance({
        employee_id: entry.employee_id,
        date,
        status: entry.status,
        notes: null
      })
    }
  }
}

export async function getMonthlyAttendanceReport(
  employeeId: number,
  year: number,
  month: number
): Promise<AttendanceReport> {
  const supabase = getSupabase()
  // Use date range filter instead of LIKE for PostgreSQL DATE columns
  const lastDay = new Date(year, month, 0).getDate()
  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`
  const monthEnd = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  const { data, error } = await supabase
    .from('attendance')
    .select('status')
    .eq('employee_id', employeeId)
    .gte('date', monthStart)
    .lte('date', monthEnd)

  if (error) throw error

  const records = data || []
  const worked = records.filter((r: { status: string }) => r.status === 'worked').length
  const sick = records.filter((r: { status: string }) => r.status === 'sick').length
  const vacation = records.filter((r: { status: string }) => r.status === 'vacation').length

  return {
    worked,
    sick,
    vacation,
    total: records.length
  }
}

export async function getYearlyAttendanceReport(employeeId: number, year: number): Promise<AttendanceReport> {
  const supabase = getSupabase()
  // Use date range filter instead of LIKE for PostgreSQL DATE columns
  const yearStart = `${year}-01-01`
  const yearEnd = `${year}-12-31`

  const { data, error } = await supabase
    .from('attendance')
    .select('status')
    .eq('employee_id', employeeId)
    .gte('date', yearStart)
    .lte('date', yearEnd)

  if (error) throw error

  const records = data || []
  const worked = records.filter((r: { status: string }) => r.status === 'worked').length
  const sick = records.filter((r: { status: string }) => r.status === 'sick').length
  const vacation = records.filter((r: { status: string }) => r.status === 'vacation').length

  return {
    worked,
    sick,
    vacation,
    total: records.length
  }
}

// Helper function to count weekdays in a date range
function countWeekdays(startDate: Date, endDate: Date): number {
  let count = 0
  const current = new Date(startDate)

  while (current <= endDate) {
    const dayOfWeek = current.getDay()
    // 0 = Sunday, 6 = Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++
    }
    current.setDate(current.getDate() + 1)
  }

  return count
}

// Smart monthly report: calculates worked days as workdays - sick - vacation
export async function getSmartMonthlyAttendanceReport(
  employeeId: number,
  year: number,
  month: number
): Promise<{ workdays: number; worked: number; sick: number; vacation: number }> {
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0)

  const today = new Date()
  today.setHours(23, 59, 59, 999)
  const effectiveEndDate = endDate > today ? today : endDate

  if (startDate > today) {
    return { workdays: 0, worked: 0, sick: 0, vacation: 0 }
  }

  const workdays = countWeekdays(startDate, effectiveEndDate)

  const supabase = getSupabase()
  // Use date range filter instead of LIKE for PostgreSQL DATE columns
  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`
  const monthEnd = `${year}-${String(month).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`

  const { data, error } = await supabase
    .from('attendance')
    .select('status')
    .eq('employee_id', employeeId)
    .gte('date', monthStart)
    .lte('date', monthEnd)
    .in('status', ['sick', 'vacation'])

  if (error) throw error

  const records = data || []
  const sick = records.filter((r: { status: string }) => r.status === 'sick').length
  const vacation = records.filter((r: { status: string }) => r.status === 'vacation').length
  const worked = Math.max(0, workdays - sick - vacation)

  return { workdays, worked, sick, vacation }
}

// Smart yearly report: calculates worked days as workdays - sick - vacation
export async function getSmartYearlyAttendanceReport(
  employeeId: number,
  year: number
): Promise<{ workdays: number; worked: number; sick: number; vacation: number }> {
  const startDate = new Date(year, 0, 1)
  const endDate = new Date(year, 11, 31)

  const today = new Date()
  today.setHours(23, 59, 59, 999)
  const effectiveEndDate = endDate > today ? today : endDate

  if (startDate > today) {
    return { workdays: 0, worked: 0, sick: 0, vacation: 0 }
  }

  const workdays = countWeekdays(startDate, effectiveEndDate)

  const supabase = getSupabase()
  // Use date range filter instead of LIKE for PostgreSQL DATE columns
  const yearStart = `${year}-01-01`
  const yearEnd = `${year}-12-31`

  const { data, error } = await supabase
    .from('attendance')
    .select('status')
    .eq('employee_id', employeeId)
    .gte('date', yearStart)
    .lte('date', yearEnd)
    .in('status', ['sick', 'vacation'])

  if (error) throw error

  const records = data || []
  const sick = records.filter((r: { status: string }) => r.status === 'sick').length
  const vacation = records.filter((r: { status: string }) => r.status === 'vacation').length
  const worked = Math.max(0, workdays - sick - vacation)

  return { workdays, worked, sick, vacation }
}

// Currency queries
export async function getCurrencyRates(): Promise<CurrencyRate[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase.from('currency_rates').select('*')

  if (error) throw error
  return data || []
}

export async function updateCurrencyRates(
  rates: Array<{ from_curr: string; to_curr: string; rate: number }>
): Promise<void> {
  const supabase = getSupabase()

  for (const rate of rates) {
    const { error } = await supabase
      .from('currency_rates')
      .upsert(
        {
          from_curr: rate.from_curr,
          to_curr: rate.to_curr,
          rate: rate.rate,
          updated: new Date().toISOString()
        },
        { onConflict: 'from_curr,to_curr' }
      )

    if (error) throw error
  }
}

// ============================================
// Income Queries
// ============================================

interface ConsultantContract {
  id: number
  company_name: string
  monthly_fee: number
  currency: string
  start_date: string
  is_active: boolean
  vat_rate: number | null
  created_at: string
  employees?: Employee[]
}

interface AdRevenue {
  id: number
  year: number
  month: number
  amount: number
  currency: string
  notes: string | null
  created_at: string
}

interface IapRevenue {
  id: number
  platform: 'ios' | 'android'
  year: number
  month: number
  amount: number
  currency: string
  created_at: string
}

// Consultant Contract queries
export async function getConsultantContracts(): Promise<ConsultantContract[]> {
  const supabase = getSupabase()

  // Get contracts
  const { data: contracts, error } = await supabase
    .from('consultant_contracts')
    .select('*')
    .order('company_name')

  if (error) throw error

  // Get contract employees
  const { data: contractEmployees, error: ceError } = await supabase
    .from('contract_employees')
    .select(`
      contract_id,
      employee_id,
      employees (id, name, position, salary, currency, start_date, created_at)
    `)

  if (ceError) throw ceError

  // Map employees to contracts
  const contractMap = new Map<number, Employee[]>()
  for (const ce of contractEmployees || []) {
    const emp = ce.employees as unknown as Employee
    if (!contractMap.has(ce.contract_id)) {
      contractMap.set(ce.contract_id, [])
    }
    contractMap.get(ce.contract_id)!.push(emp)
  }

  return (contracts || []).map(c => ({
    ...c,
    employees: contractMap.get(c.id) || []
  }))
}

export async function getConsultantContract(id: number): Promise<ConsultantContract | undefined> {
  const supabase = getSupabase()

  const { data: contract, error } = await supabase
    .from('consultant_contracts')
    .select('*')
    .eq('id', id)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  if (!contract) return undefined

  // Get employees for this contract
  const { data: contractEmployees, error: ceError } = await supabase
    .from('contract_employees')
    .select(`
      employees (id, name, position, salary, currency, start_date, created_at)
    `)
    .eq('contract_id', id)

  if (ceError) throw ceError

  const employees = (contractEmployees || []).map(ce => ce.employees as unknown as Employee)

  return { ...contract, employees }
}

export async function createConsultantContract(
  contract: Omit<ConsultantContract, 'id' | 'created_at' | 'employees'> & { employee_ids?: number[] }
): Promise<ConsultantContract> {
  const supabase = getSupabase()

  const { employee_ids, ...contractData } = contract

  const { data, error } = await supabase
    .from('consultant_contracts')
    .insert({
      company_name: contractData.company_name,
      monthly_fee: contractData.monthly_fee,
      currency: contractData.currency,
      start_date: contractData.start_date,
      is_active: contractData.is_active ?? true,
      vat_rate: contractData.vat_rate ?? null
    })
    .select()
    .single()

  if (error) throw error

  // Add employee links
  if (employee_ids && employee_ids.length > 0) {
    const links = employee_ids.map(eid => ({ contract_id: data.id, employee_id: eid }))
    const { error: linkError } = await supabase
      .from('contract_employees')
      .insert(links)

    if (linkError) throw linkError
  }

  return getConsultantContract(data.id) as Promise<ConsultantContract>
}

export async function updateConsultantContract(
  id: number,
  contract: Partial<Omit<ConsultantContract, 'id' | 'created_at' | 'employees'> & { employee_ids?: number[] }>
): Promise<ConsultantContract | undefined> {
  const supabase = getSupabase()

  const { employee_ids, ...updateData } = contract

  if (Object.keys(updateData).length > 0) {
    const { error } = await supabase
      .from('consultant_contracts')
      .update(updateData)
      .eq('id', id)

    if (error) throw error
  }

  // Update employee links if provided
  if (employee_ids !== undefined) {
    // Delete existing links
    await supabase
      .from('contract_employees')
      .delete()
      .eq('contract_id', id)

    // Add new links
    if (employee_ids.length > 0) {
      const links = employee_ids.map(eid => ({ contract_id: id, employee_id: eid }))
      const { error: linkError } = await supabase
        .from('contract_employees')
        .insert(links)

      if (linkError) throw linkError
    }
  }

  return getConsultantContract(id)
}

export async function deleteConsultantContract(id: number): Promise<boolean> {
  const supabase = getSupabase()

  const existing = await getConsultantContract(id)
  if (!existing) return false

  const { error } = await supabase
    .from('consultant_contracts')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}

// Ad Revenue queries
export async function getAdRevenue(year?: number): Promise<AdRevenue[]> {
  const supabase = getSupabase()

  let query = supabase
    .from('ad_revenue')
    .select('*')
    .order('year', { ascending: false })
    .order('month', { ascending: false })

  if (year) {
    query = query.eq('year', year)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

export async function setAdRevenue(revenue: Omit<AdRevenue, 'id' | 'created_at'>): Promise<AdRevenue> {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('ad_revenue')
    .upsert(
      {
        year: revenue.year,
        month: revenue.month,
        amount: revenue.amount,
        currency: revenue.currency,
        notes: revenue.notes || null
      },
      { onConflict: 'year,month' }
    )
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteAdRevenue(id: number): Promise<boolean> {
  const supabase = getSupabase()

  const { data: existing } = await supabase
    .from('ad_revenue')
    .select('id')
    .eq('id', id)
    .single()

  if (!existing) return false

  const { error } = await supabase
    .from('ad_revenue')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}

// IAP Revenue queries
export async function getIapRevenue(year?: number): Promise<IapRevenue[]> {
  const supabase = getSupabase()

  let query = supabase
    .from('iap_revenue')
    .select('*')
    .order('year', { ascending: false })
    .order('month', { ascending: false })

  if (year) {
    query = query.eq('year', year)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

export async function setIapRevenue(revenue: Omit<IapRevenue, 'id' | 'created_at'>): Promise<IapRevenue> {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('iap_revenue')
    .upsert(
      {
        platform: revenue.platform,
        year: revenue.year,
        month: revenue.month,
        amount: revenue.amount,
        currency: revenue.currency
      },
      { onConflict: 'platform,year,month' }
    )
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteIapRevenue(id: number): Promise<boolean> {
  const supabase = getSupabase()

  const { data: existing } = await supabase
    .from('iap_revenue')
    .select('id')
    .eq('id', id)
    .single()

  if (!existing) return false

  const { error } = await supabase
    .from('iap_revenue')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}
