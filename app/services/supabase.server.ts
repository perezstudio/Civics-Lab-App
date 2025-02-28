import { createServerClient } from '@supabase/ssr'
import { createCookieSessionStorage, redirect } from '@remix-run/node'
import type { Database } from '~/types/supabase'

// Environment variable validation with proper error handling
const getSupabaseEnv = () => {
  const SUPABASE_URL = process.env.SUPABASE_URL
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY

  // Check if environment variables are set
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    const missingVars = []
    if (!SUPABASE_URL) missingVars.push('SUPABASE_URL')
    if (!SUPABASE_ANON_KEY) missingVars.push('SUPABASE_ANON_KEY')
    
    console.error(`❌ Missing environment variables: ${missingVars.join(', ')}`)
    throw new Error(`Required environment variables (${missingVars.join(', ')}) are not set. Check your .env file.`)
  }

  return { SUPABASE_URL, SUPABASE_ANON_KEY }
}

// Create cookie storage for session management
export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: 'sb-session',
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secrets: [process.env.SESSION_SECRET || 'fallback-secret-replace-in-production'],
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
})

// Create Supabase server client with error handling
export function createSupabaseServerClient(request: Request) {
  try {
    const { SUPABASE_URL, SUPABASE_ANON_KEY } = getSupabaseEnv()
    const headers = new Headers()

    const supabase = createServerClient<Database>(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        cookies: {
          get(key) {
            return request.headers.get('Cookie')?.match(
              new RegExp(`(^|;\\s*)${key}=([^;]*)`)
            )?.[2]
          },
          set(key, value, options) {
            const cookie = `${key}=${value}; Path=${options?.path || '/'}; HttpOnly; SameSite=Lax` +
              (options?.maxAge ? `; Max-Age=${options.maxAge}` : '') +
              (options?.domain ? `; Domain=${options.domain}` : '') +
              (options?.secure ? `; Secure` : '')
            
            headers.append('Set-Cookie', cookie)
          },
          remove(key, options) {
            headers.append(
              'Set-Cookie',
              `${key}=; Path=${options?.path || '/'}; HttpOnly; SameSite=Lax; Max-Age=0`
            )
          },
        },
      }
    )

    return { supabase, headers }
  } catch (error) {
    console.error('Failed to create Supabase server client:', error)
    throw error
  }
}

// Get the user from the session, using getUser to follow security best practices
export async function getUser(request: Request) {
  const { supabase } = createSupabaseServerClient(request)
  // Use getUser instead of getSession to address the security warning
  const { data, error } = await supabase.auth.getUser()
  
  if (error) {
    console.error('Error getting user:', error)
    return null
  }
  
  return data.user
}

// Require user authentication and redirect if not authenticated
export async function requireUser(request: Request, redirectTo = '/login') {
  const user = await getUser(request)
  if (!user) {
    // Create a redirect with cleared cookie if no user is found
    const { headers } = createSupabaseServerClient(request)
    throw redirect(redirectTo, { headers })
  }
  return user
}

// Sign in with email and password
export async function signInWithPassword(request: Request, email: string, password: string) {
  const { supabase, headers } = createSupabaseServerClient(request)
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) {
    return { error, headers }
  }
  
  return { data, headers }
}

// Sign out the user
export async function signOut(request: Request) {
  const { supabase, headers } = createSupabaseServerClient(request)
  await supabase.auth.signOut()
  return redirect('/login', { headers })
}