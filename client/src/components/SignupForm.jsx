import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Alert, Button, Card, Form, Spinner } from 'react-bootstrap'
import api, { errorMessage } from '../utils/api'
import { useUser } from '../utils/UserContext'

const initialState = {
  username: '',
  password: '',
  phone: '',
  email: '',
  firstname: '',
  lastname: '',
}

export default function SignupForm() {
  const [newUser, setNewUser] = useState(initialState)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { login } = useUser()
  const navigate = useNavigate()

  const handleChange = (event) => {
    const { name, value } = event.target
    setNewUser((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!newUser.username) return setError('Choose a username')
    if (newUser.password.length < 8) {
      return setError('Password must be at least 8 characters')
    }

    setError('')
    setSubmitting(true)
    try {
      // Registering signs you straight in, so there's no second round trip.
      const { data } = await api.post('/users/register', newUser)
      login(data.user, data.token)
      navigate('/plants', { replace: true })
    } catch (err) {
      setError(errorMessage(err, 'Could not create your account'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="wmp-card mx-auto" style={{ maxWidth: '32rem' }}>
      <Card.Body>
        <h2 className="mb-4">Create Your Account</h2>

        {error && <Alert variant="danger">{error}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="signup-username">
            <Form.Label>Username</Form.Label>
            <Form.Control
              name="username"
              type="text"
              autoComplete="username"
              placeholder="Pick a username"
              value={newUser.username}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="signup-password">
            <Form.Label>Password</Form.Label>
            <Form.Control
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={newUser.password}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="signup-email">
            <Form.Label>
              Email <span className="text-muted">(optional)</span>
            </Form.Label>
            <Form.Control
              name="email"
              type="email"
              autoComplete="email"
              value={newUser.email}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group className="mb-4" controlId="signup-phone">
            <Form.Label>
              Phone <span className="text-muted">(optional)</span>
            </Form.Label>
            <Form.Control
              name="phone"
              type="tel"
              autoComplete="tel"
              value={newUser.phone}
              onChange={handleChange}
            />
          </Form.Group>

          <Button variant="success" size="lg" type="submit" disabled={submitting}>
            {submitting ? <Spinner as="span" size="sm" animation="border" /> : 'Sign Up!'}
          </Button>
        </Form>

        <p className="text-muted mt-4 mb-0">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </Card.Body>
    </Card>
  )
}
