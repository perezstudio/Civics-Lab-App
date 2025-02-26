// app/routes/_auth.engage.contacts.tsx
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Users, Plus } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { AuthService } from '~/services/auth.server';
import { ApiService } from '~/services/api.server';
import { sessionStorage } from '~/services/supabase.server';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "~/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "~/components/ui/command";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Checkbox } from "~/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Separator } from "~/components/ui/separator";
import { Badge } from "~/components/ui/badge";
import { AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle } from "~/components/ui/alert-dialog";
import { Trash2, Edit, Cog, Plus, X, UserPlus } from "lucide-react";

// Utility function for conditional classnames
function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

// Types
interface Contact {
  id: string;
  [key: string]: any;
}

interface ContactView {
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
  filters: {
    field: string;
    operator: string;
    value: string;
  }[];
  sorting: {
    field: string;
    direction: 'asc' | 'desc';
  }[];
}

interface EmailEntry {
  email: string;
  status: string;
}

interface PhoneEntry {
  number: string;
  status: string;
}

interface AddressEntry {
  street: string;
  street2: string;
  city: string;
  state: string;
  zipCode: string;
  status: string;
}

interface SocialMediaEntry {
  username: string;
  service: string;
  status: string;
}

interface Tag {
  id: string;
  name: string;
}

type WorkspaceRole = 'Super Admin' | 'Admin' | 'Basic User' | 'Volunteer';

const rolePermissions = {
  'Super Admin': { canCreate: true, canRead: true, canUpdate: true, canDelete: true },
  'Admin': { canCreate: true, canRead: true, canUpdate: true, canDelete: true },
  'Basic User': { canCreate: true, canRead: true, canUpdate: true, canDelete: true },
  'Volunteer': { canCreate: false, canRead: true, canUpdate: false, canDelete: false }
};

// Contact view fields that can be displayed
const VIEW_FIELDS = [
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

type ViewField = typeof VIEW_FIELDS[number];

// Formatter for field names
const formatFieldName = (field: string) => {
  return field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await AuthService.requireAuth(request);
  
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie")
  );
  const token = session.get("token");

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase credentials');
  }

  const url = new URL(request.url);
  const workspaceId = url.searchParams.get('workspace') || null;

  const [viewsResult, contactsResult] = await Promise.all([
    ApiService.fetchData({
      table: 'contact_views',
      query: workspaceId ? { workspace_id: workspaceId } : {}
    }),
    ApiService.fetchData({
      table: 'contacts',
      query: workspaceId ? { workspace_id: workspaceId } : {}
    })
  ]);

  return json({
    user,
    token,
    initialViews: viewsResult.data || [],
    initialContacts: contactsResult.data || [],
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY
  });
}

