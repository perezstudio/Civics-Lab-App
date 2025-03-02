import { type LoaderFunctionArgs } from "@remix-run/node"
import { handleAuthCallback } from "~/services/supabase.server"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const { headers } = await handleAuthCallback(request)
    
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/app',
        ...Object.fromEntries(headers),
      },
    })
  } catch (error) {
    console.error('Error in auth callback:', error)
    
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/login?error=auth_callback_failed',
      },
    })
  }
}