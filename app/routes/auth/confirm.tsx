import type { LoaderFunctionArgs } from "@remix-run/node"
import { redirect } from "@remix-run/node"
import { createSupabaseServerClient } from "~/services/supabase.server"
import type { EmailOtpType } from "@supabase/supabase-js"

export async function loader({ request }: LoaderFunctionArgs) {
  const { supabase, headers } = createSupabaseServerClient(request)
  
  const url = new URL(request.url)
  const token_hash = url.searchParams.get('token_hash')
  const type = url.searchParams.get('type') as EmailOtpType | null
  const next = url.searchParams.get('next') ?? '/app'

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (!error) {
      // Redirect to the specified next page or default to app
      return redirect(next, { headers })
    }
  }

  // Redirect to error page if verification fails
  return redirect('/login?error=confirmation_failed', { headers })
}