import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Employee operations
  employees: {
    getAll: () => ipcRenderer.invoke('employees:getAll'),
    getById: (id: number) => ipcRenderer.invoke('employees:getById', id),
    create: (employee: {
      name: string
      position: string
      salary: number
      currency: string
      start_date: string
    }) => ipcRenderer.invoke('employees:create', employee),
    update: (id: number, employee: {
      name?: string
      position?: string
      salary?: number
      currency?: string
      start_date?: string
    }) => ipcRenderer.invoke('employees:update', id, employee),
    delete: (id: number) => ipcRenderer.invoke('employees:delete', id)
  },

  // Attendance operations
  attendance: {
    getByEmployee: (employeeId: number, month?: string) =>
      ipcRenderer.invoke('attendance:getByEmployee', employeeId, month),
    getByDate: (date: string) => ipcRenderer.invoke('attendance:getByDate', date),
    getAllEmployeesForDate: (date: string) =>
      ipcRenderer.invoke('attendance:getAllEmployeesForDate', date),
    set: (attendance: {
      employee_id: number
      date: string
      status: 'worked' | 'sick' | 'vacation'
      notes?: string
    }) => ipcRenderer.invoke('attendance:set', attendance),
    bulkSet: (date: string, entries: Array<{ employee_id: number; status: 'worked' | 'sick' | 'vacation' | null }>) =>
      ipcRenderer.invoke('attendance:bulkSet', date, entries),
    delete: (id: number) => ipcRenderer.invoke('attendance:delete', id),
    deleteByEmployeeAndDate: (employeeId: number, date: string) =>
      ipcRenderer.invoke('attendance:deleteByEmployeeAndDate', employeeId, date),
    getMonthlyReport: (employeeId: number, year: number, month: number) =>
      ipcRenderer.invoke('attendance:getMonthlyReport', employeeId, year, month),
    getYearlyReport: (employeeId: number, year: number) =>
      ipcRenderer.invoke('attendance:getYearlyReport', employeeId, year),
    getSmartMonthlyReport: (employeeId: number, year: number, month: number) =>
      ipcRenderer.invoke('attendance:getSmartMonthlyReport', employeeId, year, month),
    getSmartYearlyReport: (employeeId: number, year: number) =>
      ipcRenderer.invoke('attendance:getSmartYearlyReport', employeeId, year)
  },

  // Currency operations
  currency: {
    getRates: () => ipcRenderer.invoke('currency:getRates'),
    updateRates: (rates: Array<{
      from_curr: string
      to_curr: string
      rate: number
    }>) => ipcRenderer.invoke('currency:updateRates', rates),
    fetchLatest: () => ipcRenderer.invoke('currency:fetchLatest')
  }
})
