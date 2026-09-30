import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'

interface ProtectedRouteProps {
  authenticated: boolean
  isLoading?: boolean
  children: ReactNode
}

function ProtectedRoute({ authenticated, isLoading, children }: ProtectedRouteProps) {
  const location = useLocation()
  if (isLoading) return <main className="auth-shell grid min-h-screen place-items-center"><p role="status">Verificando sessão…</p></main>
  return authenticated ? children : <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}${location.hash}` }} />
}

export default ProtectedRoute
