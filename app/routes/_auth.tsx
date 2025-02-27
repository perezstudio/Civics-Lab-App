// app/routes/_auth.tsx
import { json, LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData, useRevalidator } from "@remix-run/react";
import { useEffect, useState } from "react";
import { 
  AuthService, 
  getTokenFromRequest, 
  initClientSupabase, 
  isClientSupabaseInitialized,
  supabaseUrl,
  supabaseAnonKey
} from "~/services/supabase";
import { Toaster } from "~/components/ui/sonner";

export async function loader({ request }: LoaderFunctionArgs) {
  // Get the authenticated user or redirect
  const user = await AuthService.requireAuth(request);
  // Get the token to pass to the client
  const token = await getTokenFromRequest(request);

  return json({ 
    user,
    token
  });
}

export default function AuthLayout() {
  const { user, token } = useLoaderData<typeof loader>();
  const [isInitialized, setIsInitialized] = useState(false);
  const revalidator = useRevalidator();

  useEffect(() => {
    // Check if we have a token and Supabase is not already initialized
    if (token && !isClientSupabaseInitialized()) {
      // Initialize the client-side Supabase instance
      try {
        const client = initClientSupabase(token);
        
        if (client) {
          console.log("Supabase client initialized successfully");
          
          // Set up auth state change listener
          const { data: { subscription } } = client.auth.onAuthStateChange(
            (event, session) => {
              console.log("Auth state changed:", event);
              if (event === 'SIGNED_OUT') {
                // Force revalidation to redirect to login
                revalidator.revalidate();
              }
            }
          );
          
          setIsInitialized(true);
          
          // Clean up subscription on unmount
          return () => {
            subscription?.unsubscribe();
          };
        } else {
          console.error("Failed to initialize Supabase client");
        }
      } catch (error) {
        console.error("Error initializing Supabase client:", error);
      }
    } else if (isClientSupabaseInitialized()) {
      setIsInitialized(true);
    }
  }, [token, revalidator]);

  // If Supabase is not initialized and we're still loading
  if (!isInitialized) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Outlet />
      <Toaster position="top-right" />
    </>
  );
}