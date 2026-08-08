import axios from 'axios'

const TOKEN_KEY = 'wmp.token'
const USER_KEY = 'wmp.user'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function storeSession(user, token) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

// Same-origin `/api`, which the Vite dev server proxies to the local API and
// Vercel routes to the serverless function. The 2021 client had a Heroku URL
// hardcoded in four separate files.
const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// A revoked, expired, or tampered token should drop the client back to a
// logged-out state rather than leaving a half-authenticated UI on screen.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && getToken()) {
      clearSession()
      window.location.assign('/login')
    }
    return Promise.reject(error)
  }
)

// Turns an axios failure into something worth showing a person.
export function errorMessage(error, fallback = 'Something went wrong') {
  return error?.response?.data?.message || error?.message || fallback
}

export default api
