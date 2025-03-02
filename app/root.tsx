// app/root.tsx
import { 
  Links, 
  Meta, 
  Outlet, 
  Scripts, 
  ScrollRestoration,
  useLoaderData,
  useNavigation,
  useRouteError,
  isRouteErrorResponse
} from "@remix-run/react"
import { 
  json, 
  type LoaderFunctionArgs, 
  type LinksFunction 
} from "@remix-run/node"
import { createSupabaseServerClient } from "~/services/supabase.server"
import { useEffect } from "react"
import { Toaster } from "~/components/ui/sonner"
import { AuthProvider } from "~/contexts/AuthContext"
import stylesheet from "~/tailwind.css?url"

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
  { rel: "stylesheet", href: stylesheet }
]

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // Check if environment variables are set
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      console.error('Supabase environment variables are not set')
      throw new Error('Missing required environment variables: SUPABASE_URL, SUPABASE_ANON_KEY')
    }

    // Create Supabase server client
    const { supabase, headers } = createSupabaseServerClient(request)
    
    // Get user with getUser() instead of getSession() to avoid security warnings
    const { data, error } = await supabase.auth.getUser()

    // Return data with headers
    return json(
      {
        env: {
          SUPABASE_URL: process.env.SUPABASE_URL,
          SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
        },
        user: error ? null : data.user,
      },
      { headers }
    )
  } catch (error) {
    console.error('Root loader error:', error)
    
    // Return error response
    return json({
      env: {
        SUPABASE_URL: process.env.SUPABASE_URL || '',
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
      },
      user: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export function ErrorBoundary() {
  const error = useRouteError()

  if (isRouteErrorResponse(error)) {
    return (
      <html>
        <head>
          <title>Configuration Error</title>
          <Meta />
          <Links />
        </head>
        <body>
          <div className="p-8 text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Configuration Error</h1>
            <p className="mb-4">It looks like your Supabase environment variables are not set correctly.</p>
            <p>Please check your <code>.env</code> file and ensure these variables are present:</p>
            <pre className="bg-gray-100 p-4 rounded mt-4 inline-block text-left">
              SUPABASE_URL=your_supabase_project_url{'\n'}
              SUPABASE_ANON_KEY=your_supabase_anon_key{'\n'}
              SESSION_SECRET=a_long_random_secret
            </pre>
          </div>
          <Scripts />
        </body>
      </html>
    )
  }

  // For other errors
  let errorMessage = 'Unknown error'
  if (error instanceof Error) {
    errorMessage = error.message
  } else if (typeof error === 'string') {
    errorMessage = error
  }

  return (
    <html>
      <head>
        <title>Application Error</title>
        <Meta />
        <Links />
      </head>
      <body>
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Application Error</h1>
          <p className="mb-4">Sorry, an unexpected error has occurred.</p>
          <pre className="bg-gray-100 p-4 rounded mt-4 inline-block text-left">
            {errorMessage}
          </pre>
        </div>
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  const { 
    env = { 
      SUPABASE_URL: '', 
      SUPABASE_ANON_KEY: '' 
    },
    user,
    error 
  } = useLoaderData<typeof loader>() || {}

  // Make env available to other modules through window
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__env = env
    }
  }, [env])

  const navigation = useNavigation()
  const isLoading = navigation.state === "loading"

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 fixed top-0 right-0 left-0 z-50">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {isLoading && (
          <div className="fixed top-0 left-0 right-0 h-1 bg-primary animate-pulse z-50" />
        )}
        
        <AuthProvider>
          <Outlet />
          <Toaster />
        </AuthProvider>
        
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}