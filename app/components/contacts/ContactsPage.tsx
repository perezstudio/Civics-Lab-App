// app/components/contacts/ContactsPage.tsx
import { Users, UserPlus } from 'lucide-react';
import { useEffect, useState, useCallback, useRef } from 'react';
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { ContactViewSelector } from './ContactViewSelector';
import { ContactViewSettings } from './ContactViewSettings';
import { ContactFilters } from './ContactFilters';
import { ContactSortingComponent } from './ContactSorting';
import { ContactsTable } from './ContactsTable';
import { ContactForm } from './ContactForm';
import { ContactDetails } from './ContactDetails';
import { toast } from 'sonner';

import { useContactsData } from '~/hooks/contacts/useContactsData';
import { useContactViews } from '~/hooks/contacts/useContactViews';
import { useContactDetails } from '~/hooks/contacts/useContactDetails';
import { useResizableColumns } from '~/hooks/contacts/useResizableColumns';
import { useContactForm } from '~/hooks/contacts/useContactForm';
import { ContactView } from '~/components/contacts/types';

// Utility debounce hook
function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
}

interface ContactsPageProps {
  userId: string;
  workspaceId: string | null;
  initialLoading?: boolean;
  initialViews?: any[];
  initialContacts?: any[];
}

export function ContactsPage({
  userId,
  workspaceId,
  initialLoading = false,
  initialViews = [],
  initialContacts = []
}: ContactsPageProps) {
  // Reference to track component mount state
  const isMounted = useRef(true);
  
  // State for filter/sort UI controls
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortingOpen, setIsSortingOpen] = useState(false);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  
  // Debug loading
  const [isComponentMounted, setIsComponentMounted] = useState(false);
  
  // Initialize columns resizing hook
  const { 
    columnWidths, 
    handleResizeStart, 
    resizing 
  } = useResizableColumns({
    checkbox: 40,
    first_name: 200,
    middle_name: 150,
    last_name: 200,
    race: 150,
    gender: 150,
    pronouns: 150,
    vanid: 150,
    emails: 200,
    phone_numbers: 200,
    addresses: 250,
    social_media_accounts: 200,
    actions: 100
  });
  
  // Initialize views management hook
  const {
    views,
    selectedView,
    setSelectedView,
    isLoading: viewsLoading,
    updateViewField,
    fetchViews,
    createView,
    editView,
    deleteView,
    updateViewInDatabase
  } = useContactViews({
    workspaceId,
    userId,
    initialViews: initialViews,
    onViewChange: (view) => {
      // When view changes, re-apply filters
      if (view) {
        applyFilters(undefined, undefined, view);
      }
    }
  });
  
  // Create a debounced version of updateViewInDatabase to prevent excessive updates
  const debouncedUpdateView = useDebounce(async (view: ContactView) => {
    if (!view) return;
    await updateViewInDatabase(view);
  }, 500); // 500ms debounce delay
  
  // Initialize contacts data hook
  const {
    contacts,
    filteredContacts,
    searchQuery,
    setSearchQuery,
    isLoading: contactsLoading,
    fetchContacts,
    applyFilters
  } = useContactsData({
    workspaceId,
    initialContacts
  });
  
  // Initialize contact details hook
  const {
    selectedContact: selectedContactForDetails,
    isOpen: isDetailsOpen,
    isLoading: isDetailsLoading,
    openDetails,
    closeDetails,
    handleEdit,
    deleteContact
  } = useContactDetails();
  
  // Initialize contact form hook
  const {
    isOpen: isFormOpen,
    setIsOpen: setIsFormOpen,
    isLoading: isFormLoading,
    isSubmitting: isFormSubmitting,
    
    // Reference data
    races,
    genders,
    states,
    zipCodes,
    tags,
    
    // Basic field values
    firstName,
    setFirstName,
    middleName,
    setMiddleName,
    lastName,
    setLastName,
    race,
    setRace,
    gender,
    setGender,
    pronouns,
    setPronouns,
    vanId,
    setVanId,
    status,
    setStatus,
    
    // Array field values
    emails,
    phones,
    addresses,
    socialMedia,
    selectedTags,
    
    // Array field helpers
    addEmail,
    updateEmail,
    removeEmail,
    addPhone,
    updatePhone,
    removePhone,
    addAddress,
    updateAddress,
    removeAddress,
    addSocialMedia,
    updateSocialMedia,
    removeSocialMedia,
    toggleTag,
    
    // Form actions
    resetForm,
    handleSubmit
  } = useContactForm({
    workspaceId,
    userId,
    onSuccess: () => {
      // On successful form submission, refresh contacts
      fetchContacts();
    }
  });
  
  // Effect to mark component as mounted for debugging
  useEffect(() => {
    setIsComponentMounted(true);
    
    // Cleanup on unmount
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Effect to refresh data when workspace changes
  useEffect(() => {
    if (!workspaceId || !isMounted.current) {
      return;
    }
    
    // If initial data is already provided, use it
    if (initialViews.length === 0) {
      fetchViews();
    }
    
    if (initialContacts.length === 0) {
      fetchContacts();
    }
  }, [workspaceId, initialViews.length, initialContacts.length, fetchViews, fetchContacts]);
  
  // Handlers - wrapped with useCallback to maintain reference stability
  const handleCreateContact = useCallback(() => {
    setIsFormOpen(true);
  }, [setIsFormOpen]);
  
  const handleViewContact = useCallback((contact) => {
    openDetails(contact);
  }, [openDetails]);
  
  const handleDeleteContact = useCallback(async (contactId) => {
    await deleteContact(contactId);
    if (isMounted.current) {
      fetchContacts();
    }
  }, [deleteContact, fetchContacts]);
  
  const handleCreateView = useCallback(async (name) => {
    await createView(name);
  }, [createView]);
  
  const handleUpdateViewField = useCallback(async (field, value) => {
    await updateViewField(field, value);
  }, [updateViewField]);
  
  const handleEditView = useCallback(async (name) => {
    await editView(name);
  }, [editView]);
  
  const handleDeleteView = useCallback(async () => {
    await deleteView();
  }, [deleteView]);
  
  // Handle search input changes with debounce to prevent excessive updates
  const handleSearchChange = useDebounce((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, 300);
  
  // Determine loading state
  const isLoading = initialLoading || contactsLoading || viewsLoading || !isComponentMounted;
  
  return (
    <div className="h-screen overflow-auto">
      {/* Navbar */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6" />
          <h1 className="text-xl font-semibold">Contacts</h1>
        </div>
        
        <div className="flex items-center gap-2">
          {/* View Selector */}
          <ContactViewSelector 
            views={views}
            selectedView={selectedView}
            onViewSelect={setSelectedView}
            onCreateView={handleCreateView}
            onRefreshViews={fetchViews}
          />
          
          {/* View Settings */}
          <ContactViewSettings 
            selectedView={selectedView}
            onUpdateViewField={handleUpdateViewField}
            onEditView={handleEditView}
            onDeleteView={handleDeleteView}
          />
          
          {/* Create Contact Button */}
          <Button onClick={handleCreateContact} variant="default">
            <UserPlus className="w-4 h-4 mr-2" />
            Create Contact
          </Button>
        </div>
      </div>
      
      {/* Filter & Sort Bar */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex gap-2">
          {/* Filters - Using debounced update */}
          {selectedView && (
            <ContactFilters 
              selectedView={selectedView}
              setSelectedView={setSelectedView}
              updateViewInDatabase={debouncedUpdateView}
              isFilterOpen={isFilterOpen}
              setIsFilterOpen={setIsFilterOpen}
            />
          )}
          
          {/* Sorting - Using debounced update */}
          {selectedView && (
            <ContactSortingComponent 
              selectedView={selectedView}
              setSelectedView={setSelectedView}
              updateViewInDatabase={debouncedUpdateView}
              isSortingOpen={isSortingOpen}
              setIsSortingOpen={setIsSortingOpen}
            />
          )}
        </div>
        
        {/* Search */}
        <Input
          className="w-64"
          placeholder="Search contacts..."
          defaultValue={searchQuery}
          onChange={handleSearchChange}
        />
      </div>
      
      {/* Data Grid */}
      <div className="flex-1 overflow-auto">
        <ContactsTable 
          contacts={filteredContacts}
          selectedView={selectedView}
          columnWidths={columnWidths}
          handleResizeStart={handleResizeStart}
          resizing={resizing}
          onViewDetails={handleViewContact}
          isLoading={isLoading}
        />
      </div>
      
      {/* Contact Details Sheet */}
      <ContactDetails 
        contact={selectedContactForDetails}
        isOpen={isDetailsOpen}
        onOpenChange={closeDetails}
        onEdit={handleEdit}
        onDelete={handleDeleteContact}
        isLoading={isDetailsLoading}
      />
      
      {/* Contact Form Dialog */}
      <ContactForm 
        userId={userId}
        workspaceId={workspaceId}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={fetchContacts}
        
        // Props from useContactForm
        isLoading={isFormLoading}
        isSubmitting={isFormSubmitting}
        races={races}
        genders={genders}
        states={states}
        zipCodes={zipCodes}
        tags={tags}
        firstName={firstName}
        setFirstName={setFirstName}
        middleName={middleName}
        setMiddleName={setMiddleName}
        lastName={lastName}
        setLastName={setLastName}
        race={race}
        setRace={setRace}
        gender={gender}
        setGender={setGender}
        pronouns={pronouns}
        setPronouns={setPronouns}
        vanId={vanId}
        setVanId={setVanId}
        status={status}
        setStatus={setStatus}
        emails={emails}
        phones={phones}
        addresses={addresses}
        socialMedia={socialMedia}
        selectedTags={selectedTags}
        addEmail={addEmail}
        updateEmail={updateEmail}
        removeEmail={removeEmail}
        addPhone={addPhone}
        updatePhone={updatePhone}
        removePhone={removePhone}
        addAddress={addAddress}
        updateAddress={updateAddress}
        removeAddress={removeAddress}
        addSocialMedia={addSocialMedia}
        updateSocialMedia={updateSocialMedia}
        removeSocialMedia={removeSocialMedia}
        toggleTag={toggleTag}
        resetForm={resetForm}
        handleSubmit={handleSubmit}
      />
    </div>
  );
}