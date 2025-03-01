// app/routes/_auth.engage.contacts.tsx
import { json, type LoaderFunctionArgs } from "@remix-run/node"
import { useLoaderData, useOutletContext } from "@remix-run/react"
import { useState, useEffect } from "react"
import { createSupabaseServerClient } from "~/services/supabase.server"
import { getSupabaseClient } from "~/services/auth.client"
import { Toaster } from "~/components/ui/sonner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table"
import { Button } from "~/components/ui/button"

// Type for the context passed from the parent route
type EngageContext = {
  user: any
  workspaces: any[]
  selectedWorkspace: string | null
}

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // Create Supabase client
    const { supabase, headers } = createSupabaseServerClient(request)
    
    // Verify authentication
    const { data: userData, error: userError } = await supabase.auth.getUser()
    
    if (userError || !userData.user) {
      throw new Error('User not authenticated')
    }
    
    // Just return minimal data
    return json({ ok: true }, { headers })
  } catch (error) {
    console.error('Error in contacts loader:', error)
    return json({ ok: false })
  }
}

export default function ContactsRoute() {
  // Get context from parent route including the selected workspace
  const { user, selectedWorkspace } = useOutletContext<EngageContext>()
  
  // State for data
  const [views, setViews] = useState<any[]>([])
  const [contacts, setContacts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Fetch data when workspace changes
  // Update the useEffect for loading contacts
useEffect(() => {
  const loadContactsForWorkspace = async () => {
    if (!selectedWorkspace) return;
    
    try {
      setIsLoading(true);
      
      console.log('Starting to load contacts for workspace:', selectedWorkspace);
      
      // Ensure Supabase client is initialized
      const { getSupabaseClient, isClientInitialized } = await import("~/services/auth.client");
      
      if (!isClientInitialized()) {
        console.warn('Supabase client not initialized yet');
        // Try to initialize from the window.__env
        const envFromWindow = (window as any).__env;
        
        if (envFromWindow?.SUPABASE_URL && envFromWindow?.SUPABASE_ANON_KEY) {
          const { initSupabaseClient } = await import("~/services/auth.client");
          initSupabaseClient(envFromWindow.SUPABASE_URL, envFromWindow.SUPABASE_ANON_KEY);
          console.log('Initialized Supabase client from window env');
        }
      }
      
      const supabase = getSupabaseClient();
      
      if (!supabase) {
        console.error('Supabase client not available');
        return;
      }
      
      console.log('Executing contacts query with workspace_id:', selectedWorkspace);
      
      const { data, error } = await supabase
        .from('contacts')
        .select(`
          *,
          race:race_id(id, race),
          gender:gender_id(id, gender)
        `)
        .eq('workspace_id', selectedWorkspace);
      
      if (error) {
        console.error('Error fetching contacts:', error);
        return;
      }
      
      console.log('Fetched contacts:', data?.length, data);
      setInitialContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  };
  
  loadContactsForWorkspace();
}, [selectedWorkspace]);
  
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
  
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <h2 className="text-lg font-medium mt-4">Loading contacts...</h2>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold mb-2 text-red-500">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button 
            onClick={() => window.location.reload()}
            variant="outline"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Contacts</h1>
        <div className="space-x-2">
          <Button variant="outline">
            Filter ({views.length} Views)
          </Button>
          <Button variant="default">
            Add Contact
          </Button>
        </div>
      </div>
      
      {contacts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium mb-2">No contacts found</h3>
          <p className="text-gray-500 mb-4">Get started by adding your first contact</p>
          <Button>Add Your First Contact</Button>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>First Name</TableHead>
                <TableHead>Last Name</TableHead>
                <TableHead>Race</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell>{contact.first_name}</TableCell>
                  <TableCell>{contact.last_name}</TableCell>
                  <TableCell>{contact.race?.race || '-'}</TableCell>
                  <TableCell>{contact.gender?.gender || '-'}</TableCell>
                  <TableCell>{contact.status || 'Unknown'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      <Toaster position="top-right" />
    </div>
  )
}