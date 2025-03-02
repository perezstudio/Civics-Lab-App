// app/routes/_auth.engage.tsx
import { Outlet } from "@remix-run/react"
import { WorkspaceProvider } from "~/contexts/WorkspaceContext"
import { useAuth } from "~/contexts/AuthContext"
import { EngageSidebar } from "~/components/engage/sidebar"
import { useState, useEffect } from "react"

// This component provides the workspace context and sidebar layout
export default function EngageLayout() {
  const { user, supabase } = useAuth()
  const [workspaces, setWorkspaces] = useState<any[]>([])
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Load workspaces when the component mounts
  useEffect(() => {
    if (!user || !supabase) {
      setIsLoading(false)
      return
    }
    
    const fetchWorkspaces = async () => {
      try {
        setIsLoading(true)
        
        const { data, error } = await supabase
          .from('workspaces')
          .select('*')
          .eq('created_by', user.id)
        
        if (error) {
          console.error('Error fetching workspaces:', error)
          return
        }
        
        setWorkspaces(data || [])
        
        // Try to restore selected workspace from localStorage
        const storedWorkspace = localStorage.getItem('selectedWorkspace')
        
        if (storedWorkspace && data?.some(w => w.id === storedWorkspace)) {
          setSelectedWorkspace(storedWorkspace)
        } else if (data && data.length > 0) {
          // Default to the first workspace
          setSelectedWorkspace(data[0].id)
          localStorage.setItem('selectedWorkspace', data[0].id)
        }
      } catch (error) {
        console.error('Unexpected error fetching workspaces:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchWorkspaces()
  }, [user, supabase])
  
  // Handle workspace change
  const handleWorkspaceChange = (workspaceId: string) => {
    setSelectedWorkspace(workspaceId)
    localStorage.setItem('selectedWorkspace', workspaceId)
  }
  
  // Get the full workspace object
  const selectedWorkspaceObject = workspaces.find(w => w.id === selectedWorkspace)
  
  return (
    <div className="flex h-screen">
      <EngageSidebar 
        user={user} 
        workspaces={workspaces}
        selectedWorkspace={selectedWorkspace}
        onWorkspaceChange={handleWorkspaceChange}
      />
      <div className="flex-1 overflow-hidden bg-white">
        <Outlet context={{ 
          user, 
          workspaces, 
          selectedWorkspace: selectedWorkspaceObject,
          selectedWorkspaceId: selectedWorkspace
        }} />
      </div>
    </div>
  )
}