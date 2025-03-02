// app/hooks/contacts/useContactsData.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '~/contexts/AuthContext';
import { toast } from 'sonner';
import { Contact, ContactView } from '~/components/contacts/types';

interface UseContactsDataOptions {
  workspaceId: string | null;
  initialContacts?: Contact[];
}

/**
 * Hook for managing contacts data, including fetching, filtering, and sorting
 */
export function useContactsData({ 
  workspaceId, 
  initialContacts = [] 
}: UseContactsDataOptions) {
  // Get Supabase client from auth context
  const { supabase } = useAuth();
  
  // Mounted ref to prevent state updates after unmount
  const isMounted = useRef(true);
  
  // State hooks
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>(initialContacts);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Initialize with initialContacts
  useEffect(() => {
    if (initialContacts.length > 0) {
      setContacts(initialContacts);
      setFilteredContacts(initialContacts);
    }
  }, [initialContacts]);
  
  // Get a contact by ID from the local state
  const getContactById = useCallback((id: string | null): Contact | null => {
    if (!id) return null;
    return contacts.find(contact => contact.id === id) || null;
  }, [contacts]);

  // Selected contact based on ID
  const selectedContact = getContactById(selectedContactId);
  
  // Helper function to get nested values (for arrays like emails, phones, etc.)
  const getNestedValue = useCallback((obj: any, path: string): any => {
    if (!path) return undefined;
    if (!obj) return '';
    
    // Handle special cases for arrays
    if (path === 'emails') {
      return obj.emails?.map((e: any) => e.email).join(', ') || '';
    } else if (path === 'phone_numbers') {
      return obj.phones?.map((p: any) => p.number).join(', ') || '';
    } else if (path === 'addresses') {
      return obj.addresses?.map((a: any) => `${a.street_address}, ${a.city || ''}`).join('; ') || '';
    } else if (path === 'social_media_accounts') {
      return obj.social_media?.map((s: any) => `${s.service_type}: ${s.username}`).join('; ') || '';
    } else if (path === 'race') {
      return obj.race?.race || '';
    } else if (path === 'gender') {
      return obj.gender?.gender || '';
    }
    
    // For regular fields
    return obj[path] || '';
  }, []);

  // Apply filters and sorting to contacts
  const applyFilters = useCallback((
    contactsToFilter = contacts,
    query = searchQuery,
    view?: ContactView | null
  ) => {
    if (!contactsToFilter || contactsToFilter.length === 0) {
      setFilteredContacts([]);
      return;
    }
    
    // Start with search query filter
    let filtered = contactsToFilter.filter(contact => {
      if (!query) return true;
      const searchLower = query.toLowerCase();
      return (
        (contact.first_name && contact.first_name.toLowerCase().includes(searchLower)) ||
        (contact.last_name && contact.last_name.toLowerCase().includes(searchLower)) ||
        (contact.middle_name && contact.middle_name.toLowerCase().includes(searchLower)) ||
        (contact.vanid && contact.vanid.toLowerCase().includes(searchLower))
      );
    });
    
    const activeView = view || null;
    
    // Apply view filters if they exist
    if (activeView?.filters && activeView.filters.length > 0) {
      filtered = filtered.filter(contact => {
        // Return true only if all filters match
        return activeView.filters.every(filter => {
          if (!filter.field || !filter.operator || filter.value === undefined) {
            return true; // Skip incomplete filters
          }
          
          const fieldValue = getNestedValue(contact, filter.field);
          
          // Handle different operators
          switch (filter.operator) {
            case 'equals':
              return String(fieldValue).toLowerCase() === filter.value.toLowerCase();
            case 'contains':
              return String(fieldValue).toLowerCase().includes(filter.value.toLowerCase());
            case 'starts_with':
              return String(fieldValue).toLowerCase().startsWith(filter.value.toLowerCase());
            case 'ends_with':
              return String(fieldValue).toLowerCase().endsWith(filter.value.toLowerCase());
            case 'greater_than':
              return Number(fieldValue) > Number(filter.value);
            case 'less_than':
              return Number(fieldValue) < Number(filter.value);
            default:
              return true;
          }
        });
      });
    }
    
    // Apply sorting if it exists
    if (activeView?.sorting && activeView.sorting.length > 0) {
      filtered = [...filtered].sort((a, b) => {
        for (const sort of activeView.sorting) {
          if (!sort.field) continue;
          
          const aValue = getNestedValue(a, sort.field);
          const bValue = getNestedValue(b, sort.field);
          
          if (aValue === bValue) continue;
          
          const direction = sort.direction === 'asc' ? 1 : -1;
          
          if (typeof aValue === 'number' && typeof bValue === 'number') {
            return (aValue - bValue) * direction;
          }
          
          return String(aValue).localeCompare(String(bValue)) * direction;
        }
        
        return 0;
      });
    }
    
    setFilteredContacts(filtered);
  }, [contacts, searchQuery, getNestedValue]);

  // Update filters when search query changes
  useEffect(() => {
    applyFilters();
  }, [searchQuery, applyFilters]);

  // Fetch contacts from the database with better error handling
  const fetchContacts = useCallback(async () => {
    // Reset errors
    setError(null);
    
    if (!workspaceId) {
      console.log('No workspace selected, skipping fetch');
      return;
    }
    
    // Check if Supabase client is initialized
    if (!supabase) {
      // If we've already tried multiple times, just set an error
      if (retryCount >= 3) {
        if (isMounted.current) {
          setError('Supabase client not initialized after multiple attempts');
        }
        return;
      }
      
      // Wait and retry
      const retryDelay = 500; // 500ms
      console.log(`Supabase client not initialized, retrying in ${retryDelay}ms...`);
      
      setTimeout(() => {
        if (isMounted.current) {
          setRetryCount(prev => prev + 1);
          fetchContacts();
        }
      }, retryDelay);
      
      return;
    }
    
    if (isMounted.current) {
      setIsLoading(true);
    }
    
    try {
      // Fetch contacts with related data
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select(`
          *,
          race:race_id(id, race),
          gender:gender_id(id, gender),
          emails:contact_emails(*),
          phones:contact_phones(*),
          addresses:contact_addresses(*),
          social_media:contact_social_media_accounts(*)
        `)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (contactsError) {
        console.error('Error fetching contacts:', contactsError);
        
        if (isMounted.current) {
          toast.error("Error loading contacts");
          setError(`Error fetching contacts: ${contactsError.message}`);
        }
        return;
      }

      if (isMounted.current) {
        setContacts(contactsData || []);
        applyFilters(contactsData || [], searchQuery);
      }
    } catch (error) {
      console.error('Exception fetching contacts:', error);
      
      if (isMounted.current) {
        toast.error("Error loading contacts");
        setError(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [workspaceId, searchQuery, applyFilters, retryCount, supabase]);
  
  return {
    contacts,
    filteredContacts,
    isLoading,
    searchQuery,
    setSearchQuery,
    selectedContact,
    setSelectedContactId,
    error,
    fetchContacts,
    applyFilters
  };
}