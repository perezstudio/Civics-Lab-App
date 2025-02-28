// app/services/auth.client.ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '~/types/supabase'
import type { User } from '@supabase/supabase-js'

// Client-side singleton instance
let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null
let initializationAttempted = false

// Initialize the Supabase client (called from root layout)
export const initSupabaseClient = (
  supabaseUrl: string,
  supabaseAnonKey: string
) => {
  // Only attempt initialization if we haven't already tried or client is null
  if (!initializationAttempted || !supabaseClient) {
    initializationAttempted = true
    
    if (supabaseUrl && supabaseAnonKey) {
      try {
        // Create the client only if we have valid credentials
        supabaseClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
          auth: {
            persistSession: true,
            storageKey: 'sb-auth-token',
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        })
        console.log('Supabase client initialized successfully')
      } catch (error) {
        console.error('Failed to initialize Supabase client:', error)
        supabaseClient = null
      }
    } else {
      console.warn('Unable to initialize Supabase client: missing URL or anon key')
    }
  }
  
  return supabaseClient
}

// Get the Supabase client (with auto-initialization)
export const getSupabaseClient = () => {
  if (!supabaseClient && typeof window !== 'undefined') {
    // Try to find the env values that might be in window
    const envFromWindow = (window as any).__env
    
    if (envFromWindow?.SUPABASE_URL && envFromWindow?.SUPABASE_ANON_KEY) {
      return initSupabaseClient(envFromWindow.SUPABASE_URL, envFromWindow.SUPABASE_ANON_KEY)
    }
    
    console.warn('Supabase client has not been initialized and env values not found')
  }
  return supabaseClient
}

// Check if the client is already initialized
export const isClientInitialized = () => {
  return !!supabaseClient
}

// Authentication functions
export const getUser = async (): Promise<User | null> => {
  const client = getSupabaseClient()
  if (!client) return null
  
  try {
    // Use getUser() instead of getSession() to avoid security warnings
    const { data, error } = await client.auth.getUser()
    
    if (error) {
      console.error('Error getting user:', error)
      return null
    }
    
    return data.user
  } catch (error) {
    console.error('Error in getUser:', error)
    return null
  }
}

export const isAuthenticated = async (): Promise<boolean> => {
  const user = await getUser()
  return !!user
}

export const signOut = async () => {
  const client = getSupabaseClient()
  if (!client) return { error: 'Client not initialized' }
  
  try {
    return await client.auth.signOut()
  } catch (error) {
    console.error('Error during sign out:', error)
    return { error: 'Failed to sign out' }
  }
}

// Data functions
export const fetchUserWorkspaces = async (userId: string) => {
  const client = getSupabaseClient()
  if (!client) return { data: null, error: 'Client not initialized' }
  
  try {
    return await client
      .from('workspaces')
      .select('*')
      .eq('created_by', userId)
  } catch (error) {
    console.error('Error fetching workspaces:', error)
    return { data: null, error: 'Failed to fetch workspaces' }
  }
}