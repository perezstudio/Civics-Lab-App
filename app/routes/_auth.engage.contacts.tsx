// app/routes/_auth.engage.contacts.tsx
import { useOutletContext } from "@remix-run/react"
import { useState, useEffect } from "react"
import { Toaster } from "~/components/ui/sonner"
import { useAuth } from "~/contexts/AuthContext"
import { ContactsPage } from "~/components/contacts/ContactsPage"
import { fetchContacts, fetchContactViews } from "~/services/data.client"

// Type for the context passed from the parent route
type EngageContext = {
  user: any
  workspaces: any[]
  selectedWorkspace: any
  selectedWorkspaceId: string | null
}

export default function ContactsRoute() {
  // Get context from parent route
  const { user, selectedWorkspaceId } = useOutletContext<EngageContext>()
  
  // Get Supabase client from auth context
  const { supabase } = useAuth()
  
  // State for data
  const [contacts, setContacts] = useState<any[]>([])
  const [views, setViews] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  
  // Load data when workspace changes
  useEffect(() => {
    if (!selectedWorkspaceId || !supabase) {
      setContacts([])
      setViews([])
      setIsLoading(false)
      return
    }
    
    const loadData = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        console.log('Loading data for workspace:', selectedWorkspaceId)
        
        // Fetch contacts for the workspace
        const contactsResult = await fetchContacts(supabase, selectedWorkspaceId)
        
        // Fetch views for the workspace
        const viewsResult = await fetchContactViews(supabase, selectedWorkspaceId)
        
        // Check for errors
        if (contactsResult.error) {
          console.error('Error fetching contacts:', contactsResult.error)
          setError('Error fetching contacts')
        } else {
          setContacts(contactsResult.data || [])
        }
        
        if (viewsResult.error) {
          console.error('Error fetching views:', viewsResult.error)
          setError((prevError) => 
            prevError ? `${prevError}. Error fetching views` : 'Error fetching views'
          )
        } else {
          setViews(viewsResult.data || [])
        }
      } catch (err: any) {
        console.error('Error loading data:', err)
        setError(err.message || 'An unexpected error occurred')
      } finally {
        setIsLoading(false)
        setIsInitialized(true)
      }
    }
    
    loadData()
  }, [selectedWorkspaceId, supabase])
  
  // If no workspace is selected, show a message
  if (!selectedWorkspaceId) {
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
  
  // Show loading state
  if (!isInitialized && isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }
  
  return (
    <>
      <ContactsPage
        userId={user.id}
        workspaceId={selectedWorkspaceId}
        initialLoading={isLoading}
        initialViews={views}
        initialContacts={contacts}
      />
      <Toaster position="top-right" />
    </>
  )
}