// The suite exercises routing, validation and the auth gate, none of which
// open a connection. knex still needs a syntactically valid URL at import
// time, and the token helpers need a secret to verify against.
process.env.NODE_ENV = process.env.NODE_ENV || 'testing'
process.env.TESTING_DATABASE_URL =
  process.env.TESTING_DATABASE_URL || 'postgres://localhost:5432/water_my_plants_test'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-not-used-in-production'
