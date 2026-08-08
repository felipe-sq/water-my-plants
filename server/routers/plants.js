const express = require('express')

const Plants = require('../models/plants')
const requireAuth = require('../middleware/auth')
const { validatePlant } = require('../middleware/validate')

const router = express.Router()

// Every plant route requires a valid token, and every query below is scoped to
// req.user.id. The 2021 router imported this middleware but never used it.
router.use(requireAuth)

router.get('/', async (req, res, next) => {
  try {
    res.status(200).json(await Plants.findByUser(req.user.id))
  } catch (err) {
    next(err)
  }
})

// Replaces a handler that returned `req.shout` — a leftover from a different
// scaffold that no middleware ever populated, so it always sent back nothing.
router.get('/:id', async (req, res, next) => {
  try {
    const plant = await Plants.findByIdForUser(req.params.id, req.user.id)
    if (!plant) return res.status(404).json({ message: 'Plant not found' })
    res.status(200).json(plant)
  } catch (err) {
    next(err)
  }
})

router.post('/', validatePlant, async (req, res, next) => {
  try {
    res.status(201).json(await Plants.add({ ...req.plant, user_id: req.user.id }))
  } catch (err) {
    next(err)
  }
})

// The old handler called `projects.update`, an identifier that did not exist
// in this file or anywhere in the project.
router.put('/:id', validatePlant, async (req, res, next) => {
  try {
    const updated = await Plants.update(req.params.id, req.user.id, req.plant)
    if (!updated) return res.status(404).json({ message: 'Plant not found' })
    res.status(200).json(updated)
  } catch (err) {
    next(err)
  }
})

// ...and this one called `Shouts.remove`, from that same unrelated scaffold.
router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await Plants.remove(req.params.id, req.user.id)
    if (!deleted) return res.status(404).json({ message: 'Plant not found' })
    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

module.exports = router
