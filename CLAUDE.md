# TimePlanner

Employee management and attendance tracking desktop application built with Electron, React, and TypeScript.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Desktop**: Electron 33
- **Styling**: Tailwind CSS
- **Database**: SQLite (via sql.js, persisted to user's AppData)
- **Build**: electron-builder

## Project Structure

```
TimePlanner/
├── electron/                 # Electron main process
│   ├── main.ts              # Main entry, window creation, IPC handlers
│   ├── preload.ts           # Exposes API to renderer via contextBridge
│   └── database/
│       ├── db.ts            # SQLite initialization and persistence
│       └── queries.ts       # All database query functions
├── src/                      # React frontend (renderer process)
│   ├── App.tsx              # Main app with navigation
│   ├── components/
│   │   ├── AttendanceCalendar.tsx  # Month/Daily view attendance tracking
│   │   ├── EmployeeList.tsx        # Employee list display
│   │   ├── EmployeeForm.tsx        # Add/edit employee modal
│   │   ├── ReportSummary.tsx       # Attendance reports with smart defaults
│   │   └── SalaryDisplay.tsx       # Salary overview
│   ├── hooks/
│   │   ├── useAttendance.ts        # Attendance data operations
│   │   ├── useEmployees.ts         # Employee CRUD operations
│   │   └── useCurrency.ts          # Currency conversion
│   ├── types/
│   │   └── index.ts                # TypeScript interfaces
│   └── utils/
│       └── currency.ts             # Currency formatting/conversion
├── public/
│   ├── icon.ico             # App icon (multi-size)
│   ├── icon.png             # PNG icon for Electron
│   └── icon.svg             # Source SVG icon
└── release/                  # Built application output
    └── win-unpacked/        # Unpacked Windows build
```

## Key Features

### Employee Management
- Add, edit, delete employees
- Track name, position, salary, currency, start date
- Multi-currency support (USD, IDR, SEK) with live conversion

### Attendance Tracking
Two view modes available:

1. **Month View**: Calendar showing one employee's attendance for a month
   - Click any day to set status (Worked/Sick/Vacation)
   - Visual indicators for each status type

2. **Daily View** (recommended for 15+ employees):
   - Shows ALL employees for a single date
   - Inline status buttons for quick entry
   - Navigate between days with arrows
   - Daily summary footer

### Smart Workday Defaults
- **Weekdays (Mon-Fri)**: Automatically count as "Worked" unless marked otherwise
- **Weekends (Sat-Sun)**: No default status
- Only exceptions (sick/vacation) need to be stored in database
- Reports calculate: `worked = workdays - sick - vacation`

### Reports
- Monthly and yearly attendance summaries
- Smart calculation based on weekdays only
- Visual progress bars showing worked/sick/vacation breakdown

## Database Schema

```sql
-- Employees table
CREATE TABLE employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  salary REAL NOT NULL,
  currency TEXT NOT NULL,
  start_date TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Attendance table
CREATE TABLE attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  status TEXT NOT NULL,  -- 'worked', 'sick', 'vacation'
  notes TEXT,
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  UNIQUE(employee_id, date)
);

-- Currency rates table
CREATE TABLE currency_rates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_curr TEXT NOT NULL,
  to_curr TEXT NOT NULL,
  rate REAL NOT NULL,
  updated TEXT DEFAULT CURRENT_TIMESTAMP
);
```

Database is stored at: `%APPDATA%/timeplanner/timeplanner.db`

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (Vite + Electron)
npm run dev

# Type check
npx tsc --noEmit

# Build for production
npm run build

# Build only frontend (skip electron-builder packaging)
npx tsc && npx vite build
```

## IPC Communication

The app uses Electron's IPC for renderer-to-main communication:

- `window.electronAPI.employees.*` - Employee CRUD
- `window.electronAPI.attendance.*` - Attendance operations
- `window.electronAPI.currency.*` - Currency rates

All API methods are typed in `src/types/index.ts` under `ElectronAPI`.

## Key Implementation Details

### Attendance Status Types
```typescript
type AttendanceStatus = 'worked' | 'sick' | 'vacation'
```

### Smart Reports
The `getSmartMonthlyReport` and `getSmartYearlyReport` functions:
1. Count weekdays in the period (excluding future dates)
2. Query database for sick/vacation days only
3. Calculate: `worked = weekdays - sick - vacation`

### Daily View Performance
- `getAllEmployeesForDate(date)` - Single query with LEFT JOIN
- Returns all employees with their status (null if no record)
- UI interprets null + weekday as "Worked" (smart default)

## Color Scheme

- **Primary**: Indigo (`#4f46e5` / `primary-600`)
- **Worked**: Green (`bg-green-500`)
- **Sick**: Yellow (`bg-yellow-500`)
- **Vacation**: Blue (`bg-blue-500`)

## Running the App

Desktop shortcut points to: `D:\Claude\TimePlanner\release\win-unpacked\TimePlanner.exe`

For development, use `npm run dev` which starts both Vite and Electron with hot reload.
