import { getDb, saveDatabase } from './db'

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

// Helper function to convert result array to object
function rowToObject<T>(columns: string[], values: unknown[]): T {
  const obj: Record<string, unknown> = {}
  columns.forEach((col, i) => {
    obj[col] = values[i]
  })
  return obj as T
}

function queryAll<T>(sql: string, params: unknown[] = []): T[] {
  const db = getDb()
  const stmt = db.prepare(sql)
  if (params.length > 0) {
    stmt.bind(params)
  }

  const results: T[] = []
  while (stmt.step()) {
    const row = stmt.getAsObject()
    results.push(row as T)
  }
  stmt.free()
  return results
}

function queryOne<T>(sql: string, params: unknown[] = []): T | undefined {
  const results = queryAll<T>(sql, params)
  return results[0]
}

function runQuery(sql: string, params: unknown[] = []): void {
  const db = getDb()
  db.run(sql, params)
  saveDatabase()
}

function getLastInsertRowId(): number {
  const db = getDb()
  const result = db.exec('SELECT last_insert_rowid() as id')
  return result[0]?.values[0][0] as number
}

// Employee queries
export function getAllEmployees(): Employee[] {
  return queryAll<Employee>('SELECT * FROM employees ORDER BY name')
}

export function getEmployeeById(id: number): Employee | undefined {
  return queryOne<Employee>('SELECT * FROM employees WHERE id = ?', [id])
}

export function createEmployee(employee: Omit<Employee, 'id' | 'created_at'>): Employee {
  const db = getDb()
  db.run(
    `INSERT INTO employees (name, position, salary, currency, start_date)
     VALUES (?, ?, ?, ?, ?)`,
    [employee.name, employee.position, employee.salary, employee.currency, employee.start_date]
  )
  const id = getLastInsertRowId()
  saveDatabase()
  const created = getEmployeeById(id)
  if (!created) {
    throw new Error('Failed to create employee')
  }
  return created
}

export function updateEmployee(id: number, employee: Partial<Omit<Employee, 'id' | 'created_at'>>): Employee | undefined {
  const fields: string[] = []
  const values: unknown[] = []

  if (employee.name !== undefined) {
    fields.push('name = ?')
    values.push(employee.name)
  }
  if (employee.position !== undefined) {
    fields.push('position = ?')
    values.push(employee.position)
  }
  if (employee.salary !== undefined) {
    fields.push('salary = ?')
    values.push(employee.salary)
  }
  if (employee.currency !== undefined) {
    fields.push('currency = ?')
    values.push(employee.currency)
  }
  if (employee.start_date !== undefined) {
    fields.push('start_date = ?')
    values.push(employee.start_date)
  }

  if (fields.length === 0) return getEmployeeById(id)

  values.push(id)
  runQuery(`UPDATE employees SET ${fields.join(', ')} WHERE id = ?`, values)

  return getEmployeeById(id)
}

export function deleteEmployee(id: number): boolean {
  const before = getEmployeeById(id)
  if (!before) return false

  runQuery('DELETE FROM employees WHERE id = ?', [id])
  return true
}

// Attendance queries
export function getAttendanceByEmployee(employeeId: number, month?: string): Attendance[] {
  if (month) {
    return queryAll<Attendance>(
      `SELECT * FROM attendance WHERE employee_id = ? AND date LIKE ? ORDER BY date`,
      [employeeId, `${month}%`]
    )
  }

  return queryAll<Attendance>(
    `SELECT * FROM attendance WHERE employee_id = ? ORDER BY date DESC`,
    [employeeId]
  )
}

export function getAttendanceByDate(date: string): (Attendance & { employee_name: string })[] {
  return queryAll<Attendance & { employee_name: string }>(
    `SELECT a.*, e.name as employee_name
     FROM attendance a
     JOIN employees e ON a.employee_id = e.id
     WHERE a.date = ?
     ORDER BY e.name`,
    [date]
  )
}

