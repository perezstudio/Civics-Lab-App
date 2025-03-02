// app/services/setup.client.ts
// This file provides utilities to initialize the client-side environment

import { initSupabaseClient, isClientInitialized } from './supabase.client'
import { setupAuthListener } from './auth.client'
import { toast } from 'sonner'

/**
 * Environment information from window
 */
export interface ClientEnv {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  [key: string]: string
}

let initialized = false

/**
 * Initialize all client-side services
 */
/**
 * Initialize all client-side services
 */
export function initializeClientServices() {
  if (initialized || typeof window === 'undefined') return

  console.log('Initializing client services...')
  
  try {
    // Get environment variables from window.__env
    const env = getClientEnv()
    
    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
      console.error('Missing required environment variables', env)
      
      // Show error toast only in non-development environments
      if (process.env.NODE_ENV !== 'development') {
        toast.error('Application configuration error. Please contact support.')
      }
      return
    }
    
    // Initialize Supabase client
    if (!isClientInitialized()) {
      const client = initSupabaseClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY)
      
      if (!client) {
        console.error('Failed to initialize Supabase client')
        return
      }
    }
    
    // Setup auth state listener for app-wide authentication updates
    const unsubscribe = setupAuthListener((user) => {
      // You can dispatch to a global state manager here if needed
      console.log('Auth state changed:', user ? 'User authenticated' : 'User signed out')
      
      // Update any cached user information
      if (user) {
        sessionStorage.setItem('user_id', user.id)
        sessionStorage.setItem('user_email', user.email || '')
      } else {
        sessionStorage.removeItem('user_id')
        sessionStorage.removeItem('user_email')
      }
    })
    
    // Register an unload handler to clean up subscriptions
    window.addEventListener('beforeunload', () => {
      unsubscribe?.();
    });
    
    initialized = true
    console.log('Client services initialized successfully')
  } catch (error) {
    console.error('Error initializing client services:', error)
    
    // Show error toast only in non-development environments
    if (process.env.NODE_ENV !== 'development') {
      toast.error('Failed to initialize application. Please refresh or try again later.')
    }
  }
}

/**
 * Get client environment variables
 */
export function getClientEnv(): ClientEnv {
  if (typeof window === 'undefined') {
    return { SUPABASE_URL: '', SUPABASE_ANON_KEY: '' }
  }
  
  // Check if environment variables are available in window.__env
  const env = (window as any).__env || {}
  
  return {
    SUPABASE_URL: env.SUPABASE_URL || '',
    SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY || '',
    ...env
  }
}

/**
 * Get a value from localStorage with error handling
 */
export function getLocalStorageItem(key: string, defaultValue: any = null): any {
  if (typeof window === 'undefined') return defaultValue
  
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : defaultValue
  } catch (error) {
    console.warn(`Error reading ${key} from localStorage:`, error)
    return defaultValue
  }
}

/**
 * Set a value in localStorage with error handling
 */
export function setLocalStorageItem(key: string, value: any): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    console.warn(`Error writing ${key} to localStorage:`, error)
    return false
  }
}

/**
 * Remove an item from localStorage with error handling
 */
export function removeLocalStorageItem(key: string): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    localStorage.removeItem(key)
    return true
  } catch (error) {
    console.warn(`Error removing ${key} from localStorage:`, error)
    return false
  }
}

/**
 * Check if the app is running in a browser
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

/**
 * Get selected workspace from localStorage
 */
export function getSelectedWorkspace(): string | null {
  return getLocalStorageItem('selectedWorkspace', null)
}

/**
 * Set selected workspace in localStorage
 */
export function setSelectedWorkspace(workspaceId: string): boolean {
  return setLocalStorageItem('selectedWorkspace', workspaceId)
}