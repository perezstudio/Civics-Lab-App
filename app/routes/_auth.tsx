// app/routes/_auth.tsx
import { Outlet, useOutletContext } from "@remix-run/react"
import { Toaster } from "~/components/ui/sonner"
import { useAuth } from "~/contexts/AuthContext"
import { useEffect } from "react"
import { useNavigate } from "@remix-run/react"

export default function AuthLayout() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login')
    }
  }, [isAuthenticated, isLoading, navigate])
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }
  
  // If not authenticated, will redirect
  if (!isAuthenticated) {
    return null
  }
  
  return (
    <>
      <Outlet context={{ user }} />
      <Toaster position="top-right" />
    </>
  )
}