export default function ContactsRoute() {
  const { 
    user, 
    token,
    initialViews, 
    initialContacts, 
    SUPABASE_URL, 
    SUPABASE_ANON_KEY 
  } = useLoaderData<typeof loader>();

  const [supabase, setSupabase] = useState<any>(null);
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [views, setViews] = useState<ContactView[]>(initialViews);
  const [selectedView, setSelectedView] = useState<ContactView | null>(views[0] || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateViewOpen, setIsCreateViewOpen] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  const [isEditViewOpen, setIsEditViewOpen] = useState(false);
  const [editViewName, setEditViewName] = useState('');
  const [isDeleteViewOpen, setIsDeleteViewOpen] = useState(false);
  const [isViewSelectorOpen, setIsViewSelectorOpen] = useState(false);
  const [isCreateContactOpen, setIsCreateContactOpen] = useState(false);
  const [races, setRaces] = useState<Array<{ id: string; name: string }>>([]);
  const [genders, setGenders] = useState<Array<{ id: string; name: string }>>([]);
  const [states, setStates] = useState<Array<{ id: string; name: string }>>([]);
  const [zipCodes, setZipCodes] = useState<Array<{ id: string; code: string }>>([]);
  const [tags, setTags] = useState<Array<Tag>>([]);
  
  const STATUS_OPTIONS = ['Active', 'Inactive', 'Archived'] as const;
  const SOCIAL_MEDIA_SERVICES = ['Facebook', 'Twitter', 'Instagram', 'LinkedIn', 'TikTok'] as const;
  
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [race, setRace] = useState('');
  const [gender, setGender] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [vanId, setVanId] = useState('');
  const [status, setStatus] = useState<typeof STATUS_OPTIONS[number]>('Active');
  const [emails, setEmails] = useState<EmailEntry[]>([]);
  const [phones, setPhones] = useState<PhoneEntry[]>([]);
  const [addresses, setAddresses] = useState<AddressEntry[]>([]);
  const [socialMedia, setSocialMedia] = useState<SocialMediaEntry[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  
  useEffect(() => {
    if (SUPABASE_URL && SUPABASE_ANON_KEY && token) {
      setIsLoading(true);
      
      const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        },
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      });

      setSupabase(supabaseClient);
      
      const wsId = localStorage.getItem('selectedWorkspace');
      if (wsId) {
        setWorkspaceId(wsId);
      }
      
      setIsLoading(false);
    }
  }, [SUPABASE_URL, SUPABASE_ANON_KEY, token]);

  useEffect(() => {
    if (!isCreateContactOpen || !supabase || !workspaceId) return;
  
    const fetchReferenceData = async () => {
      try {
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

        // Check for errors
        if (raceError) console.error('Error fetching races:', raceError);
        if (genderError) console.error('Error fetching genders:', genderError);
        if (stateError) console.error('Error fetching states:', stateError);
        if (zipError) console.error('Error fetching zip codes:', zipError);
        if (tagError) console.error('Error fetching tags:', tagError);
  
        setRaces(raceData || []);
        setGenders(genderData || []);
        setStates(stateData || []);
        setZipCodes(zipData || []);
        setTags(tagData || []);
      } catch (error) {
        console.error('Error fetching reference data:', error);
      }
    };
  
    fetchReferenceData();
  }, [isCreateContactOpen, supabase, workspaceId]);
  
  const handleCreateContact = async () => {
    if (!supabase || !workspaceId) return;
  
    // Validate required fields
    if (!firstName.trim()) {
      alert('First name is required');
      return;
    }
    if (!lastName.trim()) {
      alert('Last name is required');
      return;
    }
  
    try {
      // Create the contact
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .insert({
          workspace_id: workspaceId,
          first_name: firstName,
          middle_name: middleName,
          last_name: lastName,
          race_id: race,
          gender_id: gender,
          pronouns,
          vanid: vanId,
          status
        })
        .select()
        .single();
  
      if (contactError) throw contactError;
  
      // Create related records
      await Promise.all([
        // Emails
        ...emails.filter(e => e.email.trim()).map(email => 
          supabase.from('contact_emails').insert({
            contact_id: contact.id,
            email: email.email,
            status: email.status
          })
        ),
        // Phones
        ...phones.filter(p => p.number.trim()).map(phone => 
          supabase.from('contact_phones').insert({
            contact_id: contact.id,
            phone_number: phone.number,
            status: phone.status
          })
        ),
        // Addresses
        ...addresses.filter(a => a.street.trim()).map(addr => 
          supabase.from('contact_addresses').insert({
            contact_id: contact.id,
            street_address: addr.street,
            street_address_2: addr.street2,
            city: addr.city,
            state_id: addr.state,
            zip_code_id: addr.zipCode,
            status: addr.status
          })
        ),
        // Social Media
        ...socialMedia.filter(sm => sm.username.trim()).map(sm => 
          supabase.from('contact_social_media').insert({
            contact_id: contact.id,
            username: sm.username,
            service: sm.service,
            status: sm.status
          })
        ),
        // Tags
        ...selectedTags.map(tag => 
          supabase.from('contact_tag_assignments').insert({
            contact_id: contact.id,
            tag_id: tag.id
          })
        )
      ]);
  
      // Reset form and close dialog
      resetForm();
      setIsCreateContactOpen(false);
      // Refresh contacts list
      fetchContacts();
    } catch (error) {
      console.error('Error creating contact:', error);
    }
  };
  
  const resetForm = () => {
    setFirstName('');
    setMiddleName('');
    setLastName('');
    setRace('');
    setGender('');
    setPronouns('');
    setVanId('');
    setStatus('Active');
    setEmails([]);
    setPhones([]);
    setAddresses([]);
    setSocialMedia([]);
    setSelectedTags([]);
  };

  // Fetch views when workspace changes
  useEffect(() => {
    if (workspaceId && supabase) {
      fetchViews();
    }
  }, [workspaceId, supabase]);

  const fetchViews = async () => {
    if (!supabase || !workspaceId) return;
    
    try {
      const { data, error } = await supabase
        .from('contact_views')
        .select('*')
        .eq('workspace_id', workspaceId);
      
      if (error) {
        console.error("Error fetching views:", error);
        return;
      }
      
      if (data) {
        setViews(data);
        if (!selectedView && data.length > 0) {
          setSelectedView(data[0]);
          fetchContacts();
        }
      }
    } catch (error) {
      console.error("Error in fetchViews:", error);
    }
  };

  const updateViewField = async (field: keyof ContactView, value: boolean) => {
    if (!supabase || !selectedView) return;

    try {
      const { error } = await supabase
        .from('contact_views')
        .update({ [field]: value })
        .eq('id', selectedView.id);

      if (error) {
        console.error("Error updating view:", error);
        return;
      }

      setSelectedView({
        ...selectedView,
        [field]: value
      });

      await fetchViews();
    } catch (error) {
      console.error("Unexpected error updating view:", error);
    }
  };

  const fetchContacts = async () => {
    if (!supabase || !workspaceId) return;

    let query = supabase
      .from('contacts')
      .select('*')
      .eq('workspace_id', workspaceId);

    if (selectedView?.filters) {
      selectedView.filters.forEach(filter => {
        switch (filter.operator) {
          case 'equals':
            query = query.eq(filter.field, filter.value);
            break;
          case 'contains':
            query = query.ilike(filter.field, `%${filter.value}%`);
            break;
        }
      });
    }

    if (selectedView?.sorting) {
      selectedView.sorting.forEach(sort => {
        query = query.order(sort.field, { ascending: sort.direction === 'asc' });
      });
    }

    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
    }

    const { data, error } = await query;
    
    if (data && !error) {
      setContacts(data);
    }
  };

  const createNewView = async () => {
    if (!supabase || !workspaceId || !newViewName.trim() || !user?.id) {
      return;
    }

    try {
      const { data: userWorkspaces, error: accessError } = await supabase
        .from('user_workspaces')
        .select('role')
        .match({ 
          user_id: user.id,
          workspace_id: workspaceId 
        });

      if (accessError) {
        console.error("Error checking workspace access:", accessError);
        return;
      }

      if (!userWorkspaces || userWorkspaces.length === 0) {
        console.error("No workspace access found");
        return;
      }

      const userRole = userWorkspaces[0]?.role as WorkspaceRole;
      if (!rolePermissions[userRole].canCreate) {
        console.error("User does not have permission to create views");
        return;
      }

      const newView = {
        view_name: newViewName.trim(),
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
        social_media_accounts: true
      };

      const { data: insertedView, error: insertError } = await supabase
        .from('contact_views')
        .insert([newView])
        .select();

      if (insertError) {
        console.error("Error creating view:", insertError);
        return;
      }

      await fetchViews();
      setNewViewName('');
      setIsCreateViewOpen(false);

    } catch (error) {
      console.error("Unexpected error creating view:", error);
    }
  };
  
  const editView = async () => {
    if (!supabase || !selectedView || !editViewName.trim()) return;
  
    try {
      const { data, error } = await supabase
        .from('contact_views')
        .update({ view_name: editViewName.trim() })
        .eq('id', selectedView.id)
        .select()
        .single();
  
      if (error) {
        console.error("Error updating view:", error);
        return;
      }
  
      // Update the selected view with the new name
      setSelectedView({ ...selectedView, view_name: editViewName.trim() });
      
      // Update the views list with the edited view
      setViews(views.map(view => 
        view.id === selectedView.id 
          ? { ...view, view_name: editViewName.trim() }
          : view
      ));
  
      // Refresh the views list from the server to ensure we have the latest data
      await fetchViews();
      
      setEditViewName('');
      setIsEditViewOpen(false);
    } catch (error) {
      console.error("Unexpected error updating view:", error);
    }
  };
  
  const deleteView = async () => {
    if (!supabase || !selectedView) return;
  
    try {
      const { error } = await supabase
        .from('contact_views')
        .delete()
        .eq('id', selectedView.id);
  
      if (error) {
        console.error("Error deleting view:", error);
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
    } catch (error) {
      console.error("Unexpected error deleting view:", error);
    }
  };
  
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="h-screen overflow-auto">
      {/* Navbar */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6" />
          <h1 className="text-xl font-semibold">Contacts</h1>
        </div>
        
        <div className="flex items-center gap-2">
            <Popover open={isViewSelectorOpen} onOpenChange={setIsViewSelectorOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-[200px] justify-between"
                >
                  {selectedView ? selectedView.view_name : "Select view..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0">
                <Command>
                  <CommandInput placeholder="Search views..." />
                  <CommandList>
                    <CommandEmpty>No views found.</CommandEmpty>
                    <CommandGroup>
                      {views.map((view) => (
                        <CommandItem
                          key={view.id}
                          value={view.id}
                          onSelect={() => {
                            setSelectedView(view);
                            fetchContacts();
                            setIsViewSelectorOpen(false);
                          }}
                        >
                          {view.view_name}
                          <Check
                            className={cn(
                              "ml-auto h-4 w-4",
                              selectedView?.id === view.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                        </CommandItem>
                      ))}
                      <CommandItem
                        onSelect={() => {
                          setIsViewSelectorOpen(false);
                          setIsCreateViewOpen(true);
                        }}
                        className="border-t"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Create View
                      </CommandItem>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
          </Popover>

          {/* Create View Dialog */}
          <AlertDialog open={isCreateViewOpen} onOpenChange={setIsCreateViewOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Create New View</AlertDialogTitle>
              </AlertDialogHeader>
              <div className="py-4">
                <Input
                  placeholder="View name"
                  value={newViewName}
                  onChange={(e) => setNewViewName(e.target.value)}
                  className="w-full"
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => {
                  setNewViewName('');
                  setIsCreateViewOpen(false);
                }}>
                  Cancel
                </AlertDialogCancel>
                <Button onClick={createNewView}>
                  Create
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline"><Cog /></Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                {selectedView && VIEW_FIELDS.map(field => (
                  <div key={field} className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedView[field]}
                      onCheckedChange={(checked) => updateViewField(field, !!checked)}
                    />
                    <label>{formatFieldName(field)}</label>
                  </div>
                ))}
                
                <div className="pt-4 border-t flex gap-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setEditViewName(selectedView?.view_name || '');
                      setIsEditViewOpen(true);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit View
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => setIsDeleteViewOpen(true)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete View
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button onClick={() => setIsCreateContactOpen(true)} variant="default">
            <UserPlus className="w-4 h-4 mr-2" />
            Create Contact
          </Button>
            </div>
          </div>
    
          {/* Filter & Sort Bar */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">Filter</Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    {selectedView?.filters.map((filter, index) => (
                      <div key={index} className="space-y-2">
                        <Select
                          value={filter.field}
                          onValueChange={(value) => {
                            const newFilters = [...(selectedView?.filters || [])];
                            newFilters[index].field = value;
                            if (selectedView) {
                              setSelectedView({
                                ...selectedView,
                                filters: newFilters
                              });
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select field" />
                          </SelectTrigger>
                          <SelectContent>
                            {VIEW_FIELDS.filter(field => selectedView[field])
                              .map(field => (
                                <SelectItem key={field} value={field}>
                                  {formatFieldName(field)}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
    
                        <Select
                          value={filter.operator}
                          onValueChange={(value) => {
                            const newFilters = [...(selectedView?.filters || [])];
                            newFilters[index].operator = value;
                            if (selectedView) {
                              setSelectedView({
                                ...selectedView,
                                filters: newFilters
                              });
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select operator" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="equals">Equals</SelectItem>
                            <SelectItem value="contains">Contains</SelectItem>
                          </SelectContent>
                        </Select>
    
                        <Input
                          placeholder="Value"
                          value={filter.value}
                          onChange={(e) => {
                            const newFilters = [...(selectedView?.filters || [])];
                            newFilters[index].value = e.target.value;
                            if (selectedView) {
                              setSelectedView({
                                ...selectedView,
                                filters: newFilters
                              });
                            }
                          }}
                        />
                      </div>
                    ))}
                    <Button
                      onClick={() => {
                        if (selectedView) {
                          setSelectedView({
                            ...selectedView,
                            filters: [
                              ...(selectedView.filters || []),
                              { field: '', operator: 'equals', value: '' }
                            ]
                          });
                        }
                      }}
                    >
                      Add Filter
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
    
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">Sort</Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    {selectedView?.sorting.map((sort, index) => (
                      <div key={index} className="space-y-2">
                        <Select
                          value={sort.field}
                          onValueChange={(value) => {
                            const newSorting = [...(selectedView?.sorting || [])];
                            newSorting[index].field = value;
                            if (selectedView) {
                              setSelectedView({
                                ...selectedView,
                                sorting: newSorting
                              });
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select field" />
                          </SelectTrigger>
                          <SelectContent>
                            {VIEW_FIELDS.filter(field => selectedView[field])
                              .map(field => (
                                <SelectItem key={field} value={field}>
                                  {formatFieldName(field)}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
    
                        <Select
                          value={sort.direction}
                          onValueChange={(value: 'asc' | 'desc') => {
                            const newSorting = [...(selectedView?.sorting || [])];
                            newSorting[index].direction = value;
                            if (selectedView) {
                              setSelectedView({
                                ...selectedView,
                                sorting: newSorting
                              });
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select direction" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="asc">Ascending</SelectItem>
                            <SelectItem value="desc">Descending</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                    <Button
                      onClick={() => {
                        if (selectedView) {
                          setSelectedView({
                            ...selectedView,
                            sorting: [
                              ...(selectedView.sorting || []),
                              { field: '', direction: 'asc' }
                            ]
                          });
                        }
                      }}
                    >
                      Add Sort
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            <Input
              className="w-64"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                fetchContacts();
              }}
            />
          </div>
    
          {/* Data Grid */}
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {selectedView && VIEW_FIELDS
                    .filter(field => selectedView[field])
                    .map(field => (
                      <TableHead key={field}>{formatFieldName(field)}</TableHead>
                    ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map(contact => (
                  <TableRow
                    key={contact.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedContact(contact)}
                  >
                    {selectedView && VIEW_FIELDS
                      .filter(field => selectedView[field])
                      .map(field => (
                        <TableCell key={field}>{contact[field]}</TableCell>
                      ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
    
          {/* Contact Details Sheet */}
          <Sheet open={!!selectedContact} onOpenChange={() => setSelectedContact(null)}>
            <SheetContent className="w-96">
              <SheetHeader>
                <SheetTitle>Contact Details</SheetTitle>
              </SheetHeader>
              {selectedContact && (
                <div className="mt-4 space-y-4">
                  {Object.entries(selectedContact).map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <div className="font-medium">{formatFieldName(key)}</div>
                      <div>{String(value)}</div>
                    </div>
                  ))}
                </div>
              )}
            </SheetContent>
          </Sheet>
          
          {/* Edit View Dialog */}
          <AlertDialog open={isEditViewOpen} onOpenChange={setIsEditViewOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Edit View</AlertDialogTitle>
              </AlertDialogHeader>
              <div className="py-4">
                <Input
                  placeholder="View name"
                  value={editViewName}
                  onChange={(e) => setEditViewName(e.target.value)}
                  className="w-full"
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => {
                  setEditViewName('');
                  setIsEditViewOpen(false);
                }}>
                  Cancel
                </AlertDialogCancel>
                <Button onClick={editView}>
                  Save Changes
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          {/* Delete View Dialog */}
          <AlertDialog open={isDeleteViewOpen} onOpenChange={setIsDeleteViewOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete View</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this view? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setIsDeleteViewOpen(false)}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={deleteView}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <Dialog open={isCreateContactOpen} onOpenChange={setIsCreateContactOpen}>
          <DialogContent className="max-w-2xl h-[90vh] flex flex-col p-0"> {/* Changed from max-h to h, added p-0 */}
              <DialogHeader className="p-6 pb-2">
                <DialogTitle>Create New Contact</DialogTitle>
              </DialogHeader>
              
              <ScrollArea className="flex-1 px-6">
                <div className="pb-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Basic Information</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="firstName" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                          First Name
                        </Label>
                        <Input
                          id="firstName"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="middleName">
                          Middle Name
                        </Label>
                        <Input
                          id="middleName"
                          value={middleName}
                          onChange={(e) => setMiddleName(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                          Last Name
                        </Label>
                        <Input
                          id="lastName"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="race">Race</Label>
                        <Select value={race} onValueChange={setRace}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select race" />
                          </SelectTrigger>
                          <SelectContent>
                            {races.map((r) => (
                              <SelectItem key={r.id} value={r.id}>
                                {r.race}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="gender">Gender</Label>
                        <Select value={gender} onValueChange={setGender}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            {genders.map((g) => (
                              <SelectItem key={g.id} value={g.id}>
                                {g.gender}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="pronouns">Pronouns</Label>
                        <Input
                          id="pronouns"
                          value={pronouns}
                          onChange={(e) => setPronouns(e.target.value)}
                        />
                      </div>
                    </div>
          
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="vanId">VanID</Label>
                        <Input
                          id="vanId"
                          value={vanId}
                          onChange={(e) => setVanId(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Select value={status} onValueChange={setStatus}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
          
                  <Separator />
          
                  {/* Emails */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold">Emails</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEmails([...emails, { email: '', status: 'Active' }])}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Email
                      </Button>
                    </div>
                    {emails.length > 0 && (
                      <div className="space-y-4">
                        {emails.map((email, index) => (
                          <div key={index} className="grid grid-cols-[1fr,auto,auto] gap-2 items-end">
                            <div>
                              <Label>Email Address</Label>
                              <Input
                                value={email.email}
                                onChange={(e) => {
                                  const newEmails = [...emails];
                                  newEmails[index].email = e.target.value;
                                  setEmails(newEmails);
                                }}
                              />
                            </div>
                            <div>
                              <Label>Status</Label>
                              <Select
                                value={email.status}
                                onValueChange={(value) => {
                                  const newEmails = [...emails];
                                  newEmails[index].status = value;
                                  setEmails(newEmails);
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {STATUS_OPTIONS.map((s) => (
                                    <SelectItem key={s} value={s}>
                                      {s}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const newEmails = [...emails];
                                newEmails.splice(index, 1);
                                setEmails(newEmails);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
          
                  <Separator />
          
                  {/* Phone Numbers */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold">Phone Numbers</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPhones([...phones, { number: '', status: 'Active' }])}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Phone
                      </Button>
                    </div>
                    {phones.length > 0 && (
                      <div className="space-y-4">
                        {phones.map((phone, index) => (
                          <div key={index} className="grid grid-cols-[1fr,auto,auto] gap-2 items-end">
                            <div>
                              <Label>Phone Number</Label>
                              <Input
                                value={phone.number}
                                onChange={(e) => {
                                  const newPhones = [...phones];
                                  newPhones[index].number = e.target.value;
                                  setPhones(newPhones);
                                }}
                              />
                            </div>
                            <div>
                              <Label>Status</Label>
                              <Select
                                value={phone.status}
                                onValueChange={(value) => {
                                  const newPhones = [...phones];
                                  newPhones[index].status = value;
                                  setPhones(newPhones);
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {STATUS_OPTIONS.map((s) => (
                                    <SelectItem key={s} value={s}>
                                      {s}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const newPhones = [...phones];
                                newPhones.splice(index, 1);
                                setPhones(newPhones);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
            
                  <Separator />
            
                  {/* Addresses */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold">Addresses</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAddresses([...addresses, {
                          street: '',
                          street2: '',
                          city: '',
                          state: '',
                          zipCode: '',
                          status: 'Active'
                        }])}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Address
                      </Button>
                    </div>
                    {addresses.length > 0 && (
                      <div className="space-y-4">
                        {addresses.map((address, index) => (
                          <div key={index} className="space-y-4 border rounded-lg p-4">
                            <div className="flex justify-end">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  const newAddresses = [...addresses];
                                  newAddresses.splice(index, 1);
                                  setAddresses(newAddresses);
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                              <div>
                                <Label>Street Address</Label>
                                <Input
                                  value={address.street}
                                  onChange={(e) => {
                                    const newAddresses = [...addresses];
                                    newAddresses[index].street = e.target.value;
                                    setAddresses(newAddresses);
                                  }}
                                />
                              </div>
                              <div>
                                <Label>Secondary Street Address</Label>
                                <Input
                                  value={address.street2}
                                  onChange={(e) => {
                                    const newAddresses = [...addresses];
                                    newAddresses[index].street2 = e.target.value;
                                    setAddresses(newAddresses);
                                  }}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <Label>City</Label>
                                <Input
                                  value={address.city}
                                  onChange={(e) => {
                                    const newAddresses = [...addresses];
                                    newAddresses[index].city = e.target.value;
                                    setAddresses(newAddresses);
                                  }}
                                />
                              </div>
                              <div>
                                <Label>State</Label>
                                <Select
                                  value={address.state}
                                  onValueChange={(value) => {
                                    const newAddresses = [...addresses];
                                    newAddresses[index].state = value;
                                    setAddresses(newAddresses);
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select state" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {states.map((s) => (
                                      <SelectItem key={s.id} value={s.id}>
                                        {s.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Zip Code</Label>
                                <Select
                                  value={address.zipCode}
                                  onValueChange={(value) => {
                                    const newAddresses = [...addresses];
                                    newAddresses[index].zipCode = value;
                                    setAddresses(newAddresses);
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select zip code" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {zipCodes.map((z) => (
                                      <SelectItem key={z.id} value={z.id}>
                                        {z.code}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div>
                              <Label>Status</Label>
                              <Select
                                value={address.status}
                                onValueChange={(value) => {
                                  const newAddresses = [...addresses];
                                  newAddresses[index].status = value;
                                  setAddresses(newAddresses);
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {STATUS_OPTIONS.map((s) => (
                                    <SelectItem key={s} value={s}>
                                      {s}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
            
                  <Separator />
            
                  {/* Social Media Accounts */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold">Social Media Accounts</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSocialMedia([...socialMedia, {
                          username: '',
                          service: SOCIAL_MEDIA_SERVICES[0],
                          status: 'Active'
                        }])}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Social Media
                      </Button>
                    </div>
                    {socialMedia.length > 0 && (
                      <div className="space-y-4">
                        {socialMedia.map((account, index) => (
                          <div key={index} className="grid grid-cols-[1fr,1fr,auto,auto] gap-2 items-end">
                            <div>
                              <Label>Username</Label>
                              <Input
                                value={account.username}
                                onChange={(e) => {
                                  const newAccounts = [...socialMedia];
                                  newAccounts[index].username = e.target.value;
                                  setSocialMedia(newAccounts);
                                }}
                              />
                            </div>
                            <div>
                              <Label>Service</Label>
                              <Select
                                value={account.service}
                                onValueChange={(value) => {
                                  const newAccounts = [...socialMedia];
                                  newAccounts[index].service = value;
                                  setSocialMedia(newAccounts);
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {SOCIAL_MEDIA_SERVICES.map((service) => (
                                    <SelectItem key={service} value={service}>
                                      {service}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Status</Label>
                              <Select
                                value={account.status}
                                onValueChange={(value) => {
                                  const newAccounts = [...socialMedia];
                                  newAccounts[index].status = value;
                                  setSocialMedia(newAccounts);
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {STATUS_OPTIONS.map((s) => (
                                    <SelectItem key={s} value={s}>
                                      {s}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const newAccounts = [...socialMedia];
                                newAccounts.splice(index, 1);
                                setSocialMedia(newAccounts);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
            
                  <Separator />
            
                  {/* Tags */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Tags</h3>
                    <div>
                      <Label>Select or Create Tags</Label>
                      <Command className="border rounded-lg">
                        <CommandInput placeholder="Search tags..." />
                        <CommandList>
                          <CommandEmpty>No tags found.</CommandEmpty>
                          <CommandGroup>
                            {tags.map((tag) => (
                              <CommandItem
                                key={tag.id}
                                value={tag.name}
                                onSelect={() => {
                                  if (selectedTags.some(t => t.id === tag.id)) {
                                    setSelectedTags(selectedTags.filter(t => t.id !== tag.id));
                                  } else {
                                    setSelectedTags([...selectedTags, tag]);
                                  }
                                }}
                              >
                                <div className={cn(
                                  "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                  selectedTags.some(t => t.id === tag.id)
                                    ? "bg-primary text-primary-foreground"
                                    : "opacity-50 [&_svg]:invisible"
                                )}>
                                  <Check className={cn("h-4 w-4")} />
                                </div>
                                {tag.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selectedTags.map((tag) => (
                          <Badge
                            key={tag.id}
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() => setSelectedTags(selectedTags.filter(t => t.id !== tag.id))}
                          >
                            {tag.name}
                            <X className="ml-1 h-3 w-3" />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            
              <DialogFooter className="p-6 pt-4 border-t">  {/* Added border and adjusted padding */}
                <Button variant="outline" onClick={() => {
                  resetForm();
                  setIsCreateContactOpen(false);
                }}>
                  Cancel
                </Button>
                <Button onClick={handleCreateContact}>
                  Create Contact
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      );
    }