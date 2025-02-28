// app/routes/_auth.tsx
import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node"
import { Outlet, useLoaderData } from "@remix-run/react"
import { Toaster } from "~/components/ui/sonner"
import { createSupabaseServerClient, getUser } from "~/services/supabase.server"

// Server-side authentication check
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // Create Supabase client
    const { supabase, headers } = createSupabaseServerClient(request)
    
    // Get user using getUser() instead of session to avoid security warnings
    const { data, error } = await supabase.auth.getUser()
    
    if (error || !data.user) {
      // Redirect to login if user is not authenticated
      return redirect('/login', { headers })
    }
    
    return json({ user: data.user }, { headers })
  } catch (error) {
    console.error("Auth layout error:", error)
    return redirect('/login')
  }
}

export default function AuthLayout() {
  const { user } = useLoaderData<typeof loader>()
  
  return (
    <>
      <Outlet context={{ user }} />
      <Toaster position="top-right" />
    </>
  )
}