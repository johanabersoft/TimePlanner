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
    query = query.like('date', `${month}%`).order('date')
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
  const monthStr = `${year}-${String(month).padStart(2, '0')}`

  const { data, error } = await supabase
    .from('attendance')
    .select('status')
    .eq('employee_id', employeeId)
    .like('date', `${monthStr}%`)

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

  const { data, error } = await supabase
    .from('attendance')
    .select('status')
    .eq('employee_id', employeeId)
    .like('date', `${year}%`)

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
  const monthStr = `${year}-${String(month).padStart(2, '0')}`

  const { data, error } = await supabase
    .from('attendance')
    .select('status')
    .eq('employee_id', employeeId)
    .like('date', `${monthStr}%`)
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

  const { data, error } = await supabase
    .from('attendance')
    .select('status')
    .eq('employee_id', employeeId)
    .like('date', `${year}%`)
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

export async function getCurrencyRate(from: string, to: string): Promise<number | undefined> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('currency_rates')
    .select('rate')
    .eq('from_curr', from)
    .eq('to_curr', to)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data?.rate
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
