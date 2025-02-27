// app/hooks/contacts/useContactViews.ts
import { useState, useEffect, useCallback } from 'react';
import { getClientSupabase } from '~/services/supabase';
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

  // Fetch views when workspace changes
  useEffect(() => {
    if (workspaceId) {
      fetchViews();
    }
  }, [workspaceId]);

  // Fetch views from the database
  const fetchViews = async () => {
    const supabase = getClientSupabase();
    if (!supabase || !workspaceId) {
      console.error('Supabase client not initialized or workspace not selected');
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
        return;
      }
      
      if (data) {
        setViews(data);
        if (!selectedView && data.length > 0) {
          setSelectedView(data[0]);
        }
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error in fetchViews:", error);
      toast.error("Error loading views");
      setIsLoading(false);
    }
  };

  // Update view field visibility
  const updateViewField = async (field: keyof ContactView, value: boolean) => {
    const supabase = getClientSupabase();
    if (!supabase || !selectedView) return;

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
    } catch (error) {
      console.error("Unexpected error updating view:", error);
      toast.error("Error updating view");
    }
  };

  // Create a new view
  const createView = async (viewName: string) => {
    const supabase = getClientSupabase();
    if (!supabase || !workspaceId || !viewName.trim() || !userId) {
      return;
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
        return;
      }

      await fetchViews();
      setNewViewName('');
      setIsCreateViewOpen(false);
      
      // If views were empty, select the new view
      if (insertedView && insertedView.length > 0 && views.length === 0) {
        setSelectedView(insertedView[0]);
      }
      
      toast.success("View created successfully");
      return insertedView?.[0];
    } catch (error) {
      console.error("Unexpected error creating view:", error);
      toast.error("Error creating view");
      return null;
    }
  };
  
  // Edit an existing view
  const editView = async (viewName: string) => {
    const supabase = getClientSupabase();
    if (!supabase || !selectedView || !viewName.trim()) return;
  
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
    } catch (error) {
      console.error("Unexpected error updating view:", error);
      toast.error("Error updating view");
    }
  };
  
  // Delete a view
  const deleteView = async () => {
    const supabase = getClientSupabase();
    if (!supabase || !selectedView) return;
  
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
    } catch (error) {
      console.error("Unexpected error deleting view:", error);
      toast.error("Error deleting view");
    }
  };
  
  // Update view in database
  const updateViewInDatabase = async (view: ContactView) => {
    const supabase = getClientSupabase();
    if (!supabase) return;
    
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
    } catch (error) {
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