export function setAttendance(attendance: Omit<Attendance, 'id'>): Attendance {
  // Check if record exists
  const existing = queryOne<Attendance>(
    `SELECT * FROM attendance WHERE employee_id = ? AND date = ?`,
    [attendance.employee_id, attendance.date]
  )

  if (existing) {
    runQuery(
      `UPDATE attendance SET status = ?, notes = ? WHERE employee_id = ? AND date = ?`,
      [attendance.status, attendance.notes || null, attendance.employee_id, attendance.date]
    )
  } else {
    runQuery(
      `INSERT INTO attendance (employee_id, date, status, notes)
       VALUES (?, ?, ?, ?)`,
      [attendance.employee_id, attendance.date, attendance.status, attendance.notes || null]
    )
  }

  return queryOne<Attendance>(
    `SELECT * FROM attendance WHERE employee_id = ? AND date = ?`,
    [attendance.employee_id, attendance.date]
  )!
}

export function deleteAttendance(id: number): boolean {
  const before = queryOne<Attendance>('SELECT * FROM attendance WHERE id = ?', [id])
  if (!before) return false

  runQuery('DELETE FROM attendance WHERE id = ?', [id])
  return true
}

export function deleteAttendanceByEmployeeAndDate(employeeId: number, date: string): boolean {
  const before = queryOne<Attendance>(
    'SELECT * FROM attendance WHERE employee_id = ? AND date = ?',
    [employeeId, date]
  )
  if (!before) return false

  runQuery('DELETE FROM attendance WHERE employee_id = ? AND date = ?', [employeeId, date])
  return true
}

// Get all employees with their attendance status for a specific date
export function getAllEmployeesForDate(date: string): Array<{
  employee_id: number
  employee_name: string
  position: string
  status: 'worked' | 'sick' | 'vacation' | null
  attendance_id: number | null
}> {
  return queryAll<{
    employee_id: number
    employee_name: string
    position: string
    status: 'worked' | 'sick' | 'vacation' | null
    attendance_id: number | null
  }>(
    `SELECT
      e.id as employee_id,
      e.name as employee_name,
      e.position,
      a.status,
      a.id as attendance_id
    FROM employees e
    LEFT JOIN attendance a ON e.id = a.employee_id AND a.date = ?
    ORDER BY e.name`,
    [date]
  )
}

// Bulk update attendance for multiple employees on a single date
export function bulkSetAttendance(
  date: string,
  entries: Array<{ employee_id: number; status: 'worked' | 'sick' | 'vacation' | null }>
): void {
  for (const entry of entries) {
    if (entry.status === null) {
      // Delete the record if status is null (clearing the entry)
      deleteAttendanceByEmployeeAndDate(entry.employee_id, date)
    } else {
      // Set or update the attendance
      setAttendance({
        employee_id: entry.employee_id,
        date,
        status: entry.status,
        notes: null
      })
    }
  }
}

export function getMonthlyAttendanceReport(employeeId: number, year: number, month: number): AttendanceReport {
  const monthStr = `${year}-${String(month).padStart(2, '0')}`

  const result = queryOne<{
    worked: number | null
    sick: number | null
    vacation: number | null
    total: number | null
  }>(
    `SELECT
      SUM(CASE WHEN status = 'worked' THEN 1 ELSE 0 END) as worked,
      SUM(CASE WHEN status = 'sick' THEN 1 ELSE 0 END) as sick,
      SUM(CASE WHEN status = 'vacation' THEN 1 ELSE 0 END) as vacation,
      COUNT(*) as total
    FROM attendance
    WHERE employee_id = ? AND date LIKE ?`,
    [employeeId, `${monthStr}%`]
  )

  return {
    worked: result?.worked || 0,
    sick: result?.sick || 0,
    vacation: result?.vacation || 0,
    total: result?.total || 0
  }
}

