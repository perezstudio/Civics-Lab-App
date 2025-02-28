import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '~/types/supabase'

export function createSupabaseClient(
  supabaseUrl: string, 
  supabaseKey: string
) {
  // Validate inputs
  if (!supabaseUrl) {
    console.warn('Supabase URL is missing')
    return null
  }
  
  if (!supabaseKey) {
    console.warn('Supabase Anon Key is missing')
    return null
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseKey)
}