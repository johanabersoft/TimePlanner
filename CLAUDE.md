# TimePlanner

Employee management and attendance tracking desktop application built with Electron, React, and TypeScript.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Desktop**: Electron 33
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL cloud database)
- **Build**: electron-builder

## Project Structure

```
TimePlanner/
├── electron/                 # Electron main process
│   ├── main.ts              # Main entry, window creation, IPC handlers
│   ├── preload.ts           # Exposes API to renderer via contextBridge
│   └── database/
│       ├── supabase.ts      # Supabase client initialization
│       └── queries.ts       # All database query functions
├── src/                      # React frontend (renderer process)
│   ├── App.tsx              # Main app with navigation
│   ├── components/
│   │   ├── AttendanceCalendar.tsx  # Month/Daily view attendance tracking
│   │   ├── EmployeeList.tsx        # Employee list display
│   │   ├── EmployeeForm.tsx        # Add/edit employee modal
│   │   ├── ReportSummary.tsx       # Attendance reports with smart defaults
│   │   ├── SalaryDisplay.tsx       # Salary overview
│   │   ├── IncomeSummary.tsx       # Income dashboard with totals
│   │   ├── ConsultantFeesDetail.tsx # Consultant contract management
│   │   ├── AdRevenueDetail.tsx     # Monthly ad revenue tracking
│   │   ├── IapRevenueDetail.tsx    # IAP revenue by platform
│   │   └── IncomeChart.tsx         # Income visualization chart
│   ├── hooks/
│   │   ├── useAttendance.ts        # Attendance data operations
│   │   ├── useEmployees.ts         # Employee CRUD operations
│   │   ├── useCurrency.ts          # Currency conversion
│   │   └── useIncome.ts            # Income data operations
│   ├── types/
│   │   └── index.ts                # TypeScript interfaces
│   └── utils/
│       ├── currency.ts             # Currency formatting/conversion
│       └── salary.ts               # Salary deduction calculations
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

### Salary Deductions
- Automatic salary adjustment for sick days
- Formula: `adjustedSalary = baseSalary × (workdays - sickDays) / workdays`
- Vacation days are NOT deducted (paid leave)
- All-employees monthly view shows deductions summary

### Income Tracking
Track multiple revenue streams with currency conversion:

1. **Consultant Fees**: Monthly retainer contracts
   - Company name, monthly fee, currency
   - Link employees to contracts
   - Active/inactive status

2. **Ad Revenue**: Monthly advertising income
   - Track by month/year
   - Notes field for details

3. **In-App Purchases**: Revenue by platform
   - iOS (App Store) and Android (Google Play)
   - Monthly tracking with platform breakdown
   - Summary cards show last month, 3 months, and yearly totals

## Database Schema

```sql
-- Employees table
CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  salary NUMERIC NOT NULL,
  currency TEXT NOT NULL,
  start_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance table
CREATE TABLE attendance (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id),
  date DATE NOT NULL,
  status TEXT NOT NULL,  -- 'worked', 'sick', 'vacation'
  notes TEXT,
  UNIQUE(employee_id, date)
);

-- Currency rates table
CREATE TABLE currency_rates (
  id SERIAL PRIMARY KEY,
  from_curr TEXT NOT NULL,
  to_curr TEXT NOT NULL,
  rate NUMERIC NOT NULL,
  updated TIMESTAMPTZ DEFAULT NOW()
);

-- Consultant contracts
CREATE TABLE consultant_contracts (
  id SERIAL PRIMARY KEY,
  company_name TEXT NOT NULL,
  monthly_fee NUMERIC NOT NULL,
  currency TEXT NOT NULL,
  start_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contract-employee relationship
CREATE TABLE contract_employees (
  contract_id INTEGER REFERENCES consultant_contracts(id) ON DELETE CASCADE,
  employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
  PRIMARY KEY (contract_id, employee_id)
);

-- Ad revenue
CREATE TABLE ad_revenue (
  id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(year, month)
);

-- In-app purchase revenue
CREATE TABLE iap_revenue (
  id SERIAL PRIMARY KEY,
  platform TEXT NOT NULL,  -- 'ios' or 'android'
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(platform, year, month)
);
```

Database is hosted on Supabase cloud (PostgreSQL). Requires internet connection.

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
- `window.electronAPI.income.*` - Income tracking (contracts, ads, IAP)

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

### Salary Deductions
- `calculateSalaryDeduction(baseSalary, report)` in `src/utils/salary.ts`
- Deducts proportionally for sick days only
- Vacation days remain paid

## Color Scheme

- **Primary**: Indigo (`#4f46e5` / `primary-600`)
- **Worked**: Green (`bg-green-500`)
- **Sick**: Yellow (`bg-yellow-500`)
- **Vacation**: Blue (`bg-blue-500`)

## Running the App

Desktop shortcut points to: `D:\Claude\TimePlanner\release\win-unpacked\TimePlanner.exe`

For development, use `npm run dev` which starts both Vite and Electron with hot reload.
