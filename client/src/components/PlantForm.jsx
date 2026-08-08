import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Alert, Button, Card, Form, Spinner } from 'react-bootstrap'
import api, { errorMessage } from '../utils/api'

// Must stay in step with PLANT_UNITS in server/middleware/validate.js.
const UNITS = ['hours', 'days', 'weeks', 'months']

const emptyPlant = { nickname: '', species: '', h2o_frequency: 1, h2o_unit: 'days' }

// One component for both routes. The 2021 version had AddNewPlant and
// UpdatePlant as near-identical files that had drifted apart — UpdatePlant
// used camelCase field names the API never recognised.
export default function PlantForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)

  const [plant, setPlant] = useState(emptyPlant)
  const [loading, setLoading] = useState(isEdit)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const navigate = useNavigate()

  useEffect(() => {
    if (!isEdit) return

    let cancelled = false
    api
      .get(`/plants/${id}`)
      .then(({ data }) => {
        if (!cancelled) setPlant(data)
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err, 'Could not load that plant'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id, isEdit])

  const handleChange = (event) => {
    const { name, value } = event.target
    setPlant((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    const payload = {
      nickname: plant.nickname,
      species: plant.species,
      h2o_frequency: Number(plant.h2o_frequency),
      h2o_unit: plant.h2o_unit,
    }

    try {
      if (isEdit) {
        await api.put(`/plants/${id}`, payload)
      } else {
        await api.post('/plants', payload)
      }
      navigate('/plants')
    } catch (err) {
      setError(errorMessage(err, 'Could not save that plant'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" role="status" />
        <span className="visually-hidden">Loading</span>
      </div>
    )
  }

  return (
    <Card className="wmp-card mx-auto" style={{ maxWidth: '32rem' }}>
      <Card.Body>
        <h2 className="mb-4">{isEdit ? 'Update Plant' : 'Add New Plant'}</h2>

        {error && <Alert variant="danger">{error}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="plant-nickname">
            <Form.Label>Nickname</Form.Label>
            <Form.Control
              name="nickname"
              type="text"
              placeholder="What do you call it?"
              value={plant.nickname}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="plant-species">
            <Form.Label>Species</Form.Label>
            <Form.Control
              name="species"
              type="text"
              placeholder="Bird of Paradise"
              value={plant.species}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="plant-frequency">
            <Form.Label>Water every</Form.Label>
            <div className="d-flex gap-2">
              <Form.Control
                name="h2o_frequency"
                type="number"
                min="1"
                step="1"
                value={plant.h2o_frequency}
                onChange={handleChange}
              />
              <Form.Select name="h2o_unit" value={plant.h2o_unit} onChange={handleChange}>
                {UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </Form.Select>
            </div>
          </Form.Group>

          <div className="d-flex gap-2 mt-4">
            <Button variant="success" type="submit" disabled={submitting}>
              {submitting ? <Spinner as="span" size="sm" animation="border" /> : 'Save'}
            </Button>
            <Button variant="outline-secondary" type="button" onClick={() => navigate('/plants')}>
              Cancel
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  )
}
