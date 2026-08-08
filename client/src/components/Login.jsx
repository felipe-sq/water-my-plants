import { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { Alert, Button, Card, Form, Spinner } from 'react-bootstrap'
import api, { errorMessage } from '../utils/api'
import { useUser } from '../utils/UserContext'

const initialState = { username: '', password: '' }

export default function Login() {
  const [credentials, setCredentials] = useState(initialState)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { login } = useUser()
  const navigate = useNavigate()
  const location = useLocation()

  // Send people back where they were headed before the auth redirect.
  const destination = location.state?.from?.pathname || '/plants'

  const handleChange = (event) => {
    const { name, value } = event.target
    setCredentials((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!credentials.username && !credentials.password) {
      return setError('Enter your username and password')
    }
    if (!credentials.username) return setError('Enter your username')
    if (!credentials.password) return setError('Enter your password')

    setError('')
    setSubmitting(true)
    try {
      const { data } = await api.post('/users/login', credentials)
      login(data.user, data.token)
      navigate(destination, { replace: true })
    } catch (err) {
      setError(errorMessage(err, 'Could not log you in'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="wmp-card mx-auto" style={{ maxWidth: '32rem' }}>
      <Card.Body>
        <h2 className="mb-4">Log Me In!</h2>

        {error && <Alert variant="danger">{error}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="login-username">
            <Form.Label>Username</Form.Label>
            <Form.Control
              name="username"
              type="text"
              autoComplete="username"
              placeholder="Your username"
              value={credentials.username}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group className="mb-4" controlId="login-password">
            <Form.Label>Password</Form.Label>
            <Form.Control
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Your password"
              value={credentials.password}
              onChange={handleChange}
            />
          </Form.Group>

          <Button variant="warning" size="lg" type="submit" disabled={submitting}>
            {submitting ? <Spinner as="span" size="sm" animation="border" /> : 'Log Me In!'}
          </Button>
        </Form>

        <p className="text-muted mt-4 mb-0">
          No account yet? <Link to="/signup">Sign up</Link>
        </p>
      </Card.Body>
    </Card>
  )
}
