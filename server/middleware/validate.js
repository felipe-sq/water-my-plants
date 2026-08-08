const PLANT_UNITS = ['hours', 'days', 'weeks', 'months']

function badRequest(res, message) {
  return res.status(400).json({ message })
}

function validateCredentials(req, res, next) {
  const { username, password } = req.body || {}

  if (typeof username !== 'string' || !username.trim()) {
    return badRequest(res, 'username is required')
  }
  if (typeof password !== 'string' || !password) {
    return badRequest(res, 'password is required')
  }

  req.body.username = username.trim()
  next()
}

function validateRegistration(req, res, next) {
  const { password } = req.body || {}

  if (typeof password === 'string' && password.length < 8) {
    return badRequest(res, 'password must be at least 8 characters')
  }
  next()
}

function validatePlant(req, res, next) {
  const { nickname, species, h2o_frequency, h2o_unit } = req.body || {}

  if (typeof nickname !== 'string' || !nickname.trim()) {
    return badRequest(res, 'nickname is required')
  }
  if (typeof species !== 'string' || !species.trim()) {
    return badRequest(res, 'species is required')
  }

  const frequency = Number(h2o_frequency)
  if (!Number.isInteger(frequency) || frequency < 1) {
    return badRequest(res, 'h2o_frequency must be a whole number of 1 or more')
  }
  if (!PLANT_UNITS.includes(h2o_unit)) {
    return badRequest(res, `h2o_unit must be one of: ${PLANT_UNITS.join(', ')}`)
  }

  // Only the validated fields move on, so a caller cannot smuggle `user_id`
  // or `id` through the request body and reassign someone else's plant.
  req.plant = {
    nickname: nickname.trim(),
    species: species.trim(),
    h2o_frequency: frequency,
    h2o_unit,
    image: typeof req.body.image === 'string' ? req.body.image.trim() || null : null,
  }
  next()
}

module.exports = {
  PLANT_UNITS,
  validateCredentials,
  validateRegistration,
  validatePlant,
}
