import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert, Button, Card, Col, Row, Spinner } from 'react-bootstrap'
import api, { errorMessage } from '../utils/api'

export default function PlantsList() {
  const [plants, setPlants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadPlants = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/plants')
      setPlants(data)
      setError('')
    } catch (err) {
      setError(errorMessage(err, 'Could not load your plants'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPlants()
  }, [loadPlants])

  // The old delete handler only spliced the row out of local state, so the
  // plant reappeared on the next refresh. This one actually calls the API.
  const handleDelete = async (id) => {
    const previous = plants
    setPlants((current) => current.filter((plant) => plant.id !== id))
    try {
      await api.delete(`/plants/${id}`)
    } catch (err) {
      setPlants(previous)
      setError(errorMessage(err, 'Could not delete that plant'))
    }
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" role="status" />
        <span className="visually-hidden">Loading your plants</span>
      </div>
    )
  }

  return (
    <section>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">My Plants</h2>
        <Button as={Link} to="/plants/new" variant="success">
          Add a plant
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {plants.length === 0 ? (
        <Card className="wmp-card">
          <Card.Body>
            <p className="mb-3">No plants yet.</p>
            <Button as={Link} to="/plants/new" variant="warning">
              Add your first plant
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Row xs={1} sm={2} lg={3} className="g-3">
          {plants.map((plant) => (
            <Col key={plant.id}>
              <Card className="wmp-card h-100">
                <Card.Body className="d-flex flex-column">
                  <Card.Title>{plant.nickname}</Card.Title>
                  <Card.Subtitle className="text-muted mb-3">{plant.species}</Card.Subtitle>
                  <Card.Text>
                    Water every {plant.h2o_frequency} {plant.h2o_unit}
                  </Card.Text>
                  <div className="mt-auto d-flex gap-2">
                    <Button
                      as={Link}
                      to={`/plants/${plant.id}`}
                      size="sm"
                      variant="outline-secondary"
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => handleDelete(plant.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </section>
  )
}
