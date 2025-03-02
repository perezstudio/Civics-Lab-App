import type { ActionFunctionArgs } from "@remix-run/node"
import { signOut } from "~/services/supabase.server"

// Simple action route to handle sign out
export async function action({ request }: ActionFunctionArgs) {
  return signOut(request)
}

// A loader that redirects to the home page if accessed directly
export async function loader() {
  return new Response(null, {
    status: 302,
    headers: {
      Location: '/',
    },
  })
}