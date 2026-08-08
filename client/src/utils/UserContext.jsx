import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import api, { clearSession, getStoredUser, getToken, storeSession } from './api'

const UserContext = createContext(null)

export function UserProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser())

  const login = useCallback((nextUser, token) => {
    storeSession(nextUser, token)
    setUser(nextUser)
  }, [])

  // Drops the local session without talking to the API. Deleting an account
  // takes this path: the row is already gone, so a /users/logout call would
  // only 401 against a token whose user no longer exists.
  const endSession = useCallback(() => {
    clearSession()
    setUser(null)
  }, [])

  const logout = useCallback(async () => {
    try {
      // Best effort: tells the API to revoke the token server-side. The local
      // session is cleared either way so a network failure can't strand
      // someone in a logged-in state.
      if (getToken()) await api.post('/users/logout')
    } catch {
      // ignored on purpose
    } finally {
      endSession()
    }
  }, [endSession])

  const value = useMemo(
    () => ({ user, setUser, login, logout, endSession, isAuthenticated: Boolean(user) }),
    [user, login, logout, endSession]
  )

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUser() {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used inside a <UserProvider>')
  }
  return context
}

export default UserContext
