import { Link } from 'react-router-dom'
import { Button, Card, Col, Row } from 'react-bootstrap'

const features = [
  {
    title: 'Set a schedule that fits',
    body: 'Pick the cadence that works for you and your plants, and avoid over-watering by tracking each plant’s own needs.',
    image: '/brooke-lark-plant-img.jpg',
    alt: 'Potted plants arranged on a windowsill',
  },
  {
    title: 'Keep every plant in one place',
    body: 'Give each plant a nickname and a species so you always know which one you are looking at.',
    image: '/plant-database-img.jpeg',
    alt: 'A shelf of assorted houseplants',
  },
  {
    title: 'Change your mind any time',
    body: 'Watering schedules are easy to edit as plants grow, seasons change, or you move them to a new room.',
    image: '/plant-flex-schedule-img.jpeg',
    alt: 'A person tending to a leafy houseplant',
  },
]

export default function Homepage() {
  return (
    <section>
      <Card className="wmp-card mb-4">
        <Card.Body>
          <h2>Sign up and keep track of all your beloved plants!</h2>
          <p className="text-muted">Quick and easy sign-up process.</p>
          <div className="d-flex gap-2 justify-content-center flex-wrap">
            <Button as={Link} to="/signup" variant="success" size="lg">
              Sign Up!
            </Button>
            <Button as={Link} to="/login" variant="warning" size="lg">
              Log In
            </Button>
          </div>
        </Card.Body>
      </Card>

      <Row xs={1} md={3} className="g-3">
        {features.map((feature) => (
          <Col key={feature.title}>
            <Card className="wmp-card h-100">
              <Card.Img variant="top" src={feature.image} alt={feature.alt} />
              <Card.Body>
                <Card.Title as="h3" className="h5">
                  {feature.title}
                </Card.Title>
                <Card.Text>{feature.body}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </section>
  )
}
