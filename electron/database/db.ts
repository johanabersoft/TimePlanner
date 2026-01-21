import initSqlJs, { Database } from 'sql.js'
import path from 'path'
import fs from 'fs'
import { app } from 'electron'
import { createTables, seedCurrencyRates } from './schema'

let db: Database | null = null

export function getDbPath(): string {
  const userDataPath = app.getPath('userData')
  return path.join(userDataPath, 'timeplanner.db')
}

export async function initDatabase(): Promise<Database> {
  if (db) return db

  const SQL = await initSqlJs()
  const dbPath = getDbPath()
  console.log('Database path:', dbPath)

  try {
    // Try to load existing database
    if (fs.existsSync(dbPath)) {
      const buffer = fs.readFileSync(dbPath)
      db = new SQL.Database(buffer)
      console.log('Loaded existing database')
    } else {
      // Create new database
      db = new SQL.Database()
      console.log('Created new database')
    }
  } catch (error) {
    console.error('Error loading database, creating new one:', error)
    db = new SQL.Database()
  }

  createTables(db)
  seedCurrencyRates(db)
  saveDatabase()

  return db
}

export function getDb(): Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return db
}

export function saveDatabase(): void {
  if (db) {
    const data = db.export()
    const buffer = Buffer.from(data)
    const dbPath = getDbPath()

    // Ensure directory exists
    const dir = path.dirname(dbPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    fs.writeFileSync(dbPath, buffer)
    console.log('Database saved')
  }
}

export function closeDatabase(): void {
  if (db) {
    saveDatabase()
    db.close()
    db = null
  }
}
