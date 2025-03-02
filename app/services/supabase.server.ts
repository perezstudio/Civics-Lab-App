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
  try {
    const { supabase, headers } = createSupabaseServerClient(request)
    const { data, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('Error getting user:', error)
      return null
    }
    
    return data.user
  } catch (error) {
    console.error('Error in getUser helper:', error)
    return null
  }
}

// Require user authentication and redirect if not authenticated
export async function requireUser(request: Request, redirectTo = '/login') {
  try {
    const { supabase, headers } = createSupabaseServerClient(request)
    const { data, error } = await supabase.auth.getUser()
    
    if (error || !data.user) {
      throw redirect(redirectTo, { headers })
    }
    
    return data.user
  } catch (error) {
    if (error instanceof Response) {
      throw error
    }
    
    // For other errors, create a redirect with headers
    const { headers } = createSupabaseServerClient(request)
    throw redirect(redirectTo, { headers })
  }
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

// Sign up a new user with email and password
export async function signUpWithPassword(request: Request, email: string, password: string) {
  const { supabase, headers } = createSupabaseServerClient(request)
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  
  if (error) {
    return { error, headers }
  }
  
  return { data, headers }
}

// Reset password
export async function resetPassword(request: Request, email: string) {
  const { supabase, headers } = createSupabaseServerClient(request)
  
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${new URL(request.url).origin}/reset-password`,
  })
  
  if (error) {
    return { error, headers }
  }
  
  return { data, headers }
}

// Update user password
export async function updatePassword(request: Request, password: string) {
  const { supabase, headers } = createSupabaseServerClient(request)
  
  const { data, error } = await supabase.auth.updateUser({
    password,
  })
  
  if (error) {
    return { error, headers }
  }
  
  return { data, headers }
}

// Create data in a table
export async function createData(request: Request, table: string, data: any) {
  const { supabase, headers } = createSupabaseServerClient(request)
  
  const { data: result, error } = await supabase
    .from(table)
    .insert(data)
    .select()
    .single()
  
  if (error) {
    return { error, headers }
  }
  
  return { data: result, headers }
}

// Update data in a table
export async function updateData(request: Request, table: string, id: string, data: any) {
  const { supabase, headers } = createSupabaseServerClient(request)
  
  const { data: result, error } = await supabase
    .from(table)
    .update(data)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    return { error, headers }
  }
  
  return { data: result, headers }
}

// Delete data from a table
export async function deleteData(request: Request, table: string, id: string) {
  const { supabase, headers } = createSupabaseServerClient(request)
  
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id)
  
  if (error) {
    return { error, headers }
  }
  
  return { success: true, headers }
}

// Fetch data with optional query parameters
export async function fetchData(request: Request, table: string, query: Record<string, any> = {}) {
  const { supabase, headers } = createSupabaseServerClient(request)
  
  const { data, error } = await supabase
    .from(table)
    .select()
    .match(query)
  
  if (error) {
    return { error, headers }
  }
  
  return { data, headers }
}

// Fetch data with complex query builder
export async function queryData(request: Request, table: string, queryFn: (query: any) => any) {
  const { supabase, headers } = createSupabaseServerClient(request)
  
  let query = supabase.from(table).select()
  query = queryFn(query)
  
  const { data, error } = await query
  
  if (error) {
    return { error, headers }
  }
  
  return { data, headers }
}

// Fetch user data with custom query
export async function fetchUserData(request: Request, userId: string) {
  const { supabase, headers } = createSupabaseServerClient(request)
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  if (error) {
    return { error, headers }
  }
  
  return { data, headers }
}

// Create or update a profile for a user
export async function upsertProfile(request: Request, profile: any) {
  const { supabase, headers } = createSupabaseServerClient(request)
  
  const { data, error } = await supabase
    .from('profiles')
    .upsert(profile)
    .select()
    .single()
  
  if (error) {
    return { error, headers }
  }
  
  return { data, headers }
}

// Fetch workspaces for a user
export async function fetchWorkspaces(request: Request, userId: string) {
  const { supabase, headers } = createSupabaseServerClient(request)
  
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('created_by', userId)
  
  if (error) {
    return { error, headers }
  }
  
  return { data, headers }
}

// Fetch workspace details with members
export async function fetchWorkspaceWithMembers(request: Request, workspaceId: string) {
  const { supabase, headers } = createSupabaseServerClient(request)
  
  const { data, error } = await supabase
    .from('workspaces')
    .select(`
      *,
      workspace_members(
        *,
        profiles(*)
      )
    `)
    .eq('id', workspaceId)
    .single()
  
  if (error) {
    return { error, headers }
  }
  
  return { data, headers }
}

// Create a workspace
export async function createWorkspace(request: Request, workspace: any) {
  const { supabase, headers } = createSupabaseServerClient(request)
  
  const { data, error } = await supabase
    .from('workspaces')
    .insert(workspace)
    .select()
    .single()
  
  if (error) {
    return { error, headers }
  }
  
  return { data, headers }
}

// Add a member to a workspace
export async function addWorkspaceMember(request: Request, workspaceMember: any) {
  const { supabase, headers } = createSupabaseServerClient(request)
  
  const { data, error } = await supabase
    .from('workspace_members')
    .insert(workspaceMember)
    .select()
    .single()
  
  if (error) {
    return { error, headers }
  }
  
  return { data, headers }
}

// Remove a member from a workspace
export async function removeWorkspaceMember(request: Request, workspaceId: string, userId: string) {
  const { supabase, headers } = createSupabaseServerClient(request)
  
  const { error } = await supabase
    .from('workspace_members')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
  
  if (error) {
    return { error, headers }
  }
  
  return { success: true, headers }
}

// Fetch contacts for a workspace
export async function fetchContacts(request: Request, workspaceId: string) {
  const { supabase, headers } = createSupabaseServerClient(request)
  
  const { data, error } = await supabase
    .from('contacts')
    .select(`
      *,
      race:race_id(id, race),
      gender:gender_id(id, gender),
      emails:contact_emails(*),
      phones:contact_phones(*),
      addresses:contact_addresses(
        *,
        state:state_id(id, name, abbreviation),
        zip:zip_code_id(id, name)
      ),
      social_media:contact_social_media_accounts(*),
      tags:contact_tag_assignments(
        id,
        tag:tag_id(id, tag)
      )
    `)
    .eq('workspace_id', workspaceId)
  
  if (error) {
    return { error, headers }
  }
  
  return { data, headers }
}

// Fetch a single contact with all related data
export async function fetchContact(request: Request, contactId: string) {
  const { supabase, headers } = createSupabaseServerClient(request)
  
  const { data, error } = await supabase
    .from('contacts')
    .select(`
      *,
      race:race_id(id, race),
      gender:gender_id(id, gender),
      emails:contact_emails(*),
      phones:contact_phones(*),
      addresses:contact_addresses(
        *,
        state:state_id(id, name, abbreviation),
        zip:zip_code_id(id, name)
      ),
      social_media:contact_social_media_accounts(*),
      tags:contact_tag_assignments(
        id,
        tag:tag_id(id, tag)
      )
    `)
    .eq('id', contactId)
    .single()
  
  if (error) {
    return { error, headers }
  }
  
  return { data, headers }
}

// Fetch contact views for a workspace
export async function fetchContactViews(request: Request, workspaceId: string) {
  const { supabase, headers } = createSupabaseServerClient(request)
  
  const { data, error } = await supabase
    .from('contact_views')
    .select('*')
    .eq('workspace_id', workspaceId)
  
  if (error) {
    return { error, headers }
  }
  
  return { data, headers }
}

// Create a contact view
export async function createContactView(request: Request, contactView: any) {
  const { supabase, headers } = createSupabaseServerClient(request)
  
  const { data, error } = await supabase
    .from('contact_views')
    .insert(contactView)
    .select()
    .single()
  
  if (error) {
    return { error, headers }
  }
  
  return { data, headers }
}

// Update a contact view
export async function updateContactView(request: Request, id: string, contactView: any) {
  const { supabase, headers } = createSupabaseServerClient(request)
  
  const { data, error } = await supabase
    .from('contact_views')
    .update(contactView)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    return { error, headers }
  }
  
  return { data, headers }
}

// Delete a contact view
export async function deleteContactView(request: Request, id: string) {
  const { supabase, headers } = createSupabaseServerClient(request)
  
  const { error } = await supabase
    .from('contact_views')
    .delete()
    .eq('id', id)
  
  if (error) {
    return { error, headers }
  }
  
  return { success: true, headers }
}

// Fetch reference data (states, zip codes, etc.)
export async function fetchReferenceData(request: Request, table: string) {
  const { supabase, headers } = createSupabaseServerClient(request)
  
  const { data, error } = await supabase
    .from(table)
    .select('*')
  
  if (error) {
    return { error, headers }
  }
  
  return { data, headers }
}

// Process OAuth callback
export async function handleAuthCallback(request: Request) {
  const { supabase, headers } = createSupabaseServerClient(request)
  
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    await supabase.auth.exchangeCodeForSession(code)
  }

  return { success: true, headers }
}