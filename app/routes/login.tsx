import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node"
import { Form, useActionData, useNavigation, useSearchParams } from "@remix-run/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Button } from "~/components/ui/button"
import { Alert, AlertDescription } from "~/components/ui/alert"
import { createSupabaseServerClient } from "~/services/supabase.server"

// Check if user is already logged in and redirect if they are
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const { supabase, headers } = createSupabaseServerClient(request)
    
    // Use getUser instead of getSession to avoid security warnings
    const { data, error } = await supabase.auth.getUser()
    
    // If user is already logged in, redirect to app
    if (!error && data.user) {
      return redirect('/app', { headers })
    }
    
    return json({}, { headers })
  } catch (error) {
    console.error('Login loader error:', error)
    return json({})
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return json({ error: "Email and password are required" })
  }

  try {
    const { supabase, headers } = createSupabaseServerClient(request)
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return json({ error: error.message }, { headers })
    }

    if (data?.user) {
      // Successfully signed in, redirect to app
      return redirect("/app", { headers })
    }

    return json({ error: "An unexpected error occurred" }, { headers })
  } catch (error) {
    return json({ 
      error: error instanceof Error ? error.message : "An unexpected error occurred" 
    })
  }
}

export default function LoginPage() {
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  const [searchParams] = useSearchParams()
  const isSubmitting = navigation.state === "submitting"
  
  // Get error messages from URL params or action data
  const urlError = searchParams.get('error')
  const errorMessage = actionData?.error || 
    (urlError === 'confirmation_failed' ? 'Email confirmation failed. Please try again.' : '')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Form method="post" className="space-y-4">
            {errorMessage && (
              <Alert variant="destructive">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Input
                type="email"
                name="email"
                placeholder="Email"
                required
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Input
                type="password"
                name="password"
                placeholder="Password"
                required
                className="w-full"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}