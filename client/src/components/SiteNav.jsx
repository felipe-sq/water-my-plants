import { Container, Nav, Navbar } from 'react-bootstrap'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useUser } from '../utils/UserContext'

// A single nav for the whole app. The 2021 build had two overlapping navbars
// and a second <Switch> nested inside one of them, so several routes were
// declared and rendered twice.
export default function SiteNav() {
  const { isAuthenticated, user, logout } = useUser()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <Navbar expand="sm" bg="light" variant="light" className="mb-4" collapseOnSelect>
      <Container>
        <Navbar.Brand as={Link} to="/">
          Water My Plants
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-nav" />
        <Navbar.Collapse id="main-nav">
          <Nav className="me-auto">
            {isAuthenticated ? (
              <>
                <Nav.Link as={NavLink} to="/plants" end>
                  My Plants
                </Nav.Link>
                <Nav.Link as={NavLink} to="/plants/new">
                  Add Plant
                </Nav.Link>
                <Nav.Link as={NavLink} to="/profile">
                  Profile
                </Nav.Link>
              </>
            ) : (
              <>
                <Nav.Link as={NavLink} to="/signup">
                  Sign Up
                </Nav.Link>
                <Nav.Link as={NavLink} to="/login">
                  Login
                </Nav.Link>
              </>
            )}
          </Nav>

          {isAuthenticated && (
            <Nav className="align-items-sm-center">
              <Navbar.Text className="me-3">
                Signed in as <strong>{user?.username}</strong>
              </Navbar.Text>
              <Nav.Link as="button" onClick={handleLogout}>
                Log Out
              </Nav.Link>
            </Nav>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  )
}
