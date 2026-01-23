import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import * as queries from './database/queries'
import { testConnection } from './database/supabase'

// Handle EPIPE errors that occur when stdout/stderr aren't available in packaged app
process.on('uncaughtException', (error) => {
  if (error.message?.includes('EPIPE')) return
})

process.stdout?.on?.('error', () => {})
process.stderr?.on?.('error', () => {})

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    title: 'TimePlanner',
    icon: path.join(__dirname, '../public/icon.png')
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(async () => {
  // Test Supabase connection on startup
  try {
    const connected = await testConnection()
    if (!connected) {
      try { console.warn('Warning: Could not connect to Supabase. Check your internet connection.') } catch {}
    }
  } catch {
    // Silently ignore connection test failures
  }

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Employee IPC handlers
ipcMain.handle('employees:getAll', () => {
  return queries.getAllEmployees()
})

ipcMain.handle('employees:getById', (_, id: number) => {
  return queries.getEmployeeById(id)
})

ipcMain.handle('employees:create', (_, employee) => {
  return queries.createEmployee(employee)
})

ipcMain.handle('employees:update', (_, id: number, employee) => {
  return queries.updateEmployee(id, employee)
})

ipcMain.handle('employees:delete', (_, id: number) => {
  return queries.deleteEmployee(id)
})

// Attendance IPC handlers
ipcMain.handle('attendance:getByEmployee', (_, employeeId: number, month?: string) => {
  return queries.getAttendanceByEmployee(employeeId, month)
})

ipcMain.handle('attendance:getByDate', (_, date: string) => {
  return queries.getAttendanceByDate(date)
})

ipcMain.handle('attendance:getAllEmployeesForDate', (_, date: string) => {
  return queries.getAllEmployeesForDate(date)
})

ipcMain.handle('attendance:bulkSet', (_, date: string, entries: Array<{ employee_id: number; status: 'worked' | 'sick' | 'vacation' | null }>) => {
  return queries.bulkSetAttendance(date, entries)
})

ipcMain.handle('attendance:deleteByEmployeeAndDate', (_, employeeId: number, date: string) => {
  return queries.deleteAttendanceByEmployeeAndDate(employeeId, date)
})

ipcMain.handle('attendance:set', (_, attendance) => {
  return queries.setAttendance(attendance)
})

ipcMain.handle('attendance:delete', (_, id: number) => {
  return queries.deleteAttendance(id)
})

ipcMain.handle('attendance:getMonthlyReport', (_, employeeId: number, year: number, month: number) => {
  return queries.getMonthlyAttendanceReport(employeeId, year, month)
})

ipcMain.handle('attendance:getYearlyReport', (_, employeeId: number, year: number) => {
  return queries.getYearlyAttendanceReport(employeeId, year)
})

ipcMain.handle('attendance:getSmartMonthlyReport', (_, employeeId: number, year: number, month: number) => {
  return queries.getSmartMonthlyAttendanceReport(employeeId, year, month)
})

ipcMain.handle('attendance:getSmartYearlyReport', (_, employeeId: number, year: number) => {
  return queries.getSmartYearlyAttendanceReport(employeeId, year)
})

// Currency IPC handlers
ipcMain.handle('currency:getRates', () => {
  return queries.getCurrencyRates()
})

ipcMain.handle('currency:updateRates', (_, rates) => {
  return queries.updateCurrencyRates(rates)
})

ipcMain.handle('currency:fetchLatest', async () => {
  try {
    // Using ExchangeRate-API free tier
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
    const data = await response.json()

    const rates = [
      { from_curr: 'USD', to_curr: 'IDR', rate: data.rates.IDR },
      { from_curr: 'USD', to_curr: 'SEK', rate: data.rates.SEK },
      { from_curr: 'USD', to_curr: 'USD', rate: 1 },
      { from_curr: 'IDR', to_curr: 'USD', rate: 1 / data.rates.IDR },
      { from_curr: 'IDR', to_curr: 'SEK', rate: data.rates.SEK / data.rates.IDR },
      { from_curr: 'IDR', to_curr: 'IDR', rate: 1 },
      { from_curr: 'SEK', to_curr: 'USD', rate: 1 / data.rates.SEK },
      { from_curr: 'SEK', to_curr: 'IDR', rate: data.rates.IDR / data.rates.SEK },
      { from_curr: 'SEK', to_curr: 'SEK', rate: 1 }
    ]

    queries.updateCurrencyRates(rates)
    return { success: true, rates }
  } catch (error) {
    console.error('Failed to fetch currency rates:', error)
    return { success: false, error: 'Failed to fetch rates' }
  }
})
