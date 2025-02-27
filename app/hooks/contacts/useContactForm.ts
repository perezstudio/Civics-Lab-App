// app/hooks/contacts/useContactForm.ts
import { useState, useEffect } from 'react';
import { getClientSupabase } from '~/services/supabase';
import { toast } from 'sonner';
import { 
  EmailEntry, 
  PhoneEntry, 
  AddressEntry, 
  SocialMediaEntry, 
  Tag,
  RaceOption,
  GenderOption,
  StateOption,
  ZipCodeOption,
  TagOption,
  STATUS_OPTIONS,
  SOCIAL_MEDIA_SERVICES
} from '~/components/contacts/types';

interface UseContactFormOptions {
  workspaceId: string | null;
  userId: string;
  onSuccess?: () => void;
}

/**
 * Hook for managing contact creation/editing form
 */
export function useContactForm({ 
  workspaceId, 
  userId,
  onSuccess 
}: UseContactFormOptions) {
  // Form state variables
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Reference data
  const [races, setRaces] = useState<RaceOption[]>([]);
  const [genders, setGenders] = useState<GenderOption[]>([]);
  const [states, setStates] = useState<StateOption[]>([]);
  const [zipCodes, setZipCodes] = useState<ZipCodeOption[]>([]);
  const [tags, setTags] = useState<TagOption[]>([]);
  
  // Form field values
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [race, setRace] = useState('');
  const [gender, setGender] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [vanId, setVanId] = useState('');
  const [status, setStatus] = useState(STATUS_OPTIONS[0].value);
  
  // Nested form arrays
  const [emails, setEmails] = useState<EmailEntry[]>([]);
  const [phones, setPhones] = useState<PhoneEntry[]>([]);
  const [addresses, setAddresses] = useState<AddressEntry[]>([]);
  const [socialMedia, setSocialMedia] = useState<SocialMediaEntry[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  
  // Fetch reference data when form is opened
  useEffect(() => {
    if (!isOpen) return;
    
    const fetchReferenceData = async () => {
      try {
        setIsLoading(true);
        const supabase = getClientSupabase();
        
        if (!supabase) {
          console.error('Supabase client not initialized');
          return;
        }
        
        const [
          { data: raceData, error: raceError },
          { data: genderData, error: genderError },
          { data: stateData, error: stateError },
          { data: zipData, error: zipError },
          { data: tagData, error: tagError }
        ] = await Promise.all([
          supabase
            .from('races')
            .select('id, race'),
          supabase
            .from('genders')
            .select('id, gender'),
          supabase
            .from('states')
            .select('id, name, abbreviation'),
          supabase
            .from('zip_codes')
            .select('id, name'),
          supabase
            .from('contact_tags')
            .select('id, tag')
            .eq('workspace_id', workspaceId)
        ]);

        // Check for errors and set data
        if (raceError) console.error('Error fetching races:', raceError);
        else setRaces(raceData || []);
        
        if (genderError) console.error('Error fetching genders:', genderError);
        else setGenders(genderData || []);
        
        if (stateError) console.error('Error fetching states:', stateError);
        else setStates(stateData || []);
        
        if (zipError) console.error('Error fetching zip codes:', zipError);
        else setZipCodes(zipData || []);
        
        if (tagError) console.error('Error fetching tags:', tagError);
        else setTags(tagData || []);
        
      } catch (error) {
        console.error('Error fetching reference data:', error);
        toast.error('Failed to load form data');
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchReferenceData();
  }, [isOpen, workspaceId]);
  
  // Reset form state
  const resetForm = () => {
    setFirstName('');
    setMiddleName('');
    setLastName('');
    setRace('');
    setGender('');
    setPronouns('');
    setVanId('');
    setStatus(STATUS_OPTIONS[0].value);
    setEmails([]);
    setPhones([]);
    setAddresses([]);
    setSocialMedia([]);
    setSelectedTags([]);
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!workspaceId) {
      toast.error('No workspace selected');
      return;
    }
    
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('First name and last name are required');
      return;
    }
    
    try {
      setIsSubmitting(true);
      const supabase = getClientSupabase();
      
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      
      // Create contact object
      const contactData = {
        workspace_id: workspaceId,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        middle_name: middleName.trim() || null,
        race_id: race || null,
        gender_id: gender || null,
        pronouns: pronouns || null,
        vanid: vanId || null,
        status,
        created_by: userId,
        updated_by: userId
      };
      
      // Insert contact
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .insert(contactData)
        .select()
        .single();
        
      if (contactError) {
        throw new Error(`Failed to create contact: ${contactError.message}`);
      }
      
      if (!contact) {
        throw new Error('Contact was not created');
      }
      
      // Process related records in parallel
      await Promise.all([
        // Process emails
        ...(emails.length > 0 
          ? [supabase
              .from('contact_emails')
              .insert(emails.map(email => ({
                contact_id: contact.id,
                email: email.email,
                status: email.status,
                created_by: userId,
                updated_by: userId
              })))]
          : []),
          
        // Process phones
        ...(phones.length > 0 
          ? [supabase
              .from('contact_phones')
              .insert(phones.map(phone => ({
                contact_id: contact.id,
                number: phone.number,
                status: phone.status,
                created_by: userId,
                updated_by: userId
              })))]
          : []),
          
        // Process addresses
        ...(addresses.length > 0 
          ? [supabase
              .from('contact_addresses')
              .insert(addresses.map(address => ({
                contact_id: contact.id,
                street: address.street,
                street2: address.street2,
                city: address.city,
                state_id: address.state,
                zip_code_id: address.zipCode,
                status: address.status,
                created_by: userId,
                updated_by: userId
              })))]
          : []),
          
        // Process social media
        ...(socialMedia.length > 0 
          ? [supabase
              .from('contact_social_media_accounts')
              .insert(socialMedia.map(account => ({
                contact_id: contact.id,
                username: account.username,
                service: account.service,
                status: account.status,
                created_by: userId,
                updated_by: userId
              })))]
          : []),
          
        // Process tags
        ...(selectedTags.length > 0 
          ? [supabase
              .from('contact_tag_assignments')
              .insert(selectedTags.map(tag => ({
                contact_id: contact.id,
                tag_id: tag.id,
                created_by: userId,
              })))]
          : [])
      ]);
      
      // Reset form and close dialog
      resetForm();
      setIsOpen(false);
      
      // Show success message
      toast.success('Contact created successfully');
      
      // Call success callback
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error) {
      console.error('Error creating contact:', error);
      toast.error(error.message || 'Failed to create contact');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Email field helpers
  const addEmail = () => {
    setEmails([...emails, { email: '', status: STATUS_OPTIONS[0].value }]);
  };
  
  const updateEmail = (index: number, data: Partial<EmailEntry>) => {
    const newEmails = [...emails];
    newEmails[index] = { ...newEmails[index], ...data };
    setEmails(newEmails);
  };
  
  const removeEmail = (index: number) => {
    setEmails(emails.filter((_, i) => i !== index));
  };
  
  // Phone field helpers
  const addPhone = () => {
    setPhones([...phones, { number: '', status: STATUS_OPTIONS[0].value }]);
  };
  
  const updatePhone = (index: number, data: Partial<PhoneEntry>) => {
    const newPhones = [...phones];
    newPhones[index] = { ...newPhones[index], ...data };
    setPhones(newPhones);
  };
  
  const removePhone = (index: number) => {
    setPhones(phones.filter((_, i) => i !== index));
  };
  
  // Address field helpers
  const addAddress = () => {
    setAddresses([...addresses, {
      street: '',
      street2: '',
      city: '',
      state: '',
      zipCode: '',
      status: STATUS_OPTIONS[0].value
    }]);
  };
  
  const updateAddress = (index: number, data: Partial<AddressEntry>) => {
    const newAddresses = [...addresses];
    newAddresses[index] = { ...newAddresses[index], ...data };
    setAddresses(newAddresses);
  };
  
  const removeAddress = (index: number) => {
    setAddresses(addresses.filter((_, i) => i !== index));
  };
  
  // Social media field helpers
  const addSocialMedia = () => {
    setSocialMedia([...socialMedia, {
      username: '',
      service: SOCIAL_MEDIA_SERVICES[0],
      status: STATUS_OPTIONS[0].value
    }]);
  };
  
  const updateSocialMedia = (index: number, data: Partial<SocialMediaEntry>) => {
    const newSocialMedia = [...socialMedia];
    newSocialMedia[index] = { ...newSocialMedia[index], ...data };
    setSocialMedia(newSocialMedia);
  };
  
  const removeSocialMedia = (index: number) => {
    setSocialMedia(socialMedia.filter((_, i) => i !== index));
  };
  
  // Tag helpers
  const toggleTag = (tag: Tag) => {
    if (selectedTags.some(t => t.id === tag.id)) {
      setSelectedTags(selectedTags.filter(t => t.id !== tag.id));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };
  
  return {
    // Form state
    isOpen,
    setIsOpen,
    isLoading,
    isSubmitting,
    
    // Reference data
    races,
    genders,
    states,
    zipCodes,
    tags,
    
    // Basic field values and setters
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
  };
}