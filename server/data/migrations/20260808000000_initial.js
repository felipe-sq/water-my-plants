exports.up = async (knex) => {
  await knex.schema.createTable('users', (users) => {
    users.increments('id')
    users.string('username', 200).notNullable().unique()
    users.string('password', 200).notNullable()
    users.string('phone', 20)
    users.string('email', 320)
    users.string('firstname', 200)
    users.string('lastname', 200)
    users.timestamps(false, true)
  })

  // Plants belong to the user who created them. The original schema had no
  // owner column, so every account could read and edit every other account's
  // plants. Deleting an account now takes its plants with it.
  await knex.schema.createTable('plants', (plants) => {
    plants.increments('id')
    plants
      .integer('user_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
      .onUpdate('CASCADE')
    plants.string('nickname', 200).notNullable()
    plants.string('species', 200).notNullable()
    plants.integer('h2o_frequency').notNullable()
    plants.string('h2o_unit', 20).notNullable()
    plants.string('image', 500)
    plants.timestamps(false, true)

    plants.index('user_id')
  })

  // Logging out adds the caller's still-valid JWT here so it stops being
  // accepted before its natural expiry.
  await knex.schema.createTable('revoked_tokens', (revoked) => {
    revoked.increments('id')
    revoked.string('token', 500).notNullable().unique()
    revoked.timestamp('expires_at').notNullable()
    revoked.timestamp('revoked_at').notNullable().defaultTo(knex.fn.now())
  })
}

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('revoked_tokens')
  await knex.schema.dropTableIfExists('plants')
  await knex.schema.dropTableIfExists('users')
}
