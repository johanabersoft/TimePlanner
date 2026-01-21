import { useState, useCallback } from 'react'
import {
  Attendance,
  AttendanceInput,
  AttendanceReport,
  AttendanceWithEmployee,
  DailyAttendanceEntry,
  SmartAttendanceReport,
  AttendanceStatus
} from '../types'

interface UseAttendanceReturn {
  attendance: Attendance[]
  loading: boolean
  error: string | null
  fetchByEmployee: (employeeId: number, month?: string) => Promise<void>
  fetchByDate: (date: string) => Promise<AttendanceWithEmployee[]>
  fetchAllEmployeesForDate: (date: string) => Promise<DailyAttendanceEntry[]>
  setAttendance: (input: AttendanceInput) => Promise<Attendance | null>
  bulkSetAttendance: (date: string, entries: Array<{ employee_id: number; status: AttendanceStatus | null }>) => Promise<boolean>
  deleteAttendance: (id: number) => Promise<boolean>
  deleteAttendanceByEmployeeAndDate: (employeeId: number, date: string) => Promise<boolean>
  getMonthlyReport: (employeeId: number, year: number, month: number) => Promise<AttendanceReport | null>
  getYearlyReport: (employeeId: number, year: number) => Promise<AttendanceReport | null>
  getSmartMonthlyReport: (employeeId: number, year: number, month: number) => Promise<SmartAttendanceReport | null>
  getSmartYearlyReport: (employeeId: number, year: number) => Promise<SmartAttendanceReport | null>
}

export function useAttendance(): UseAttendanceReturn {
  const [attendance, setAttendanceState] = useState<Attendance[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchByEmployee = useCallback(async (employeeId: number, month?: string) => {
    try {
      setLoading(true)
      setError(null)
      const data = await window.electronAPI.attendance.getByEmployee(employeeId, month)
      setAttendanceState(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch attendance')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchByDate = useCallback(async (date: string): Promise<AttendanceWithEmployee[]> => {
    try {
      setError(null)
      return await window.electronAPI.attendance.getByDate(date)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch attendance by date')
      return []
    }
  }, [])

  const fetchAllEmployeesForDate = useCallback(async (date: string): Promise<DailyAttendanceEntry[]> => {
    try {
      setError(null)
      return await window.electronAPI.attendance.getAllEmployeesForDate(date)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch employees for date')
      return []
    }
  }, [])

  const setAttendance = useCallback(async (input: AttendanceInput): Promise<Attendance | null> => {
    try {
      setError(null)
      const result = await window.electronAPI.attendance.set(input)
      setAttendanceState(prev => {
        const existing = prev.findIndex(
          a => a.employee_id === input.employee_id && a.date === input.date
        )
        if (existing >= 0) {
          const updated = [...prev]
          updated[existing] = result
          return updated
        }
        return [...prev, result]
      })
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set attendance')
      return null
    }
  }, [])

  const bulkSetAttendance = useCallback(async (
    date: string,
    entries: Array<{ employee_id: number; status: AttendanceStatus | null }>
  ): Promise<boolean> => {
    try {
      setError(null)
      await window.electronAPI.attendance.bulkSet(date, entries)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to bulk set attendance')
      return false
    }
  }, [])

  const deleteAttendance = useCallback(async (id: number): Promise<boolean> => {
    try {
      setError(null)
      const success = await window.electronAPI.attendance.delete(id)
      if (success) {
        setAttendanceState(prev => prev.filter(a => a.id !== id))
      }
      return success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete attendance')
      return false
    }
  }, [])

  const deleteAttendanceByEmployeeAndDate = useCallback(async (
    employeeId: number,
    date: string
  ): Promise<boolean> => {
    try {
      setError(null)
      return await window.electronAPI.attendance.deleteByEmployeeAndDate(employeeId, date)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete attendance')
      return false
    }
  }, [])

  const getMonthlyReport = useCallback(async (
    employeeId: number,
    year: number,
    month: number
  ): Promise<AttendanceReport | null> => {
    try {
      setError(null)
      return await window.electronAPI.attendance.getMonthlyReport(employeeId, year, month)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get monthly report')
      return null
    }
  }, [])

  const getYearlyReport = useCallback(async (
    employeeId: number,
    year: number
  ): Promise<AttendanceReport | null> => {
    try {
      setError(null)
      return await window.electronAPI.attendance.getYearlyReport(employeeId, year)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get yearly report')
      return null
    }
  }, [])

  const getSmartMonthlyReport = useCallback(async (
    employeeId: number,
    year: number,
    month: number
  ): Promise<SmartAttendanceReport | null> => {
    try {
      setError(null)
      return await window.electronAPI.attendance.getSmartMonthlyReport(employeeId, year, month)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get smart monthly report')
      return null
    }
  }, [])

  const getSmartYearlyReport = useCallback(async (
    employeeId: number,
    year: number
  ): Promise<SmartAttendanceReport | null> => {
    try {
      setError(null)
      return await window.electronAPI.attendance.getSmartYearlyReport(employeeId, year)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get smart yearly report')
      return null
    }
  }, [])

  return {
    attendance,
    loading,
    error,
    fetchByEmployee,
    fetchByDate,
    fetchAllEmployeesForDate,
    setAttendance,
    bulkSetAttendance,
    deleteAttendance,
    deleteAttendanceByEmployeeAndDate,
    getMonthlyReport,
    getYearlyReport,
    getSmartMonthlyReport,
    getSmartYearlyReport
  }
}
