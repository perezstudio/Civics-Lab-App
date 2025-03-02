// app/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { useNavigate, useLocation } from '@remix-run/react'
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '~/types/supabase'

// Type for the auth context value
interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<{ error?: { message: string } }>
  signOut: () => Promise<void>
  supabase: ReturnType<typeof createBrowserClient<Database>> | null
}

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Context provider props
interface AuthProviderProps {
  children: ReactNode
  serverAccessToken?: string
}

// Auth provider component
export function AuthProvider({ children, serverAccessToken }: AuthProviderProps) {
  const [supabaseClient, setSupabaseClient] = useState<ReturnType<typeof createBrowserClient<Database>> | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()
  
  // Initialize Supabase client
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    try {
      // Get environment variables from window.__env
      const env = (window as any).__env || {}
      
      if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
        console.error('Missing Supabase credentials')
        setIsLoading(false)
        return
      }
      
      console.log('Initializing Supabase client')
      
      const client = createBrowserClient<Database>(
        env.SUPABASE_URL,
        env.SUPABASE_ANON_KEY,
        {
          auth: {
            persistSession: true,
            storageKey: 'sb-auth-token',
          }
        }
      )
      
      setSupabaseClient(client)
      
      // Subscribe to auth state changes
      const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event)
        setUser(session?.user ?? null)
        setIsLoading(false)
      })
      
      // Initial session check
      client.auth.getSession().then(({ data, error }) => {
        if (error) {
          console.error('Error checking session:', error)
        }
        
        setUser(data.session?.user ?? null)
        setIsLoading(false)
      })
      
      return () => {
        subscription.unsubscribe()
      }
    } catch (error) {
      console.error('Error initializing Supabase client:', error)
      setIsLoading(false)
    }
  }, [])
  
  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    if (!supabaseClient) return { error: { message: 'Client not initialized' } }
    
    try {
      setIsLoading(true)
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) throw error
      
      setUser(data.user)
      return { data }
    } catch (error: any) {
      console.error('Sign in error:', error)
      return { error }
    } finally {
      setIsLoading(false)
    }
  }
  
  // Sign out
  const signOut = async () => {
    if (!supabaseClient) return
    
    try {
      setIsLoading(true)
      await supabaseClient.auth.signOut()
      setUser(null)
      navigate('/login')
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Context value
  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signOut,
    supabase: supabaseClient
  }
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook for using the auth context
export function useAuth() {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}

// Route guard component for protected routes
interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login')
    }
  }, [isAuthenticated, isLoading, navigate])
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }
  
  if (!isAuthenticated) {
    return null // Will be redirected in the useEffect
  }
  
  return <>{children}</>
}