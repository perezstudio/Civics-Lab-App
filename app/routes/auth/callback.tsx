import { type LoaderFunctionArgs } from "@remix-run/node"
import { createSupabaseServerClient } from "~/services/supabase.server"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { supabase, headers } = createSupabaseServerClient(request)
  
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    await supabase.auth.exchangeCodeForSession(code)
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: '/app',
      ...Object.fromEntries(headers),
    },
  })
}