exports.seed = async (knex) => {
  // TRUNCATE ... CASCADE clears the dependent plants rows too, and RESTART
  // IDENTITY resets the sequences so seeded ids don't collide with the ids
  // Postgres hands out for rows inserted afterwards.
  await knex.raw('TRUNCATE TABLE revoked_tokens, plants, users RESTART IDENTITY CASCADE')
}
