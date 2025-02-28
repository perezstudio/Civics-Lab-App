// app/components/auth/AuthGuard.tsx
import { useEffect, useState } from "react"
import { useNavigate } from "@remix-run/react"
import { isAuthenticated } from "~/services/auth.client"

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const [isChecking, setIsChecking] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authed = await isAuthenticated()
        
        if (!authed) {
          navigate("/login")
          return
        }
        
        setIsAuthorized(true)
      } catch (error) {
        console.error("Auth check error:", error)
        navigate("/login")
      } finally {
        setIsChecking(false)
      }
    }

    checkAuth()
  }, [navigate])

  if (isChecking) {
    return fallback || (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null // Will redirect in useEffect
  }

  return <>{children}</>
}