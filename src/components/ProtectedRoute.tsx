import type { ReactNode } from 'react'
import { Navigate } from 'react-router'

interface ProtectedRouteProps {
  authenticated: boolean
  children: ReactNode
}

function ProtectedRoute({ authenticated, children }: ProtectedRouteProps) {
  return authenticated ? children : <Navigate to="/login" replace />
}

export default ProtectedRoute
