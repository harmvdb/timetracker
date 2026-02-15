import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL en ANON KEY zijn verplicht. Check je .env bestand.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
