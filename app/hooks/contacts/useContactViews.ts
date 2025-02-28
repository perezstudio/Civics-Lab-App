// app/hooks/contacts/useContactViews.ts
import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient, isClientInitialized } from '~/services/auth.client';
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
  
  // Fetch views when workspace changes
  useEffect(() => {
    if (workspaceId) {
      fetchViews();
    }
  }, [workspaceId]);

  // Fetch views from the database with better error handling
  const fetchViews = async () => {
    // Reset any previous errors
    setError(null);
    
    if (!workspaceId) {
      console.log('No workspace selected, skipping fetch');
      return;
    }
    
    // Check if Supabase client is initialized
    if (!isClientInitialized()) {
      const retryDelay = 500; // 500ms
      console.log(`Supabase client not initialized, retrying in ${retryDelay}ms...`);
      
      // Wait and retry once
      setTimeout(() => {
        if (isClientInitialized()) {
          fetchViews();
        } else {
          setError('Supabase client not initialized');
          console.warn('Supabase client still not initialized after retry');
        }
      }, retryDelay);
      
      return;
    }
    
    const supabase = getSupabaseClient();
    if (!supabase) {
      setError('Supabase client not initialized or workspace not selected');
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
  };

  // Update view field visibility
  const updateViewField = async (field: keyof ContactView, value: boolean) => {
    if (!selectedView) return;
    
    const supabase = getSupabaseClient();
    if (!supabase) {
      toast.error("Cannot update view: Client not initialized");
      return;
    }

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
      setSelectedView({
        ...selectedView,
        [field]: value
      });

      // Refresh views from server
      await fetchViews();
      
      toast.success("View updated");
    } catch (error: any) {
      console.error("Unexpected error updating view:", error);
      toast.error("Error updating view");
    }
  };

  // Create a new view
  const createView = async (viewName: string) => {
    if (!viewName.trim() || !workspaceId || !userId) {
      return null;
    }
    
    const supabase = getSupabaseClient();
    if (!supabase) {
      toast.error("Cannot create view: Client not initialized");
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
  };
  
  // Edit an existing view
  const editView = async (viewName: string) => {
    if (!selectedView || !viewName.trim()) return;
    
    const supabase = getSupabaseClient();
    if (!supabase) {
      toast.error("Cannot update view: Client not initialized");
      return;
    }
  
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
      setSelectedView({ ...selectedView, view_name: viewName.trim() });
      setViews(views.map(view => 
        view.id === selectedView.id 
          ? { ...view, view_name: viewName.trim() }
          : view
      ));
  
      await fetchViews();
      setEditViewName('');
      setIsEditViewOpen(false);
      toast.success("View updated successfully");
    } catch (error: any) {
      console.error("Unexpected error updating view:", error);
      toast.error("Error updating view");
    }
  };
  
  // Delete a view
  const deleteView = async () => {
    if (!selectedView) return;
    
    const supabase = getSupabaseClient();
    if (!supabase) {
      toast.error("Cannot delete view: Client not initialized");
      return;
    }
  
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
  
      await fetchViews();
      
      // Set the first view as selected after deletion
      if (views.length > 1) {
        const nextView = views.find(view => view.id !== selectedView.id);
        setSelectedView(nextView || null);
      } else {
        setSelectedView(null);
      }
      
      setIsDeleteViewOpen(false);
      toast.success("View deleted successfully");
    } catch (error: any) {
      console.error("Unexpected error deleting view:", error);
      toast.error("Error deleting view");
    }
  };
  
  // Update view in database
  const updateViewInDatabase = async (view: ContactView) => {
    const supabase = getSupabaseClient();
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
  };
  
  return {
    views,
    selectedView,
    setSelectedView,
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