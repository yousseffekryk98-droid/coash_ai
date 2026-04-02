import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const leakedServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (leakedServiceRoleKey) {
  throw new Error('Security misconfiguration: VITE_SUPABASE_SERVICE_ROLE_KEY must never be used in frontend code.')
}

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null
