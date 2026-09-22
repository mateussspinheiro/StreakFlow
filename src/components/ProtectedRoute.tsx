import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'

interface ProtectedRouteProps {
  authenticated: boolean
  children: ReactNode
}

function ProtectedRoute({ authenticated, children }: ProtectedRouteProps) {
  const location = useLocation()
  return authenticated ? children : <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}${location.hash}` }} />
}

export default ProtectedRoute
