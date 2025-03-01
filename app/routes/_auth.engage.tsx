// app/routes/_auth.engage.tsx
import { json, type LoaderFunctionArgs } from "@remix-run/node"
import { Outlet, useLoaderData, useOutletContext } from "@remix-run/react"
import { useState, useEffect } from "react"
import { EngageSidebar } from "~/components/engage/sidebar"
import { createSupabaseServerClient } from "~/services/supabase.server"

// Type for auth context from parent layout
type AuthContext = { user: any }

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const { supabase, headers } = createSupabaseServerClient(request)
    
    // Get current user using getUser method instead of session
    const { data: userData, error: userError } = await supabase.auth.getUser()
    
    if (userError || !userData.user) {
      throw new Error('User not authenticated')
    }
    
    // Fetch workspaces for the user
    const { data: workspaces, error: workspacesError } = await supabase
      .from('workspaces')
      .select('*')
      .eq('created_by', userData.user.id)
    
    if (workspacesError) {
      console.error('Error fetching workspaces:', workspacesError)
      return json({ workspaces: [] }, { headers })
    }
    
    return json(
      { workspaces: workspaces || [] }, 
      { headers }
    )
  } catch (error) {
    console.error('Error in engage loader:', error)
    return json({ workspaces: [] })
  }
}

export default function EngageRoute() {
  // Get user from outlet context (provided by _auth.tsx)
  const { user } = useOutletContext<AuthContext>()
  
  // Get workspaces from loader data
  const { workspaces } = useLoaderData<typeof loader>()
  
  // State for selected workspace
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null)
  
  // Initialize selected workspace from localStorage
  // Ensure the selectedWorkspace is properly initialized from localStorage
useEffect(() => {
  if (typeof window !== 'undefined' && workspaces.length > 0) {
    try {
      let storedWorkspace = localStorage.getItem('selectedWorkspace');
      
      console.log('Retrieved workspace from localStorage:', storedWorkspace);
      
      // If the stored ID is not in the list of available workspaces, use the first one
      if (!storedWorkspace || !workspaces.some(w => w.id === storedWorkspace)) {
        storedWorkspace = workspaces[0].id;
        localStorage.setItem('selectedWorkspace', storedWorkspace);
        console.log('Set default workspace to:', storedWorkspace);
      }
      
      setSelectedWorkspace(storedWorkspace);
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      // Fallback to first workspace
      if (workspaces.length > 0) {
        setSelectedWorkspace(workspaces[0].id);
      }
    }
  }
}, [workspaces]);

  // Handle workspace change
  const handleWorkspaceChange = (workspaceId: string) => {
    setSelectedWorkspace(workspaceId)
    localStorage.setItem('selectedWorkspace', workspaceId)
  }

  return (
    <div className="flex h-screen">
      <EngageSidebar 
        user={user} 
        workspaces={workspaces}
        selectedWorkspace={selectedWorkspace}
        onWorkspaceChange={handleWorkspaceChange}
      />
      <div className="flex-1 overflow-hidden bg-white">
        <Outlet context={{ user, workspaces, selectedWorkspace }} />
      </div>
    </div>
  )
}