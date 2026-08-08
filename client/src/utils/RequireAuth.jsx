import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useUser } from './UserContext'

// Router v7 replacement for the v5 `PrivateRoute` render-prop component, which
// was written back in 2021 but never actually mounted in the route tree.
export default function RequireAuth() {
  const { isAuthenticated } = useUser()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return <Outlet />
}
