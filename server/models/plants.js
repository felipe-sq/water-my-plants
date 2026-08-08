const db = require('../data/db-config')

// Every query is scoped by user_id. There is no unscoped "find all plants"
// helper on purpose — the routers cannot accidentally leak one user's plants
// to another if the model never offers a way to ask for them.
function findByUser(userId) {
  return db('plants').where({ user_id: userId }).orderBy('id')
}

function findByIdForUser(id, userId) {
  return db('plants').where({ id, user_id: userId }).first()
}

async function add(plant) {
  const [created] = await db('plants').insert(plant).returning('*')
  return created
}

async function update(id, userId, changes) {
  const [updated] = await db('plants')
    .where({ id, user_id: userId })
    .update(changes)
    .returning('*')
  return updated
}

function remove(id, userId) {
  return db('plants').where({ id, user_id: userId }).del()
}

module.exports = {
  findByUser,
  findByIdForUser,
  add,
  update,
  remove,
}
