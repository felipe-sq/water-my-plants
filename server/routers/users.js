const express = require('express')
const bcrypt = require('bcryptjs')

const Users = require('../models/users')
const RevokedTokens = require('../models/revoked-tokens')
const requireAuth = require('../middleware/auth')
const { validateCredentials, validateRegistration } = require('../middleware/validate')
const { generateToken } = require('../util/tokens')

const router = express.Router()

const ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 10

router.post('/register', validateCredentials, validateRegistration, async (req, res, next) => {
  try {
    const { username, password, phone, email, firstname, lastname } = req.body

    const hashed = await bcrypt.hash(password, ROUNDS)
    const user = await Users.add({
      username,
      password: hashed,
      phone,
      email,
      firstname,
      lastname,
    })

    res.status(201).json({ user, token: generateToken(user) })
  } catch (err) {
    // 23505 is the Postgres unique-violation code, raised by the new UNIQUE
    // constraint on users.username.
    if (err.code === '23505') {
      return res.status(409).json({ message: 'That username is already taken' })
    }
    next(err)
  }
})

router.post('/login', validateCredentials, async (req, res, next) => {
  try {
    const { username, password } = req.body
    const user = await Users.findByUsernameWithPassword(username)

    // The old handler read `user.password` before checking that `user` existed,
    // so an unknown username threw and surfaced as a 500 instead of a 401.
    const validPassword = user && (await bcrypt.compare(password, user.password))
    if (!user || !validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const { password: _hash, ...safeUser } = user
    res.status(200).json({ user: safeUser, token: generateToken(safeUser) })
  } catch (err) {
    next(err)
  }
})

// Declared before the parameterised routes below. In the original router the
// logout handler sat after `GET /:id`, so `/logout` was swallowed as an id.
router.post('/logout', requireAuth, async (req, res, next) => {
  try {
    await RevokedTokens.add(req.token, req.tokenExpiresAt)
    await RevokedTokens.pruneExpired()
    res.status(200).json({ message: 'Logged out' })
  } catch (err) {
    next(err)
  }
})

// `GET /api/users` used to return every user in the database, bcrypt hashes
// included, with no authentication. It is replaced by these self-scoped
// routes — a caller can only ever read or change their own account.
router.get('/me', requireAuth, (req, res) => {
  res.status(200).json(req.user)
})

router.put('/me', requireAuth, async (req, res, next) => {
  try {
    const { username, phone, email, firstname, lastname, password } = req.body || {}

    const changes = {}
    if (username !== undefined) changes.username = String(username).trim()
    if (phone !== undefined) changes.phone = phone
    if (email !== undefined) changes.email = email
    if (firstname !== undefined) changes.firstname = firstname
    if (lastname !== undefined) changes.lastname = lastname

    if (password !== undefined) {
      if (typeof password !== 'string' || password.length < 8) {
        return res.status(400).json({ message: 'password must be at least 8 characters' })
      }
      changes.password = await bcrypt.hash(password, ROUNDS)
    }

    if (!Object.keys(changes).length) {
      return res.status(400).json({ message: 'No updatable fields supplied' })
    }

    res.status(200).json(await Users.update(req.user.id, changes))
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: 'That username is already taken' })
    }
    next(err)
  }
})

router.delete('/me', requireAuth, async (req, res, next) => {
  try {
    await Users.remove(req.user.id)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

module.exports = router
