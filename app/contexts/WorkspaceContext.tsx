// app/contexts/WorkspaceContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { toast } from 'sonner'

// Type for a workspace
interface Workspace {
  id: string
  name: string
  created_by: string
  [key: string]: any
}

// Type for the workspace context value
interface WorkspaceContextType {
  workspaces: Workspace[]
  selectedWorkspace: Workspace | null
  isLoading: boolean
  error: string | null
  setSelectedWorkspaceById: (id: string) => void
  refreshWorkspaces: () => Promise<void>
}

// Create the workspace context
const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

// Context provider props
interface WorkspaceProviderProps {
  children: ReactNode
  initialWorkspaces?: Workspace[]
}

// Storage key for selected workspace
const WORKSPACE_STORAGE_KEY = 'selectedWorkspace'

// Workspace provider component
export function WorkspaceProvider({ children, initialWorkspaces = [] }: WorkspaceProviderProps) {
  const { user, isAuthenticated, supabase } = useAuth()
  const [workspaces, setWorkspaces] = useState<Workspace[]>(initialWorkspaces)
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Load workspaces when user or supabase client changes
  useEffect(() => {
    if (!isAuthenticated || !user || !supabase) {
      setWorkspaces([])
      setSelectedWorkspace(null)
      setIsLoading(false)
      return
    }
    
    loadWorkspaces()
  }, [isAuthenticated, user, supabase])
  
  // Load the user's workspaces
  const loadWorkspaces = async () => {
    if (!user || !supabase) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('created_by', user.id)
      
      if (error) throw error
      
      console.log('Fetched workspaces:', data)
      setWorkspaces(data || [])
      
      // Try to restore the previously selected workspace from localStorage
      const storedWorkspaceId = localStorage.getItem(WORKSPACE_STORAGE_KEY)
      
      if (storedWorkspaceId && data?.some(w => w.id === storedWorkspaceId)) {
        setSelectedWorkspace(data.find(w => w.id === storedWorkspaceId) || null)
      } else if (data && data.length > 0) {
        // Default to the first workspace
        setSelectedWorkspace(data[0])
        localStorage.setItem(WORKSPACE_STORAGE_KEY, data[0].id)
      } else {
        setSelectedWorkspace(null)
        localStorage.removeItem(WORKSPACE_STORAGE_KEY)
      }
    } catch (error: any) {
      console.error('Error loading workspaces:', error)
      setError(error.message || 'Failed to load workspaces')
      toast.error('Failed to load workspaces')
    } finally {
      setIsLoading(false)
    }
  }
  
  // Set the selected workspace by ID
  const setSelectedWorkspaceById = (id: string) => {
    const workspace = workspaces.find(w => w.id === id)
    
    if (workspace) {
      setSelectedWorkspace(workspace)
      localStorage.setItem(WORKSPACE_STORAGE_KEY, workspace.id)
    } else {
      console.warn(`Workspace with ID ${id} not found`)
    }
  }
  
  // Context value
  const value: WorkspaceContextType = {
    workspaces,
    selectedWorkspace,
    isLoading,
    error,
    setSelectedWorkspaceById,
    refreshWorkspaces: loadWorkspaces
  }
  
  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  )
}

// Hook for using the workspace context
export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider')
  }
  
  return context
}