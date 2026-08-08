require('dotenv').config()

const sharedConfig = {
  client: 'pg',
  migrations: { directory: './server/data/migrations' },
  seeds: { directory: './server/data/seeds' },
}

module.exports = {
  development: {
    ...sharedConfig,
    connection: process.env.DEV_DATABASE_URL,
  },

  testing: {
    ...sharedConfig,
    connection: process.env.TESTING_DATABASE_URL,
  },

  // Hosted Postgres (Neon, Supabase, RDS) presents a publicly trusted
  // certificate, so TLS is verified normally against the system CA store.
  // Append `?sslmode=require` to DATABASE_URL to force TLS on the wire.
  production: {
    ...sharedConfig,
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: true,
    },
    pool: { min: 0, max: 10 },
  },
}
