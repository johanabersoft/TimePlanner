import { Database } from 'sql.js'

export function createTables(db: Database): void {
  // Create employees table
  db.run(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      position TEXT NOT NULL,
      salary REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      start_date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  // Create attendance table
  db.run(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('worked', 'sick', 'vacation')),
      notes TEXT,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
      UNIQUE(employee_id, date)
    )
  `)

  // Create currency_rates table
  db.run(`
    CREATE TABLE IF NOT EXISTS currency_rates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_curr TEXT NOT NULL,
      to_curr TEXT NOT NULL,
      rate REAL NOT NULL,
      updated TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(from_curr, to_curr)
    )
  `)

  // Create indexes for better query performance
  db.run(`CREATE INDEX IF NOT EXISTS idx_attendance_employee_id ON attendance(employee_id)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance(employee_id, date)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_currency_rates_pair ON currency_rates(from_curr, to_curr)`)
}

export function seedCurrencyRates(db: Database): void {
  // Check if rates already exist
  const result = db.exec('SELECT COUNT(*) as count FROM currency_rates')
  const count = result.length > 0 ? result[0].values[0][0] as number : 0

  if (count === 0) {
    // Seed with approximate default rates (USD as base)
    const defaultRates = [
      { from: 'USD', to: 'USD', rate: 1 },
      { from: 'USD', to: 'IDR', rate: 15500 },
      { from: 'USD', to: 'SEK', rate: 10.5 },
      { from: 'IDR', to: 'USD', rate: 1 / 15500 },
      { from: 'IDR', to: 'IDR', rate: 1 },
      { from: 'IDR', to: 'SEK', rate: 10.5 / 15500 },
      { from: 'SEK', to: 'USD', rate: 1 / 10.5 },
      { from: 'SEK', to: 'IDR', rate: 15500 / 10.5 },
      { from: 'SEK', to: 'SEK', rate: 1 }
    ]

    const stmt = db.prepare(`
      INSERT INTO currency_rates (from_curr, to_curr, rate)
      VALUES (?, ?, ?)
    `)

    for (const rate of defaultRates) {
      stmt.run([rate.from, rate.to, rate.rate])
    }

    stmt.free()
    console.log('Seeded default currency rates')
  }
}
