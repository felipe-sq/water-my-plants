const db = require('../data/db-config')

function add(token, expiresAt) {
  return db('revoked_tokens')
    .insert({ token, expires_at: expiresAt })
    .onConflict('token')
    .ignore()
}

async function isRevoked(token) {
  const hit = await db('revoked_tokens').where({ token }).first()
  return Boolean(hit)
}

// Rows are only useful until the token would have expired on its own. Called
// opportunistically on logout so the table doesn't grow without bound.
function pruneExpired() {
  return db('revoked_tokens').where('expires_at', '<', new Date()).del()
}

module.exports = { add, isRevoked, pruneExpired }
