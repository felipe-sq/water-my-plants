const bcrypt = require('bcryptjs')

const ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 10

exports.seed = async (knex) => {
  // The original seed stored this password in plain text, so the seeded
  // account could never actually log in — bcrypt.compare always failed.
  const [albert] = await knex('users')
    .insert({
      username: 'a1stein',
      password: await bcrypt.hash('password', ROUNDS),
      phone: '3344449088',
      email: 'test@example.com',
      firstname: 'Albert',
      lastname: 'Einstein',
    })
    .returning('*')

  await knex('plants').insert([
    {
      user_id: albert.id,
      nickname: 'Pipa',
      species: 'Bird of Paradise',
      h2o_frequency: 2,
      h2o_unit: 'days',
      image: null,
    },
    {
      user_id: albert.id,
      nickname: 'Spike',
      species: 'Aloe Vera',
      h2o_frequency: 3,
      h2o_unit: 'weeks',
      image: null,
    },
  ])
}
