// app/routes/_auth.app.tsx
import { Link } from "@remix-run/react"
import { Button } from "~/components/ui/button"
import { useAuth } from "~/contexts/AuthContext"

export default function AppRoute() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Welcome, {user?.email}</h1>
        <p className="text-gray-600">You are now signed in to your account.</p>
        <Button asChild className="px-6 py-3">
          <Link to="/engage">Go to Engage</Link>
        </Button>
      </div>
    </div>
  )
}