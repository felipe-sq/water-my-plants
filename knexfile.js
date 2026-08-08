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
  // certificate, so TLS is verified against the system CA store.
  //
  // rejectUnauthorized is set explicitly rather than left to the connection
  // string: node-postgres is migrating `sslmode=require` to libpq semantics,
  // where it means "encrypt but do not verify the certificate". Stating the
  // intent here keeps verification on through that change.
  production: {
    ...sharedConfig,
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: true },
    },
    pool: { min: 0, max: 10 },
  },
}
