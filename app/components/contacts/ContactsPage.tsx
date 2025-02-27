// app/components/contacts/ContactsPage.tsx
import { Users, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { ContactViewSelector } from './ContactViewSelector';
import { ContactViewSettings } from './ContactViewSettings';
import { ContactFilters } from './ContactFilters';
import { ContactSortingComponent } from './ContactSorting';
import { ContactsTable } from './ContactsTable';
import { ContactForm } from './ContactForm';
import { ContactDetails } from './ContactDetails';

import { useContactsData } from '~/hooks/contacts/useContactsData';
import { useContactViews } from '~/hooks/contacts/useContactViews';
import { useContactDetails } from '~/hooks/contacts/useContactDetails';
import { useResizableColumns } from '~/hooks/contacts/useResizableColumns';
import { useContactForm } from '~/hooks/contacts/useContactForm';

interface ContactsPageProps {
  userId: string;
  workspaceId: string | null;
  initialLoading?: boolean;
}

export function ContactsPage({
  userId,
  workspaceId,
  initialLoading = false
}: ContactsPageProps) {
  // State for filter/sort UI controls
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortingOpen, setIsSortingOpen] = useState(false);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  
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
    initialContacts: []
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
    initialViews: [],
    onViewChange: (view) => {
      // When view changes, re-apply filters
      applyFilters();
    }
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
  
  // Effect to refresh data when workspace changes
  useEffect(() => {
    if (!workspaceId) return;
    
    fetchViews();
    fetchContacts();
  }, [workspaceId]);
  
  // When a view is selected, refresh contacts
  useEffect(() => {
    if (selectedView) {
      fetchContacts();
    }
  }, [selectedView]);
  
  // Handlers
  const handleCreateContact = () => {
    setIsFormOpen(true);
  };
  
  const handleViewContact = (contact) => {
    openDetails(contact);
  };
  
  const handleDeleteContact = async (contactId) => {
    await deleteContact(contactId);
    fetchContacts();
  };
  
  const handleCreateView = async (name) => {
    await createView(name);
    fetchViews();
  };
  
  const handleUpdateViewField = async (field, value) => {
    await updateViewField(field, value);
  };
  
  const handleEditView = async (name) => {
    await editView(name);
  };
  
  const handleDeleteView = async () => {
    await deleteView();
  };
  
  // Determine loading state
  const isLoading = initialLoading || contactsLoading || viewsLoading;
  
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
          {/* Filters */}
          <ContactFilters 
            selectedView={selectedView}
            setSelectedView={setSelectedView}
            updateViewInDatabase={updateViewInDatabase}
            isFilterOpen={isFilterOpen}
            setIsFilterOpen={setIsFilterOpen}
          />
          
          {/* Sorting */}
          <ContactSortingComponent 
            selectedView={selectedView}
            setSelectedView={setSelectedView}
            updateViewInDatabase={updateViewInDatabase}
            isSortingOpen={isSortingOpen}
            setIsSortingOpen={setIsSortingOpen}
          />
        </div>
        
        {/* Search */}
        <Input
          className="w-64"
          placeholder="Search contacts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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