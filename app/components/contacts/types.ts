// app/components/contacts/types.ts
import type { Database } from '~/types/supabase';

// Type aliases for database enums
export type ContactStatus = Database['public']['Enums']['contact_status'];
export type ContactEmailStatus = Database['public']['Enums']['contact_email_status'];
export type ContactPhoneStatus = Database['public']['Enums']['contact_phone_status'];
export type ContactAddressStatus = Database['public']['Enums']['contact_address_status'];
export type SocialMediaService = Database['public']['Enums']['social_media_service'];
export type SocialMediaStatus = Database['public']['Enums']['social_media_status'];
export type WorkspaceRole = Database['public']['Enums']['workspace_role'];

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

export interface ContactEmail {
    id?: string;
    contact_id: string;
    email: string;
    status: ContactEmailStatus;
    created_by?: string;
    updated_by?: string;
    created_at?: string;
    updated_at?: string;
}

export interface ContactPhone {
    id?: string;
    contact_id: string;
    number: string;
    status: ContactPhoneStatus;
    created_by?: string;
    updated_by?: string;
    created_at?: string;
    updated_at?: string;
}

export interface ContactAddress {
    id?: string;
    contact_id: string;
    street_address: string;
    secondary_street_address?: string | null;
    city?: string;
    state_id?: string | null;
    zip_code_id?: string | null;
    status: ContactAddressStatus;
    type?: string;
    created_by?: string;
    updated_by?: string;
    created_at?: string;
    updated_at?: string;
    
    // For UI convenience - joined data
    state?: { id: string; name: string; abbreviation: string } | null;
    zip?: { id: string; name: string } | null;
}

export interface ContactSocialMedia {
    id?: string;
    contact_id: string;
    username: string;
    service_type: SocialMediaService;
    status: SocialMediaStatus;
    created_by?: string;
    updated_by?: string;
    created_at?: string;
    updated_at?: string;
}

export interface ContactTag {
    id: string;
    tag?: { id: string; tag: string } | null;
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
    created_by?: string;
    updated_by?: string;
    created_at?: string;
    updated_at?: string;
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
    status: ContactEmailStatus;
}

export interface PhoneEntry {
    number: string;
    status: ContactPhoneStatus;
}

export interface AddressEntry {
    street: string;
    street2: string;
    city: string;
    state: string;
    zipCode: string;
    status: ContactAddressStatus;
}

export interface SocialMediaEntry {
    username: string;
    service: SocialMediaService;
    status: SocialMediaStatus;
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
    { value: 'active' as ContactStatus, label: 'Active' },
    { value: 'inactive' as ContactStatus, label: 'Inactive' },
    { value: 'deceased' as ContactStatus, label: 'Deceased' },
    { value: 'moved' as ContactStatus, label: 'Moved' }
];

export const EMAIL_STATUS_OPTIONS = [
    { value: 'active' as ContactEmailStatus, label: 'Active' },
    { value: 'inactive' as ContactEmailStatus, label: 'Inactive' },
    { value: 'bounced' as ContactEmailStatus, label: 'Bounced' },
    { value: 'unsubscribed' as ContactEmailStatus, label: 'Unsubscribed' }
];

export const PHONE_STATUS_OPTIONS = [
    { value: 'active' as ContactPhoneStatus, label: 'Active' },
    { value: 'inactive' as ContactPhoneStatus, label: 'Inactive' },
    { value: 'wrong number' as ContactPhoneStatus, label: 'Wrong Number' },
    { value: 'disconnected' as ContactPhoneStatus, label: 'Disconnected' }
];

export const ADDRESS_STATUS_OPTIONS = [
    { value: 'active' as ContactAddressStatus, label: 'Active' },
    { value: 'inactive' as ContactAddressStatus, label: 'Inactive' },
    { value: 'moved' as ContactAddressStatus, label: 'Moved' },
    { value: 'wrong address' as ContactAddressStatus, label: 'Wrong Address' }
];

export const SOCIAL_MEDIA_SERVICES = [
    'facebook' as SocialMediaService, 
    'twitter' as SocialMediaService,
    'bluesky' as SocialMediaService,
    'tiktok' as SocialMediaService,
    'instagram' as SocialMediaService,
    'threads' as SocialMediaService,
    'youtube' as SocialMediaService
];

export const SOCIAL_MEDIA_STATUS_OPTIONS = [
    { value: 'active' as SocialMediaStatus, label: 'Active' },
    { value: 'inactive' as SocialMediaStatus, label: 'Inactive' },
    { value: 'blocked' as SocialMediaStatus, label: 'Blocked' },
    { value: 'deleted' as SocialMediaStatus, label: 'Deleted' }
];

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

// Permissions and roles based on workspace roles
export const rolePermissions = {
    'Super Admin': { canCreate: true, canRead: true, canUpdate: true, canDelete: true },
    'Admin': { canCreate: true, canRead: true, canUpdate: true, canDelete: true },
    'Basic User': { canCreate: true, canRead: true, canUpdate: true, canDelete: true },
    'Volunteer': { canCreate: false, canRead: true, canUpdate: false, canDelete: false }
} as const;

// Helper functions
export function formatFieldName(field: string): string {
    return field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}