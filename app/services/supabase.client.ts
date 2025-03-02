import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '~/types/supabase'
import type { User } from '@supabase/supabase-js'

// Client-side singleton instance
let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null
let isInitialized = false

/**
 * Initialize the Supabase client on the client side
 */
export function initSupabaseClient(
  supabaseUrl: string, 
  supabaseAnonKey: string
) {
  if (typeof window === 'undefined') return null
  
  // Log helpful debug info without exposing sensitive data
  console.log('Initializing Supabase client', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey
  })
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Cannot initialize Supabase: missing credentials')
    return null
  }

  try {
    supabaseClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        storageKey: 'sb-auth-token',
      }
    })
    isInitialized = true
    console.log('Supabase client initialized successfully')
    return supabaseClient
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error)
    return null
  }
}

/**
 * Get the Supabase client (with auto-initialization from window.__env)
 */
export function getSupabaseClient() {
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

/**
 * Check if the client is already initialized
 */
export function isClientInitialized() {
  return isInitialized
}

/**
 * Get the current user
 */
export async function getUser(): Promise<User | null> {
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

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getUser()
  return !!user
}

/**
 * Sign out the user
 */
export async function signOut() {
  const client = getSupabaseClient()
  if (!client) return { error: 'Client not initialized' }
  
  try {
    return await client.auth.signOut()
  } catch (error) {
    console.error('Error during sign out:', error)
    return { error: 'Failed to sign out' }
  }
}

/**
 * Fetch workspaces for the current user
 */
export async function fetchUserWorkspaces(userId: string) {
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

/**
 * Create a new workspace
 */
export async function createWorkspace(workspace: any) {
  const client = getSupabaseClient()
  if (!client) return { data: null, error: 'Client not initialized' }
  
  try {
    return await client
      .from('workspaces')
      .insert(workspace)
      .select()
      .single()
  } catch (error) {
    console.error('Error creating workspace:', error)
    return { data: null, error: 'Failed to create workspace' }
  }
}

/**
 * Update a workspace
 */
export async function updateWorkspace(id: string, workspace: any) {
  const client = getSupabaseClient()
  if (!client) return { data: null, error: 'Client not initialized' }
  
  try {
    return await client
      .from('workspaces')
      .update(workspace)
      .eq('id', id)
      .select()
      .single()
  } catch (error) {
    console.error('Error updating workspace:', error)
    return { data: null, error: 'Failed to update workspace' }
  }
}

/**
 * Delete a workspace
 */
export async function deleteWorkspace(id: string) {
  const client = getSupabaseClient()
  if (!client) return { error: 'Client not initialized' }
  
  try {
    return await client
      .from('workspaces')
      .delete()
      .eq('id', id)
  } catch (error) {
    console.error('Error deleting workspace:', error)
    return { error: 'Failed to delete workspace' }
  }
}

/**
 * Fetch contacts for a workspace with optional filtering
 */
export async function fetchContacts(workspaceId: string, options: { includeRelations?: boolean } = {}) {
  const client = getSupabaseClient()
  if (!client) return { data: null, error: 'Client not initialized' }
  
  try {
    let query = client
      .from('contacts')
    
    if (options.includeRelations) {
      query = query.select(`
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
    } else {
      query = query.select(`
        *,
        race:race_id(id, race),
        gender:gender_id(id, gender)
      `)
    }
    
    return await query.eq('workspace_id', workspaceId)
  } catch (error) {
    console.error('Error fetching contacts:', error)
    return { data: null, error: 'Failed to fetch contacts' }
  }
}

/**
 * Fetch a single contact with all related data
 */
export async function fetchContactById(contactId: string) {
  const client = getSupabaseClient()
  if (!client) return { data: null, error: 'Client not initialized' }
  
  try {
    return await client
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
  } catch (error) {
    console.error('Error fetching contact:', error)
    return { data: null, error: 'Failed to fetch contact' }
  }
}

/**
 * Create a contact
 */
export async function createContact(contact: any) {
  const client = getSupabaseClient()
  if (!client) return { data: null, error: 'Client not initialized' }
  
  try {
    return await client
      .from('contacts')
      .insert(contact)
      .select()
      .single()
  } catch (error) {
    console.error('Error creating contact:', error)
    return { data: null, error: 'Failed to create contact' }
  }
}

/**
 * Update a contact
 */
export async function updateContact(id: string, contact: any) {
  const client = getSupabaseClient()
  if (!client) return { data: null, error: 'Client not initialized' }
  
  try {
    return await client
      .from('contacts')
      .update(contact)
      .eq('id', id)
      .select()
      .single()
  } catch (error) {
    console.error('Error updating contact:', error)
    return { data: null, error: 'Failed to update contact' }
  }
}

/**
 * Delete a contact
 */
export async function deleteContact(id: string) {
  const client = getSupabaseClient()
  if (!client) return { error: 'Client not initialized' }
  
  try {
    return await client
      .from('contacts')
      .delete()
      .eq('id', id)
  } catch (error) {
    console.error('Error deleting contact:', error)
    return { error: 'Failed to delete contact' }
  }
}

/**
 * Fetch contact views for a workspace
 */
export async function fetchContactViews(workspaceId: string) {
  const client = getSupabaseClient()
  if (!client) return { data: null, error: 'Client not initialized' }
  
  try {
    return await client
      .from('contact_views')
      .select('*')
      .eq('workspace_id', workspaceId)
  } catch (error) {
    console.error('Error fetching contact views:', error)
    return { data: null, error: 'Failed to fetch contact views' }
  }
}

/**
 * Create a contact view
 */
export async function createContactView(contactView: any) {
  const client = getSupabaseClient()
  if (!client) return { data: null, error: 'Client not initialized' }
  
  try {
    return await client
      .from('contact_views')
      .insert(contactView)
      .select()
      .single()
  } catch (error) {
    console.error('Error creating contact view:', error)
    return { data: null, error: 'Failed to create contact view' }
  }
}

/**
 * Update a contact view
 */
export async function updateContactView(id: string, contactView: any) {
  const client = getSupabaseClient()
  if (!client) return { data: null, error: 'Client not initialized' }
  
  try {
    return await client
      .from('contact_views')
      .update(contactView)
      .eq('id', id)
      .select()
      .single()
  } catch (error) {
    console.error('Error updating contact view:', error)
    return { data: null, error: 'Failed to update contact view' }
  }
}

/**
 * Delete a contact view
 */
export async function deleteContactView(id: string) {
  const client = getSupabaseClient()
  if (!client) return { error: 'Client not initialized' }
  
  try {
    return await client
      .from('contact_views')
      .delete()
      .eq('id', id)
  } catch (error) {
    console.error('Error deleting contact view:', error)
    return { error: 'Failed to delete contact view' }
  }
}

/**
 * Fetch reference data (states, zip codes, etc.)
 */
export async function fetchReferenceData(table: string) {
  const client = getSupabaseClient()
  if (!client) return { data: null, error: 'Client not initialized' }
  
  try {
    return await client
      .from(table)
      .select('*')
  } catch (error) {
    console.error(`Error fetching ${table}:`, error)
    return { data: null, error: `Failed to fetch ${table}` }
  }
}

/**
 * Create a transaction that handles multiple insert operations
 */
export async function createContactWithRelations(
  contact: any,
  emails: any[] = [],
  phones: any[] = [],
  addresses: any[] = [],
  socialMedia: any[] = [],
  tags: any[] = []
) {
  const client = getSupabaseClient()
  if (!client) return { data: null, error: 'Client not initialized' }
  
  try {
    // Insert the contact first
    const { data: contactData, error: contactError } = await client
      .from('contacts')
      .insert(contact)
      .select()
      .single()
      
    if (contactError) {
      throw new Error(`Failed to create contact: ${contactError.message}`)
    }
    
    if (!contactData) {
      throw new Error('Contact was not created')
    }
    
    // Process related records in parallel
    await Promise.all([
      // Process emails
      ...(emails.length > 0 
        ? [client
            .from('contact_emails')
            .insert(emails.map(email => ({
              contact_id: contactData.id,
              ...email
            })))]
        : []),
        
      // Process phones
      ...(phones.length > 0 
        ? [client
            .from('contact_phones')
            .insert(phones.map(phone => ({
              contact_id: contactData.id,
              ...phone
            })))]
        : []),
        
      // Process addresses
      ...(addresses.length > 0 
        ? [client
            .from('contact_addresses')
            .insert(addresses.map(address => ({
              contact_id: contactData.id,
              ...address
            })))]
        : []),
        
      // Process social media
      ...(socialMedia.length > 0 
        ? [client
            .from('contact_social_media_accounts')
            .insert(socialMedia.map(account => ({
              contact_id: contactData.id,
              ...account
            })))]
        : []),
        
      // Process tags
      ...(tags.length > 0 
        ? [client
            .from('contact_tag_assignments')
            .insert(tags.map(tag => ({
              contact_id: contactData.id,
              tag_id: tag.id
            })))]
        : [])
    ])
    
    return { data: contactData, error: null }
  } catch (error) {
    console.error('Error creating contact with relations:', error)
    return { data: null, error: error instanceof Error ? error.message : 'Failed to create contact' }
  }
}

/**
 * Update a user profile
 */
export async function updateUserProfile(profile: any) {
  const client = getSupabaseClient()
  if (!client) return { data: null, error: 'Client not initialized' }
  
  try {
    return await client
      .from('profiles')
      .upsert(profile)
      .select()
      .single()
  } catch (error) {
    console.error('Error updating profile:', error)
    return { data: null, error: 'Failed to update profile' }
  }
}

/**
 * Subscribe to real-time changes on a table
 */
export function subscribeToTable(
  table: string,
  callback: (payload: any) => void,
  options: {
    event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
    filter?: string
  } = {}
) {
  const client = getSupabaseClient()
  if (!client) {
    console.error('Cannot subscribe: Supabase client not initialized')
    return { error: 'Client not initialized' }
  }
  
  const { event = '*', filter } = options
  
  let subscription = client
    .channel('table-changes')
    .on(
      'postgres_changes',
      { 
        event, 
        schema: 'public', 
        table,
        ...(filter ? { filter } : {})
      },
      callback
    )
    .subscribe()
    
  // Return unsubscribe function
  return () => {
    subscription.unsubscribe()
  }
}

/**
 * Upload a file to Supabase storage
 */
export async function uploadFile(bucket: string, path: string, file: File) {
  const client = getSupabaseClient()
  if (!client) return { data: null, error: 'Client not initialized' }
  
  try {
    return await client
      .storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true
      })
  } catch (error) {
    console.error('Error uploading file:', error)
    return { data: null, error: 'Failed to upload file' }
  }
}

/**
 * Get a public URL for a file
 */
export function getPublicUrl(bucket: string, path: string) {
  const client = getSupabaseClient()
  if (!client) return { data: { publicUrl: '' }, error: 'Client not initialized' }
  
  return client
    .storage
    .from(bucket)
    .getPublicUrl(path)
}

/**
 * Fetch data from a table with pagination
 */
export async function fetchPaginatedData(
  table: string, 
  options: {
    page?: number,
    pageSize?: number,
    filter?: Record<string, any>,
    orderBy?: { column: string, ascending?: boolean }
  } = {}
) {
  const client = getSupabaseClient()
  if (!client) return { data: null, count: 0, error: 'Client not initialized' }
  
  const {
    page = 1,
    pageSize = 10,
    filter = {},
    orderBy = { column: 'created_at', ascending: false }
  } = options
  
  try {
    // Calculate range parameters for pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    
    // Start building the query
    let query = client
      .from(table)
      .select('*', { count: 'exact' })
      .range(from, to)
    
    // Add filtering
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value)
      }
    })
    
    // Add ordering
    query = query.order(orderBy.column, { 
      ascending: orderBy.ascending ?? false 
    })
    
    // Execute the query
    const { data, error, count } = await query
    
    if (error) {
      throw error
    }
    
    return { 
      data, 
      count: count || 0,
      page,
      pageSize,
      totalPages: count ? Math.ceil(count / pageSize) : 0
    }
  } catch (error) {
    console.error('Error fetching paginated data:', error)
    return { data: null, count: 0, error: 'Failed to fetch data' }
  }
}

/**
 * Search data with text search
 */
export async function searchData(
  table: string,
  searchTerm: string,
  searchColumns: string[],
  options: {
    limit?: number,
    filter?: Record<string, any>
  } = {}
) {
  const client = getSupabaseClient()
  if (!client) return { data: null, error: 'Client not initialized' }
  
  const { limit = 10, filter = {} } = options
  
  try {
    // Start building the query
    let query = client
      .from(table)
      .select('*')
      .limit(limit)
    
    // Add filtering
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value)
      }
    })
    
    // Add text search conditions
    searchColumns.forEach((column, index) => {
      if (index === 0) {
        // First condition uses ilike directly
        query = query.ilike(column, `%${searchTerm}%`)
      } else {
        // Additional conditions use or
        query = query.or(`${column}.ilike.%${searchTerm}%`)
      }
    })
    
    // Execute the query
    const { data, error } = await query
    
    if (error) {
      throw error
    }
    
    return { data }
  } catch (error) {
    console.error('Error searching data:', error)
    return { data: null, error: 'Failed to search data' }
  }
}