export function getYearlyAttendanceReport(employeeId: number, year: number): AttendanceReport {
  const result = queryOne<{
    worked: number | null
    sick: number | null
    vacation: number | null
    total: number | null
  }>(
    `SELECT
      SUM(CASE WHEN status = 'worked' THEN 1 ELSE 0 END) as worked,
      SUM(CASE WHEN status = 'sick' THEN 1 ELSE 0 END) as sick,
      SUM(CASE WHEN status = 'vacation' THEN 1 ELSE 0 END) as vacation,
      COUNT(*) as total
    FROM attendance
    WHERE employee_id = ? AND date LIKE ?`,
    [employeeId, `${year}%`]
  )

  return {
    worked: result?.worked || 0,
    sick: result?.sick || 0,
    vacation: result?.vacation || 0,
    total: result?.total || 0
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
export function getSmartMonthlyAttendanceReport(
  employeeId: number,
  year: number,
  month: number
): { workdays: number; worked: number; sick: number; vacation: number } {
  // Calculate workdays in the month (weekdays only)
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0) // Last day of month

  // Don't count future dates
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  const effectiveEndDate = endDate > today ? today : endDate

  // If the entire month is in the future, return zeros
  if (startDate > today) {
    return { workdays: 0, worked: 0, sick: 0, vacation: 0 }
  }

  const workdays = countWeekdays(startDate, effectiveEndDate)

  // Get sick and vacation days from database
  const monthStr = `${year}-${String(month).padStart(2, '0')}`
  const result = queryOne<{
    sick: number | null
    vacation: number | null
  }>(
    `SELECT
      SUM(CASE WHEN status = 'sick' THEN 1 ELSE 0 END) as sick,
      SUM(CASE WHEN status = 'vacation' THEN 1 ELSE 0 END) as vacation
    FROM attendance
    WHERE employee_id = ? AND date LIKE ?`,
    [employeeId, `${monthStr}%`]
  )

  const sick = result?.sick || 0
  const vacation = result?.vacation || 0
  const worked = Math.max(0, workdays - sick - vacation)

  return { workdays, worked, sick, vacation }
}

// Smart yearly report: calculates worked days as workdays - sick - vacation
export function getSmartYearlyAttendanceReport(
  employeeId: number,
  year: number
): { workdays: number; worked: number; sick: number; vacation: number } {
  // Calculate workdays in the year (weekdays only)
  const startDate = new Date(year, 0, 1)
  const endDate = new Date(year, 11, 31)

  // Don't count future dates
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  const effectiveEndDate = endDate > today ? today : endDate

  // If the entire year is in the future, return zeros
  if (startDate > today) {
    return { workdays: 0, worked: 0, sick: 0, vacation: 0 }
  }

  const workdays = countWeekdays(startDate, effectiveEndDate)

  // Get sick and vacation days from database
  const result = queryOne<{
    sick: number | null
    vacation: number | null
  }>(
    `SELECT
      SUM(CASE WHEN status = 'sick' THEN 1 ELSE 0 END) as sick,
      SUM(CASE WHEN status = 'vacation' THEN 1 ELSE 0 END) as vacation
    FROM attendance
    WHERE employee_id = ? AND date LIKE ?`,
    [employeeId, `${year}%`]
  )

  const sick = result?.sick || 0
  const vacation = result?.vacation || 0
  const worked = Math.max(0, workdays - sick - vacation)

  return { workdays, worked, sick, vacation }
}

// Currency queries
export function getCurrencyRates(): CurrencyRate[] {
  return queryAll<CurrencyRate>('SELECT * FROM currency_rates')
}

export function getCurrencyRate(from: string, to: string): number | undefined {
  const result = queryOne<{ rate: number }>(
    `SELECT rate FROM currency_rates WHERE from_curr = ? AND to_curr = ?`,
    [from, to]
  )
  return result?.rate
}

export function updateCurrencyRates(rates: Array<{ from_curr: string; to_curr: string; rate: number }>): void {
  const db = getDb()

  for (const rate of rates) {
    // Check if exists
    const existing = queryOne<CurrencyRate>(
      `SELECT * FROM currency_rates WHERE from_curr = ? AND to_curr = ?`,
      [rate.from_curr, rate.to_curr]
    )

    if (existing) {
      db.run(
        `UPDATE currency_rates SET rate = ?, updated = datetime('now') WHERE from_curr = ? AND to_curr = ?`,
        [rate.rate, rate.from_curr, rate.to_curr]
      )
    } else {
      db.run(
        `INSERT INTO currency_rates (from_curr, to_curr, rate) VALUES (?, ?, ?)`,
        [rate.from_curr, rate.to_curr, rate.rate]
      )
    }
  }

  saveDatabase()
}
