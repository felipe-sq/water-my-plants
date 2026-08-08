import { useEffect, useState } from 'react'
import { Alert, Button, Card, Form, Spinner } from 'react-bootstrap'
import api, { errorMessage } from '../utils/api'
import { useUser } from '../utils/UserContext'

// Replaces the old `Users` page, which listed every account in the database
// and offered an Edit link next to each one. A person can now only see and
// change their own profile, which is what the API allows too.
export default function Profile() {
  const { user, setUser } = useUser()

  const [profile, setProfile] = useState(user || {})
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    api
      .get('/users/me')
      .then(({ data }) => {
        if (cancelled) return
        setProfile(data)
        setUser(data)
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err, 'Could not load your profile'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [setUser])

  const handleChange = (event) => {
    const { name, value } = event.target
    setProfile((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setStatus('')

    if (password && password.length < 8) {
      return setError('Password must be at least 8 characters')
    }

    setSubmitting(true)
    try {
      const changes = {
        username: profile.username,
        phone: profile.phone,
        email: profile.email,
        firstname: profile.firstname,
        lastname: profile.lastname,
      }
      if (password) changes.password = password

      const { data } = await api.put('/users/me', changes)
      setProfile(data)
      setUser(data)
      setPassword('')
      setStatus('Profile updated')
    } catch (err) {
      setError(errorMessage(err, 'Could not update your profile'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" role="status" />
        <span className="visually-hidden">Loading your profile</span>
      </div>
    )
  }

  return (
    <Card className="wmp-card mx-auto" style={{ maxWidth: '32rem' }}>
      <Card.Body>
        <h2 className="mb-4">My Profile</h2>

        {error && <Alert variant="danger">{error}</Alert>}
        {status && <Alert variant="success">{status}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="profile-username">
            <Form.Label>Username</Form.Label>
            <Form.Control
              name="username"
              type="text"
              value={profile.username || ''}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="profile-firstname">
            <Form.Label>First name</Form.Label>
            <Form.Control
              name="firstname"
              type="text"
              value={profile.firstname || ''}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="profile-lastname">
            <Form.Label>Last name</Form.Label>
            <Form.Control
              name="lastname"
              type="text"
              value={profile.lastname || ''}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="profile-email">
            <Form.Label>Email</Form.Label>
            <Form.Control
              name="email"
              type="email"
              value={profile.email || ''}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="profile-phone">
            <Form.Label>Phone</Form.Label>
            <Form.Control
              name="phone"
              type="tel"
              value={profile.phone || ''}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group className="mb-4" controlId="profile-password">
            <Form.Label>
              New password <span className="text-muted">(leave blank to keep current)</span>
            </Form.Label>
            <Form.Control
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Form.Group>

          <Button variant="warning" type="submit" disabled={submitting}>
            {submitting ? <Spinner as="span" size="sm" animation="border" /> : 'Save'}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  )
}
