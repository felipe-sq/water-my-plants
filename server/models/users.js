const db = require('../data/db-config')

// Everything the API is willing to send back about a user. Selecting columns
// explicitly is what keeps the bcrypt hash out of every response — the old
// `GET /api/users` handed the whole row, hashes included, to any caller.
const PUBLIC_FIELDS = [
  'id',
  'username',
  'phone',
  'email',
  'firstname',
  'lastname',
  'created_at',
]

function findById(id) {
  return db('users').select(PUBLIC_FIELDS).where({ id }).first()
}

// Deliberately returns the full row, hash included, because login needs it.
// Callers must not pass the result straight to res.json().
function findByUsernameWithPassword(username) {
  return db('users').where({ username }).first()
}

async function add(user) {
  const [created] = await db('users').insert(user).returning(PUBLIC_FIELDS)
  return created
}

async function update(id, changes) {
  const [updated] = await db('users')
    .where({ id })
    .update(changes)
    .returning(PUBLIC_FIELDS)
  return updated
}

function remove(id) {
  return db('users').where({ id }).del()
}

module.exports = {
  PUBLIC_FIELDS,
  findById,
  findByUsernameWithPassword,
  add,
  update,
  remove,
}
