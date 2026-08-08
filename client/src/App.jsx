import { Navigate, Route, Routes } from 'react-router-dom'
import { Container } from 'react-bootstrap'

import SiteNav from './components/SiteNav'
import Homepage from './components/Homepage'
import Login from './components/Login'
import SignupForm from './components/SignupForm'
import PlantsList from './components/PlantsList'
import PlantForm from './components/PlantForm'
import Profile from './components/Profile'
import RequireAuth from './utils/RequireAuth'

export default function App() {
  return (
    <>
      <header className="wmp-header text-center py-4">
        <h1 className="wmp-title mb-1">Remember The Plants!</h1>
        <p className="text-muted mb-0">A scheduling app for plant care</p>
      </header>

      <SiteNav />

      <Container as="main" className="pb-5">
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignupForm />} />

          {/* Everything below the guard needs a valid session. */}
          <Route element={<RequireAuth />}>
            <Route path="/plants" element={<PlantsList />} />
            <Route path="/plants/new" element={<PlantForm />} />
            <Route path="/plants/:id" element={<PlantForm />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Container>
    </>
  )
}
