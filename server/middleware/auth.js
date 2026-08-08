const Users = require('../models/users')
const RevokedTokens = require('../models/revoked-tokens')
const { verifyToken, extractToken } = require('../util/tokens')

// Gate for every route that touches user-owned data. The 2021 version of this
// file existed but was never applied to a single route, which left the whole
// API open. It is now wired up in server/routers/*.js.
module.exports = async function requireAuth(req, res, next) {
  try {
    const token = extractToken(req)
    if (!token) {
      return res.status(401).json({ message: 'Missing authentication token' })
    }

    let decoded
    try {
      decoded = verifyToken(token)
    } catch {
      return res.status(401).json({ message: 'Invalid or expired token' })
    }

    if (await RevokedTokens.isRevoked(token)) {
      return res.status(401).json({ message: 'Token has been revoked' })
    }

    // The account may have been deleted since the token was issued.
    const user = await Users.findById(decoded.sub)
    if (!user) {
      return res.status(401).json({ message: 'Invalid or expired token' })
    }

    req.user = user
    req.token = token
    req.tokenExpiresAt = new Date(decoded.exp * 1000)
    next()
  } catch (err) {
    next(err)
  }
}
