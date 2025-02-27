// app/routes/_auth.engage.contacts.tsx
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useEffect, useState } from 'react';
import { 
  AuthService, 
  DataService, 
  getTokenFromRequest,
  initClientSupabase,
  isClientSupabaseInitialized,
  getClientSupabase
} from "~/services/supabase";
import { ContactsPage } from "~/components/contacts/ContactsPage";
import { Toaster } from "~/components/ui/sonner";

/**
 * Server-side loader function
 */
export async function loader({ request }: LoaderFunctionArgs) {
  // Get authenticated user
  const user = await AuthService.requireAuth(request);
  
  // Get auth token
  const token = await getTokenFromRequest(request);

  // Get workspace ID from query params
  const url = new URL(request.url);
  const workspaceId = url.searchParams.get('workspace') || null;

  // Fetch initial data for contacts and views
  const [viewsResult, contactsResult] = await Promise.all([
    workspaceId 
      ? DataService.fetchData({
          table: 'contact_views',
          query: { workspace_id: workspaceId },
          request
        })
      : { data: [] },
    workspaceId 
      ? DataService.fetchData({
          table: 'contacts',
          query: { workspace_id: workspaceId },
          request
        })
      : { data: [] }
  ]);

  // Return data for client
  return json({
    user,
    token,
    initialViews: viewsResult.data || [],
    initialContacts: contactsResult.data || [],
  });
}

export default function ContactsRoute() {
  const { 
    user, 
    token,
    initialViews, 
    initialContacts,
  } = useLoaderData<typeof loader>();

  // State to track client initialization and workspace
  const [isInitialized, setIsInitialized] = useState(false);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  
  // Initialize Supabase client when component mounts
  useEffect(() => {
    if (!isClientSupabaseInitialized() && token) {
      // Initialize the client-side Supabase instance
      initClientSupabase(token);
      setIsInitialized(true);
    } else if (isClientSupabaseInitialized()) {
      setIsInitialized(true);
    }
  }, [token]);

  // Handle workspace from URL or localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Get workspace ID from URL or localStorage
      const urlParams = new URLSearchParams(window.location.search);
      const urlWorkspace = urlParams.get('workspace');
      
      if (urlWorkspace) {
        setWorkspaceId(urlWorkspace);
        localStorage.setItem('selectedWorkspace', urlWorkspace);
      } else {
        const storedWorkspace = localStorage.getItem('selectedWorkspace');
        setWorkspaceId(storedWorkspace);
      }
    }
  }, []);

  // Update workspace when it changes
  const handleWorkspaceChange = (newWorkspaceId: string | null) => {
    setWorkspaceId(newWorkspaceId);
    if (newWorkspaceId) {
      localStorage.setItem('selectedWorkspace', newWorkspaceId);
    } else {
      localStorage.removeItem('selectedWorkspace');
    }
  };

  return (
    <>
      <ContactsPage 
        userId={user.id}
        workspaceId={workspaceId}
        initialLoading={!isInitialized}
        onWorkspaceChange={handleWorkspaceChange}
        initialViews={initialViews}
        initialContacts={initialContacts}
      />
      <Toaster position="top-right" />
    </>
  );
}