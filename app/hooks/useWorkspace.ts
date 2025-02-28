// app/hooks/useWorkspace.ts
import { useState, useEffect } from 'react'

interface Workspace {
  id: string
  name: string
  // Add other workspace properties as needed
}

interface UseWorkspaceProps {
  workspaces: Workspace[]
  defaultWorkspace?: string | null
}

/**
 * Hook to manage workspace selection and persistence in localStorage
 */
export function useWorkspace({ 
  workspaces = [], 
  defaultWorkspace = null 
}: UseWorkspaceProps) {
  // State for the selected workspace
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(defaultWorkspace)
  
  // Load workspace from localStorage on initial render
  useEffect(() => {
    if (typeof window !== 'undefined' && workspaces.length > 0) {
      const storedWorkspace = localStorage.getItem('selectedWorkspace')
      
      if (storedWorkspace && workspaces.some(w => w.id === storedWorkspace)) {
        // If the stored workspace exists in the available workspaces, use it
        setSelectedWorkspace(storedWorkspace)
      } else if (defaultWorkspace && workspaces.some(w => w.id === defaultWorkspace)) {
        // If a default is provided and exists in workspaces, use it
        setSelectedWorkspace(defaultWorkspace)
        localStorage.setItem('selectedWorkspace', defaultWorkspace)
      } else {
        // Otherwise default to the first workspace
        setSelectedWorkspace(workspaces[0].id)
        localStorage.setItem('selectedWorkspace', workspaces[0].id)
      }
    }
  }, [workspaces, defaultWorkspace])
  
  // Change the selected workspace and update localStorage
  const changeWorkspace = (workspaceId: string) => {
    if (workspaces.some(w => w.id === workspaceId)) {
      setSelectedWorkspace(workspaceId)
      localStorage.setItem('selectedWorkspace', workspaceId)
      return true
    }
    return false
  }
  
  // Get the full workspace object for the selected ID
  const currentWorkspace = workspaces.find(w => w.id === selectedWorkspace) || null
  
  return {
    selectedWorkspaceId: selectedWorkspace,
    currentWorkspace,
    changeWorkspace,
    workspaces
  }
}