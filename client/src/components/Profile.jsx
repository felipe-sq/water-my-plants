import { useEffect, useState } from 'react'
import { Alert, Button, Card, Form, Modal, Spinner } from 'react-bootstrap'
import api, { errorMessage } from '../utils/api'
import { useUser } from '../utils/UserContext'

// Replaces the old `Users` page, which listed every account in the database
// and offered an Edit link next to each one. A person can now only see and
// change their own profile, which is what the API allows too.
export default function Profile() {
  const { user, setUser, endSession } = useUser()

  const [profile, setProfile] = useState(user || {})
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let canceled = false
    api
      .get('/users/me')
      .then(({ data }) => {
        if (canceled) return
        setProfile(data)
        setUser(data)
      })
      .catch((err) => {
        if (!canceled) setError(errorMessage(err, 'Could not load your profile'))
      })
      .finally(() => {
        if (!canceled) setLoading(false)
      })

    return () => {
      canceled = true
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

  const handleDelete = async () => {
    setError('')
    setStatus('')
    setDeleting(true)

    try {
      // The API cascades to this account's plants, so nothing is left behind.
      await api.delete('/users/me')

      // Deleting an account is terminal, so drop the session and hard-reload
      // the homepage. A client-side navigate loses a race here: clearing the
      // user re-renders this route under RequireAuth, whose <Navigate> effect
      // runs afterwards and bounces to /login — a sign-in form for an account
      // that no longer exists.
      endSession()
      window.location.assign('/')
    } catch (err) {
      setError(errorMessage(err, 'Could not delete your account'))
      setConfirmingDelete(false)
      setDeleting(false)
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

        <hr className="my-4" />

        <h3 className="h5">Delete account</h3>
        <p className="text-muted">
          This removes your account and every plant on it. It cannot be undone.
        </p>
        <Button
          variant="outline-danger"
          type="button"
          onClick={() => setConfirmingDelete(true)}
        >
          Delete my account
        </Button>
      </Card.Body>

      <Modal show={confirmingDelete} onHide={() => setConfirmingDelete(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete your account?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-0">
            {profile.username ? <strong>{profile.username}</strong> : 'Your account'} and all of
            its plants will be permanently deleted. This cannot be undone.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() => setConfirmingDelete(false)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? <Spinner as="span" size="sm" animation="border" /> : 'Delete account'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Card>
  )
}
