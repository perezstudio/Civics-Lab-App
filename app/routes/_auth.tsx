// app/routes/_auth.tsx
import { json, LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import { AuthService } from "~/services/auth.server";
import { sessionStorage } from "~/services/supabase.server";
import { useEffect, useState } from "react";
import { initSupabaseClient, isSupabaseInitialized } from "~/services/supabase.client";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await AuthService.requireAuth(request);
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  const token = session.get("token");

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    throw new Error('Missing Supabase credentials');
  }

  return json({ 
    user,
    token,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY
  });
}

export default function AuthLayout() {
  const { token, SUPABASE_URL, SUPABASE_ANON_KEY } = useLoaderData<typeof loader>();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (SUPABASE_URL && SUPABASE_ANON_KEY && token) {
      initSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, token);
      setIsInitialized(true);
    }
  }, [SUPABASE_URL, SUPABASE_ANON_KEY, token]);

  if (!isInitialized) {
    return <div>Initializing...</div>;
  }

  return <Outlet />;
}