// app/components/contacts/SimpleDebugComponent.tsx
import React, { useEffect, useState } from 'react';
import { getSupabaseClient } from '~/services/auth.client';

interface SimpleDebugComponentProps {
  userId: string;
  workspaceId: string | null;
}

export function SimpleDebugComponent({ userId, workspaceId }: SimpleDebugComponentProps) {
  const [views, setViews] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientStatus, setClientStatus] = useState<string>("Not initialized");
  
  useEffect(() => {
    const checkClient = async () => {
      try {
        const client = getSupabaseClient();
        if (client) {
          setClientStatus("Initialized");
        } else {
          setClientStatus("Failed to initialize");
        }
      } catch (err) {
        setClientStatus(`Error: ${err.message}`);
      }
    };
    
    checkClient();
  }, []);
  
  useEffect(() => {
    if (!workspaceId) {
      setError("No workspace selected");
      setIsLoading(false);
      return;
    }
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const client = getSupabaseClient();
        if (!client) {
          setError("Supabase client not initialized");
          return;
        }
        
        // Fetch views
        const { data: viewsData, error: viewsError } = await client
          .from('contact_views')
          .select('*')
          .eq('workspace_id', workspaceId);
          
        if (viewsError) {
          setError(`Error fetching views: ${viewsError.message}`);
          return;
        }
        
        setViews(viewsData || []);
        
        // Fetch contacts
        const { data: contactsData, error: contactsError } = await client
          .from('contacts')
          .select('*')
          .eq('workspace_id', workspaceId);
          
        if (contactsError) {
          setError(`Error fetching contacts: ${contactsError.message}`);
          return;
        }
        
        setContacts(contactsData || []);
        
      } catch (err) {
        setError(`Unexpected error: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [workspaceId]);
  
  if (isLoading) {
    return (
      <div className="p-8">
        <h2 className="text-xl font-semibold mb-4">Loading data...</h2>
        <div className="flex items-center">
          <div className="h-6 w-6 mr-2 rounded-full border-2 border-t-transparent border-blue-500 animate-spin"></div>
          <p>Please wait while we load your data</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-8">
        <h2 className="text-xl font-semibold mb-4 text-red-500">Error</h2>
        <div className="p-4 border border-red-300 bg-red-50 rounded-md">
          <p>{error}</p>
        </div>
        <div className="mt-4">
          <p className="font-semibold">Debug info:</p>
          <ul className="list-disc pl-6">
            <li>User ID: {userId || 'Not provided'}</li>
            <li>Workspace ID: {workspaceId || 'Not provided'}</li>
            <li>Supabase client: {clientStatus}</li>
          </ul>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-8">
      <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
      
      <div className="p-4 border rounded-md mb-4">
        <h3 className="font-medium mb-2">Connection Status</h3>
        <p><span className="font-medium">User ID:</span> {userId}</p>
        <p><span className="font-medium">Workspace ID:</span> {workspaceId}</p>
        <p><span className="font-medium">Supabase client:</span> {clientStatus}</p>
      </div>
      
      <div className="p-4 border rounded-md mb-4">
        <h3 className="font-medium mb-2">Views ({views.length})</h3>
        {views.length === 0 ? (
          <p className="text-gray-500">No views found</p>
        ) : (
          <ul className="list-disc pl-6">
            {views.map((view) => (
              <li key={view.id}>{view.view_name}</li>
            ))}
          </ul>
        )}
      </div>
      
      <div className="p-4 border rounded-md">
        <h3 className="font-medium mb-2">Contacts ({contacts.length})</h3>
        {contacts.length === 0 ? (
          <p className="text-gray-500">No contacts found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border">ID</th>
                  <th className="p-2 border">First Name</th>
                  <th className="p-2 border">Last Name</th>
                  <th className="p-2 border">Status</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact) => (
                  <tr key={contact.id}>
                    <td className="p-2 border">{contact.id}</td>
                    <td className="p-2 border">{contact.first_name}</td>
                    <td className="p-2 border">{contact.last_name}</td>
                    <td className="p-2 border">{contact.status || 'Unknown'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}