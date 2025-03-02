// app/services/auth.client.ts
import { createClient } from '@supabase/supabase-js'
import type { Session, User } from '@supabase/supabase-js'
import type { Database } from '~/types/supabase'

// Singleton Supabase client instance
let supabaseClient: ReturnType<typeof createClient<Database>> | null = null

// Auth state management
let currentUser: User | null = null
let isInitialized = false
let authChangeCallbacks: ((user: User | null) => void)[] = []

/**
 * Initialize the Supabase client
 */
export function initSupabase() {
  if (typeof window === 'undefined') return null
  
  // Get credentials from window object (set in root loader)
  const supabaseUrl = (window as any).__env?.SUPABASE_URL
  const supabaseKey = (window as any).__env?.SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials. Make sure environment variables are set.')
    return null
  }
  
  if (!supabaseClient) {
    console.log('Initializing Supabase client')
    
    supabaseClient = createClient<Database>(
      supabaseUrl,
      supabaseKey,
      {
        auth: {
          persistSession: true,
          storageKey: 'supabase-auth',
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      }
    )
    
    // Set up auth state listener
    supabaseClient.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email)
      currentUser = session?.user || null
      
      // Call all registered callbacks
      authChangeCallbacks.forEach(callback => callback(currentUser))
    })
    
    // Check for existing session
    supabaseClient.auth.getSession().then(({ data }) => {
      currentUser = data.session?.user || null
      isInitialized = true
      
      // Call all registered callbacks
      authChangeCallbacks.forEach(callback => callback(currentUser))
    })
  }
  
  return supabaseClient
}

/**
 * Get the Supabase client (initialize if needed)
 */
export function getClient() {
  if (!supabaseClient) {
    return initSupabase()
  }
  return supabaseClient
}

/**
 * Check if Supabase is initialized
 */
export function isSupabaseInitialized() {
  return isInitialized
}

/**
 * Get the current user
 */
export function getUser(): User | null {
  return currentUser
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!currentUser
}

/**
 * Register callback for auth state changes
 */
export function onAuthStateChange(callback: (user: User | null) => void): () => void {
  authChangeCallbacks.push(callback)
  
  // If already initialized, call with current state immediately
  if (isInitialized) {
    callback(currentUser)
  }
  
  // Return unsubscribe function
  return () => {
    authChangeCallbacks = authChangeCallbacks.filter(cb => cb !== callback)
  }
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string) {
  const client = getClient()
  if (!client) return { error: { message: 'Client not initialized' } }
  
  try {
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    
    currentUser = data.user
    return { data }
  } catch (error: any) {
    console.error('Sign in error:', error)
    return { error }
  }
}

/**
 * Sign up with email and password
 */
export async function signUp(email: string, password: string) {
  const client = getClient()
  if (!client) return { error: { message: 'Client not initialized' } }
  
  try {
    const { data, error } = await client.auth.signUp({
      email,
      password
    })
    
    if (error) throw error
    
    return { data }
  } catch (error: any) {
    console.error('Sign up error:', error)
    return { error }
  }
}

/**
 * Sign out current user
 */
export async function signOut() {
  const client = getClient()
  if (!client) return { error: { message: 'Client not initialized' } }
  
  try {
    const { error } = await client.auth.signOut()
    
    if (error) throw error
    
    currentUser = null
    return { success: true }
  } catch (error: any) {
    console.error('Sign out error:', error)
    return { error }
  }
}

/**
 * Reset password
 */
export async function resetPassword(email: string) {
  const client = getClient()
  if (!client) return { error: { message: 'Client not initialized' } }
  
  try {
    const { data, error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    
    if (error) throw error
    
    return { data }
  } catch (error: any) {
    console.error('Reset password error:', error)
    return { error }
  }
}

/**
 * Update user password
 */
export async function updatePassword(password: string) {
  const client = getClient()
  if (!client) return { error: { message: 'Client not initialized' } }
  
  try {
    const { data, error } = await client.auth.updateUser({
      password
    })
    
    if (error) throw error
    
    return { data }
  } catch (error: any) {
    console.error('Update password error:', error)
    return { error }
  }
}