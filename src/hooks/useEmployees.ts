import { useState, useEffect, useCallback } from 'react'
import { Employee, EmployeeInput } from '../types'

interface UseEmployeesReturn {
  employees: Employee[]
  loading: boolean
  error: string | null
  fetchEmployees: () => Promise<void>
  createEmployee: (employee: EmployeeInput) => Promise<Employee | null>
  updateEmployee: (id: number, employee: Partial<EmployeeInput>) => Promise<Employee | null>
  deleteEmployee: (id: number) => Promise<boolean>
}

export function useEmployees(): UseEmployeesReturn {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await window.electronAPI.employees.getAll()
      // Filter out any invalid data
      const validData = Array.isArray(data) ? data.filter(emp => emp && emp.id != null) : []
      setEmployees(validData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch employees')
      setEmployees([])
    } finally {
      setLoading(false)
    }
  }, [])

  const createEmployee = useCallback(async (employee: EmployeeInput): Promise<Employee | null> => {
    try {
      setError(null)
      const newEmployee = await window.electronAPI.employees.create(employee)
      if (newEmployee && newEmployee.id != null) {
        setEmployees(prev => [...prev, newEmployee])
        return newEmployee
      }
      // If creation didn't return a valid employee, refetch all
      await fetchEmployees()
      return null
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create employee')
      return null
    }
  }, [fetchEmployees])

  const updateEmployee = useCallback(async (id: number, employee: Partial<EmployeeInput>): Promise<Employee | null> => {
    try {
      setError(null)
      const updated = await window.electronAPI.employees.update(id, employee)
      if (updated) {
        setEmployees(prev => prev.map(e => e.id === id ? updated : e))
      }
      return updated || null
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update employee')
      return null
    }
  }, [])

  const deleteEmployee = useCallback(async (id: number): Promise<boolean> => {
    try {
      setError(null)
      const success = await window.electronAPI.employees.delete(id)
      if (success) {
        setEmployees(prev => prev.filter(e => e.id !== id))
      }
      return success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete employee')
      return false
    }
  }, [])

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  return {
    employees,
    loading,
    error,
    fetchEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee
  }
}
