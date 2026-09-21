import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { SunLogo } from '@/components/ui/SunLogo'

export function RequireAuth() {
  const { user, loading, isAdmin } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ivory">
        <SunLogo size={40} className="animate-pulse" />
      </div>
    )
  }

  if (!user || !isAdmin) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}
