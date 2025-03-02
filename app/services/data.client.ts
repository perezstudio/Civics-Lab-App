// app/services/data.client.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/supabase'

// Generic type for a function that takes a Supabase client
type SupabaseFunction<T> = (supabase: SupabaseClient<Database>) => Promise<T>

// Execute a function with the provided Supabase client
export async function withSupabase<T>(
  supabase: SupabaseClient<Database> | null, 
  fn: SupabaseFunction<T>
): Promise<{ data: T | null, error: string | null }> {
  if (!supabase) {
    return { data: null, error: 'Supabase client not initialized' }
  }
  
  try {
    const result = await fn(supabase)
    return { data: result, error: null }
  } catch (error: any) {
    console.error('Supabase operation error:', error)
    return { 
      data: null, 
      error: error.message || 'An error occurred with the database operation' 
    }
  }
}

/**
 * Fetch workspaces for the current user
 */
export async function fetchWorkspaces(supabase: SupabaseClient<Database> | null, userId: string) {
  return withSupabase(supabase, async (client) => {
    const { data, error } = await client
      .from('workspaces')
      .select('*')
      .eq('created_by', userId)
    
    if (error) throw error
    
    return data || []
  })
}

/**
 * Fetch contacts for a workspace
 */
export async function fetchContacts(
  supabase: SupabaseClient<Database> | null, 
  workspaceId: string, 
  options: { includeRelations?: boolean } = {}
) {
  return withSupabase(supabase, async (client) => {
    let query = client.from('contacts')
    
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
    
    const { data, error } = await query.eq('workspace_id', workspaceId)
    
    if (error) throw error
    
    return data || []
  })
}

/**
 * Fetch contact details by ID
 */
export async function fetchContactById(supabase: SupabaseClient<Database> | null, contactId: string) {
  return withSupabase(supabase, async (client) => {
    const { data, error } = await client
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
    
    if (error) throw error
    
    return data
  })
}

/**
 * Create a new contact
 */
export async function createContact(supabase: SupabaseClient<Database> | null, contact: any) {
  return withSupabase(supabase, async (client) => {
    const { data, error } = await client
      .from('contacts')
      .insert(contact)
      .select()
      .single()
    
    if (error) throw error
    
    return data
  })
}

/**
 * Fetch contact views for a workspace
 */
export async function fetchContactViews(supabase: SupabaseClient<Database> | null, workspaceId: string) {
  return withSupabase(supabase, async (client) => {
    const { data, error } = await client
      .from('contact_views')
      .select('*')
      .eq('workspace_id', workspaceId)
    
    if (error) throw error
    
    return data || []
  })
}

/**
 * Create a contact view
 */
export async function createContactView(supabase: SupabaseClient<Database> | null, contactView: any) {
  return withSupabase(supabase, async (client) => {
    const { data, error } = await client
      .from('contact_views')
      .insert(contactView)
      .select()
      .single()
    
    if (error) throw error
    
    return data
  })
}

/**
 * Update a contact view
 */
export async function updateContactView(supabase: SupabaseClient<Database> | null, id: string, contactView: any) {
  return withSupabase(supabase, async (client) => {
    const { data, error } = await client
      .from('contact_views')
      .update(contactView)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    return data
  })
}

/**
 * Delete a contact view
 */
export async function deleteContactView(supabase: SupabaseClient<Database> | null, id: string) {
  return withSupabase(supabase, async (client) => {
    const { error } = await client
      .from('contact_views')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    
    return true
  })
}

/**
 * Fetch reference data (races, genders, etc.)
 */
export async function fetchReferenceData(supabase: SupabaseClient<Database> | null, table: string) {
  return withSupabase(supabase, async (client) => {
    const { data, error } = await client
      .from(table)
      .select('*')
    
    if (error) throw error
    
    return data || []
  })
}

/**
 * Create a contact with related records
 */
export async function createContactWithRelations(
  supabase: SupabaseClient<Database> | null,
  contact: any,
  emails: any[] = [],
  phones: any[] = [],
  addresses: any[] = [],
  socialMedia: any[] = [],
  tags: any[] = []
) {
  return withSupabase(supabase, async (client) => {
    // Insert the contact first
    const { data: contactData, error: contactError } = await client
      .from('contacts')
      .insert(contact)
      .select()
      .single()
      
    if (contactError) throw contactError
    
    if (!contactData) throw new Error('Contact was not created')
    
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
    
    return contactData
  })
}