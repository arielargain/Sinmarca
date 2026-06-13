import { createClient } from '@supabase/supabase-js'

// Configurar en Vercel Environment Variables:
//   VITE_SUPABASE_URL = https://XXXX.supabase.co
//   VITE_SUPABASE_ANON_KEY = eyJhbGci...
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('⚠️ VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY no configurados')
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '')
