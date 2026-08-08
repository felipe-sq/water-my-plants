const jwt = require('jsonwebtoken')

const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d'

function getSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET is not set — refusing to sign or verify tokens.')
  }
  return secret
}

function generateToken(user) {
  return jwt.sign({ sub: user.id, username: user.username }, getSecret(), {
    expiresIn: EXPIRES_IN,
  })
}

function verifyToken(token) {
  return jwt.verify(token, getSecret())
}

// Accepts "Bearer <token>" and a bare "<token>", because the browser client
// has sent the raw value in the Authorization header since 2021.
function extractToken(req) {
  const header = req.get('authorization')
  if (!header) return null

  const [scheme, value] = header.split(' ')
  if (value && /^Bearer$/i.test(scheme)) return value.trim()
  return header.trim() || null
}

module.exports = { generateToken, verifyToken, extractToken }
