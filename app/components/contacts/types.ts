// app/components/contacts/types.ts

// Base types for contact data
export interface Contact {
    id: string;
    first_name: string;
    last_name: string;
    middle_name?: string | null;
    race_id?: string | null;
    gender_id?: string | null;
    pronouns?: string | null;
    vanid?: string | null;
    status: ContactStatus;
    created_by: string;
    updated_by: string;
    created_at?: string;
    updated_at?: string;
    workspace_id: string;
    
    // Joined relations
    race?: { id: string; race: string } | null;
    gender?: { id: string; gender: string } | null;
    emails?: ContactEmail[];
    phones?: ContactPhone[];
    addresses?: ContactAddress[];
    social_media?: ContactSocialMedia[];
    tags?: ContactTag[];
    
    // Additional properties can be added
    [key: string]: any;
  }
  
  export type ContactStatus = 'active' | 'inactive' | 'archived';
  
  export interface ContactEmail {
    id?: string;
    contact_id: string;
    email: string;
    status: ContactStatus;
    created_by?: string;
    updated_by?: string;
  }
  
  export interface ContactPhone {
    id?: string;
    contact_id: string;
    number: string;
    status: ContactStatus;
    created_by?: string;
    updated_by?: string;
  }
  
  export interface ContactAddress {
    id?: string;
    contact_id: string;
    street: string;
    street2?: string;
    city?: string;
    state_id?: string | null;
    zip_code_id?: string | null;
    status: ContactStatus;
    type?: string;
    created_by?: string;
    updated_by?: string;
    
    // Additional address properties
    state?: string;
    zip?: string;
  }
  
  export interface ContactSocialMedia {
    id?: string;
    contact_id: string;
    username: string;
    service: string;
    status: ContactStatus;
    created_by?: string;
    updated_by?: string;
  }
  
  export interface ContactTag {
    id: string;
    tag: string;
  }
  
  // Contact view and filtering
  export interface ContactView {
    id: string;
    view_name: string;
    workspace_id: string;
    first_name: boolean;
    middle_name: boolean;
    last_name: boolean;
    race: boolean;
    gender: boolean;
    pronouns: boolean;
    vanid: boolean;
    addresses: boolean;
    phone_numbers: boolean;
    emails: boolean;
    social_media_accounts: boolean;
    filters: ContactFilter[];
    sorting: ContactSorting[];
  }
  
  export interface ContactFilter {
    field: string;
    operator: FilterOperator;
    value: string;
  }
  
  export type FilterOperator = 
    | 'equals' 
    | 'contains' 
    | 'starts_with' 
    | 'ends_with' 
    | 'greater_than' 
    | 'less_than';
  
  export interface ContactSorting {
    field: string;
    direction: 'asc' | 'desc';
  }
  
  // Form input types
  export interface EmailEntry {
    email: string;
    status: ContactStatus;
  }
  
  export interface PhoneEntry {
    number: string;
    status: ContactStatus;
  }
  
  export interface AddressEntry {
    street: string;
    street2: string;
    city: string;
    state: string;
    zipCode: string;
    status: ContactStatus;
  }
  
  export interface SocialMediaEntry {
    username: string;
    service: string;
    status: ContactStatus;
  }
  
  // Reference data types
  export interface RaceOption {
    id: string;
    race: string;
  }
  
  export interface GenderOption {
    id: string;
    gender: string;
  }
  
  export interface StateOption {
    id: string;
    name: string;
    abbreviation: string;
  }
  
  export interface ZipCodeOption {
    id: string;
    name: string;
  }
  
  export interface TagOption {
    id: string;
    tag: string;
  }
  
  // Constants and options
  export const STATUS_OPTIONS = [
    { value: 'active' as const, label: 'Active' },
    { value: 'inactive' as const, label: 'Inactive' },
    { value: 'archived' as const, label: 'Archived' }
  ] as const;
  
  export const SOCIAL_MEDIA_SERVICES = [
    'Facebook', 
    'Twitter', 
    'Instagram', 
    'LinkedIn', 
    'TikTok'
  ] as const;
  
  // Contact view fields that can be displayed
  export const VIEW_FIELDS = [
    'first_name',
    'middle_name',
    'last_name',
    'race',
    'gender',
    'pronouns',
    'vanid',
    'addresses',
    'phone_numbers',
    'emails',
    'social_media_accounts'
  ] as const;
  
  export type ViewField = typeof VIEW_FIELDS[number];
  
  // Permissions and roles
  export type WorkspaceRole = 'Super Admin' | 'Admin' | 'Basic User' | 'Volunteer';
  
  export const rolePermissions = {
    'Super Admin': { canCreate: true, canRead: true, canUpdate: true, canDelete: true },
    'Admin': { canCreate: true, canRead: true, canUpdate: true, canDelete: true },
    'Basic User': { canCreate: true, canRead: true, canUpdate: true, canDelete: true },
    'Volunteer': { canCreate: false, canRead: true, canUpdate: false, canDelete: false }
  };
  
  // Helper functions
  export function formatFieldName(field: string): string {
    return field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }