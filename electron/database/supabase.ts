import { createClient, SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://trrvorebilgudfqksenp.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRycnZvcmViaWxndWRmcWtzZW5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxMDA1MzksImV4cCI6MjA4NDY3NjUzOX0.01FNkbU51OB3E2dzKWGrB5fZyxXJ6aYbTe5Ltyke5tM'

let supabaseInstance: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  }
  return supabaseInstance
}

export async function testConnection(): Promise<boolean> {
  try {
    const supabase = getSupabase()
    const { error } = await supabase.from('employees').select('id').limit(1)
    return !error
  } catch {
    return false
  }
}
