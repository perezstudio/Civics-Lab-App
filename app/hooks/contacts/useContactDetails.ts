// app/hooks/contacts/useContactDetails.ts
import { useState } from 'react';
import { useAuth } from '~/contexts/AuthContext';
import { toast } from 'sonner';
import { Contact } from '~/components/contacts/types';

interface UseContactDetailsOptions {
  onEdit?: (contact: Contact) => void;
}

/**
 * Hook for managing the contact details view
 */
export function useContactDetails({ onEdit }: UseContactDetailsOptions = {}) {
  // Get Supabase client from auth context
  const { supabase } = useAuth();
  
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Open details view for a contact
  const openDetails = (contact: Contact) => {
    setSelectedContact(contact);
    setIsOpen(true);
    
    // If the contact has an ID but might not have all details loaded,
    // fetch the full details
    if (contact?.id && (!contact.emails || !contact.phones)) {
      fetchFullDetails(contact.id);
    }
  };
  
  // Close details view
  const closeDetails = () => {
    setIsOpen(false);
    // We keep the selected contact briefly in case it needs to be
    // re-opened, then clear it after the animation finishes
    setTimeout(() => {
      setSelectedContact(null);
    }, 300);
  };
  
  // Handle edit action
  const handleEdit = () => {
    if (selectedContact && onEdit) {
      onEdit(selectedContact);
    }
  };
  
  // Fetch full contact details if needed
  const fetchFullDetails = async (contactId: string) => {
    if (!contactId || !supabase) return;
    
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('contacts')
        .select(`
          *,
          race:race_id(id, race),
          gender:gender_id(id, gender),
          emails:contact_emails(*),
          phones:contact_phones(*),
          addresses:contact_addresses(
            *,
            state:state_id(id, name, abbreviation),
            zip:zip_code_id(id, name)
          ),
          social_media:contact_social_media_accounts(*),
          tags:contact_tag_assignments(
            id,
            tag:tag_id(id, tag)
          )
        `)
        .eq('id', contactId)
        .single();
        
      if (error) {
        throw new Error(`Failed to fetch contact details: ${error.message}`);
      }
      
      if (data) {
        setSelectedContact(data);
      }
      
    } catch (error) {
      console.error('Error fetching contact details:', error);
      toast.error(error.message || 'Failed to load contact details');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Delete a contact
  const deleteContact = async (contactId: string) => {
    if (!contactId || !supabase) return;
    
    try {
      setIsLoading(true);
      
      // Delete contact - cascade should handle related records
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId);
        
      if (error) {
        throw new Error(`Failed to delete contact: ${error.message}`);
      }
      
      toast.success('Contact deleted successfully');
      closeDetails();
      
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error(error.message || 'Failed to delete contact');
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    selectedContact,
    isOpen,
    isLoading,
    openDetails,
    closeDetails,
    handleEdit,
    fetchFullDetails,
    deleteContact
  };
}