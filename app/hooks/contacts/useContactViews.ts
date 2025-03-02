// app/hooks/contacts/useContactViews.ts
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '~/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  ContactView, 
  VIEW_FIELDS,
  ViewField,
  ContactFilter,
  ContactSorting
} from '~/components/contacts/types';

interface UseContactViewsOptions {
  workspaceId: string | null;
  userId: string;
  initialViews?: ContactView[];
  onViewChange?: (view: ContactView | null) => void;
}

/**
 * Hook for managing contact views, including CRUD operations
 */
export function useContactViews({
  workspaceId,
  userId,
  initialViews = [],
  onViewChange
}: UseContactViewsOptions) {
  // Get Supabase client from auth context
  const { supabase } = useAuth();
  
  const [views, setViews] = useState<ContactView[]>(initialViews);
  const [selectedView, setSelectedView] = useState<ContactView | null>(initialViews[0] || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // UI control states
  const [isCreateViewOpen, setIsCreateViewOpen] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  const [isEditViewOpen, setIsEditViewOpen] = useState(false);
  const [editViewName, setEditViewName] = useState('');
  const [isDeleteViewOpen, setIsDeleteViewOpen] = useState(false);
  const [isViewSelectorOpen, setIsViewSelectorOpen] = useState(false);

  // When selected view changes, call the callback
  useEffect(() => {
    if (onViewChange) {
      onViewChange(selectedView);
    }
  }, [selectedView, onViewChange]);

  // Set initial views if provided
  useEffect(() => {
    if (initialViews.length > 0) {
      setViews(initialViews);
      if (!selectedView && initialViews.length > 0) {
        setSelectedView(initialViews[0]);
      }
    }
  }, [initialViews]);

  // We need a stable reference for fetchViews
  const fetchViews = useCallback(async () => {
    // Reset any previous errors
    setError(null);
    
    if (!workspaceId) {
      console.log('No workspace selected, skipping fetch');
      return;
    }
    
    // Check if Supabase client is initialized
    if (!supabase) {
      setError('Supabase client not initialized');
      return;
    }
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('contact_views')
        .select('*')
        .eq('workspace_id', workspaceId);
      
      if (error) {
        console.error("Error fetching views:", error);
        toast.error("Error loading views");
        setError(`Error fetching views: ${error.message}`);
        return;
      }
      
      if (data) {
        setViews(data);
        // Only set selectedView if none is currently selected and data exists
        if (!selectedView && data.length > 0) {
          setSelectedView(data[0]);
        }
      }
    } catch (error) {
      console.error("Error in fetchViews:", error);
      toast.error("Error loading views");
      setError(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, selectedView, supabase]);

  // Update view field visibility 
  const updateViewField = useCallback(async (field: keyof ContactView, value: boolean) => {
    if (!selectedView || !supabase) return;

    try {
      const { error } = await supabase
        .from('contact_views')
        .update({ [field]: value })
        .eq('id', selectedView.id);

      if (error) {
        console.error("Error updating view:", error);
        toast.error("Error updating view");
        return;
      }

      // Update local state
      setSelectedView(prevView => {
        if (!prevView) return null;
        return {
          ...prevView,
          [field]: value
        };
      });

      // Refresh views from server
      await fetchViews();
      
      toast.success("View updated");
    } catch (error: any) {
      console.error("Unexpected error updating view:", error);
      toast.error("Error updating view");
    }
  }, [selectedView, fetchViews, supabase]);

  // Create a new view
  const createView = useCallback(async (viewName: string) => {
    if (!viewName.trim() || !workspaceId || !userId || !supabase) {
      return null;
    }

    try {
      // Create default view configuration
      const newView = {
        view_name: viewName.trim(),
        workspace_id: workspaceId,
        filters: [],
        sorting: [],
        first_name: true,
        middle_name: true,
        last_name: true,
        race: true,
        gender: true,
        pronouns: true,
        vanid: true,
        addresses: true,
        phone_numbers: true,
        emails: true,
        social_media_accounts: true,
        created_by: userId,
        updated_by: userId
      };

      const { data: insertedView, error: insertError } = await supabase
        .from('contact_views')
        .insert([newView])
        .select();

      if (insertError) {
        console.error("Error creating view:", insertError);
        toast.error("Error creating view");
        return null;
      }

      await fetchViews();
      setNewViewName('');
      setIsCreateViewOpen(false);
      
      // If views were empty, select the new view
      if (insertedView && insertedView.length > 0 && views.length === 0) {
        setSelectedView(insertedView[0]);
      }
      
      toast.success("View created successfully");
      return insertedView?.[0] || null;
    } catch (error: any) {
      console.error("Unexpected error creating view:", error);
      toast.error("Error creating view");
      return null;
    }
  }, [workspaceId, userId, views.length, fetchViews, supabase]);
  
  // Edit an existing view
  const editView = useCallback(async (viewName: string) => {
    if (!selectedView || !viewName.trim() || !supabase) return;
    
    try {
      const updateData = { 
        view_name: viewName.trim(),
        updated_by: userId
      };
      
      const { data, error } = await supabase
        .from('contact_views')
        .update(updateData)
        .eq('id', selectedView.id)
        .select()
        .single();
  
      if (error) {
        console.error("Error updating view:", error);
        toast.error("Error updating view");
        return;
      }
  
      // Update local state
      setSelectedView(prevView => {
        if (!prevView) return null;
        return { ...prevView, view_name: viewName.trim() };
      });
      
      setViews(prevViews => 
        prevViews.map(view => 
          view.id === selectedView.id 
            ? { ...view, view_name: viewName.trim() }
            : view
        )
      );
  
      await fetchViews();
      setEditViewName('');
      setIsEditViewOpen(false);
      toast.success("View updated successfully");
    } catch (error: any) {
      console.error("Unexpected error updating view:", error);
      toast.error("Error updating view");
    }
  }, [selectedView, userId, fetchViews, supabase]);
  
  // Delete a view
  const deleteView = useCallback(async () => {
    if (!selectedView || !supabase) return;
    
    try {
      const { error } = await supabase
        .from('contact_views')
        .delete()
        .eq('id', selectedView.id);
  
      if (error) {
        console.error("Error deleting view:", error);
        toast.error("Error deleting view");
        return;
      }
      
      const currentViewId = selectedView.id;
      
      // Find next view to select
      const nextView = views.find(view => view.id !== currentViewId);
      setSelectedView(nextView || null);
      
      // Update views list
      setViews(prevViews => prevViews.filter(view => view.id !== currentViewId));
      
      setIsDeleteViewOpen(false);
      toast.success("View deleted successfully");
    } catch (error: any) {
      console.error("Unexpected error deleting view:", error);
      toast.error("Error deleting view");
    }
  }, [selectedView, views, supabase]);
  
  // Update view in database
  const updateViewInDatabase = useCallback(async (view: ContactView) => {
    if (!supabase) {
      toast.error("Cannot update view: Client not initialized");
      return false;
    }
    
    try {
      const updateData = {
        filters: view.filters,
        sorting: view.sorting,
        first_name: view.first_name,
        middle_name: view.middle_name,
        last_name: view.last_name,
        race: view.race,
        gender: view.gender,
        pronouns: view.pronouns,
        vanid: view.vanid,
        addresses: view.addresses,
        phone_numbers: view.phone_numbers,
        emails: view.emails,
        social_media_accounts: view.social_media_accounts,
        updated_by: userId
      };
      
      const { error } = await supabase
        .from('contact_views')
        .update(updateData)
        .eq('id', view.id);
      
      if (error) {
        console.error("Error updating view:", error);
        toast.error("Error updating view settings");
        return false;
      }
      
      return true;
    } catch (error: any) {
      console.error("Unexpected error updating view:", error);
      toast.error("Error updating view settings");
      return false;
    }
  }, [userId, supabase]);
  
  // Wrap setSelectedView to avoid re-renders with same value
  const handleSetSelectedView = useCallback((view: ContactView | null) => {
    setSelectedView(prev => {
      if (prev?.id === view?.id) return prev;
      return view;
    });
  }, []);
  
  return {
    views,
    selectedView,
    setSelectedView: handleSetSelectedView,
    isLoading,
    error,
    fetchViews,
    
    // View CRUD
    updateViewField,
    createView,
    editView,
    deleteView,
    updateViewInDatabase,
    
    // UI states
    isCreateViewOpen,
    setIsCreateViewOpen,
    newViewName,
    setNewViewName,
    isEditViewOpen,
    setIsEditViewOpen,
    editViewName,
    setEditViewName,
    isDeleteViewOpen,
    setIsDeleteViewOpen,
    isViewSelectorOpen,
    setIsViewSelectorOpen
  };
}