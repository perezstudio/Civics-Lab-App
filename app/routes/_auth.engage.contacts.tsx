// app/routes/_auth.engage.contacts.tsx
import { json, type LoaderFunctionArgs } from "@remix-run/node"
import { useLoaderData, useOutletContext } from "@remix-run/react"
import { useState, useEffect } from "react"
import { createSupabaseServerClient } from "~/services/supabase.server"
import { ContactsPage } from "~/components/contacts/ContactsPage"
import { Toaster } from "~/components/ui/sonner"

// Type for the context passed from the parent route
type EngageContext = {
  user: any
  workspaces: any[]
  selectedWorkspace: string | null
}

// We're going to get data based on the user's workspaces in general
// The client will handle filtering based on the selected workspace in localStorage
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // Create Supabase client
    const { supabase, headers } = createSupabaseServerClient(request)
    
    // Verify authentication
    const { data: userData, error: userError } = await supabase.auth.getUser()
    
    if (userError || !userData.user) {
      throw new Error('User not authenticated')
    }
    
    // Get list of workspace IDs the user has access to
    const { data: workspacesData, error: workspacesError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('created_by', userData.user.id)
    
    if (workspacesError) {
      console.error('Error fetching workspaces:', workspacesError)
      return json(
        { 
          initialViews: [],
          initialContacts: [],
        },
        { headers }
      )
    }
    
    // Get workspace IDs
    const workspaceIds = workspacesData?.map(w => w.id) || []
    
    if (workspaceIds.length === 0) {
      // No workspaces available
      return json(
        { 
          initialViews: [],
          initialContacts: [],
        },
        { headers }
      )
    }
    
    // Get views for all workspaces user has access to
    const { data: viewsData, error: viewsError } = await supabase
      .from('contact_views')
      .select('*')
      .in('workspace_id', workspaceIds)
    
    if (viewsError) {
      console.error('Error fetching contact views:', viewsError)
    }
    
    // Return the data
    return json(
      {
        initialViews: viewsData || [],
        workspaceIds,
      },
      { headers }
    )
  } catch (error) {
    console.error('Error in contacts loader:', error)
    return json({ 
      initialViews: [],
      workspaceIds: [],
    })
  }
}

export default function ContactsRoute() {
  // Get context from parent route including the selected workspace
  const { user, selectedWorkspace } = useOutletContext<EngageContext>()
  
  // Get data from loader
  const { initialViews, workspaceIds } = useLoaderData<typeof loader>()
  
  // State to store contacts that will be loaded client-side
  const [initialContacts, setInitialContacts] = useState([])
  
  // State to track client initialization
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // Fetch contacts for the selected workspace
  useEffect(() => {
    const fetchContacts = async () => {
      if (!selectedWorkspace) return
      
      try {
        setIsLoading(true)
        
        // Use client-side Supabase to fetch contacts
        const { getSupabaseClient } = await import("~/services/auth.client")
        const supabase = getSupabaseClient()
        
        if (!supabase) {
          console.error('Supabase client not initialized')
          return
        }
        
        const { data, error } = await supabase
          .from('contacts')
          .select(`
            *,
            race:race_id(id, race),
            gender:gender_id(id, gender)
          `)
          .eq('workspace_id', selectedWorkspace)
        
        if (error) {
          console.error('Error fetching contacts:', error)
          return
        }
        
        setInitialContacts(data || [])
      } catch (error) {
        console.error('Error fetching contacts:', error)
      } finally {
        setIsLoading(false)
        setIsInitialized(true)
      }
    }
    
    fetchContacts()
  }, [selectedWorkspace])

  // If no workspace is selected, show a message
  if (!selectedWorkspace) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No Workspace Selected</h2>
          <p className="text-gray-600">
            Please select a workspace from the dropdown in the sidebar.
          </p>
        </div>
      </div>
    )
  }

  // Filter views for the selected workspace
  const filteredViews = initialViews.filter(view => 
    view.workspace_id === selectedWorkspace
  )

  return (
    <>
      <ContactsPage 
        userId={user.id}
        workspaceId={selectedWorkspace}
        initialLoading={isLoading || !isInitialized}
        initialViews={filteredViews}
        initialContacts={initialContacts}
      />
      <Toaster position="top-right" />
    </>
  )
}