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
import { AlertDialog, AlertDialogTitle, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogCancel } from "~/components/ui/alert-dialog";

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

  // Initialize Supabase client and set initial workspace
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
          <Popover>
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
                      onSelect={() => setIsCreateViewOpen(true)}
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
              <Button variant="outline">View Settings</Button>
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
              </div>
            </PopoverContent>
          </Popover>
            </div>
          </div>
    
          {/* Filter & Sort Bar */}
          <div className="flex items-center justify-between p-4 border-b">
            <Input
              className="w-64"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                fetchContacts();
              }}
            />
            
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
        </div>
      );
    }