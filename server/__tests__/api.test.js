// describe/it/expect come from vitest's `globals: true` (see vitest.config.mjs).
const request = require('supertest')

const app = require('../app')

// These cover routing, middleware order, validation and the auth gate — every
// path that rejects a request before it reaches Postgres. The database-backed
// happy paths need a real server (see "Testing" in the README), because the
// project has no in-memory Postgres substitute.

describe('service routes', () => {
  it('reports that the API is running', async () => {
    const res = await request(app).get('/api')
    expect(res.status).toBe(200)
    expect(res.body.message).toBe('API running')
  })

  it('returns JSON, not HTML, for an unknown route', async () => {
    const res = await request(app).get('/api/nope')
    expect(res.status).toBe(404)
    expect(res.body.message).toMatch(/No route matches GET/)
  })
})

describe('auth gate', () => {
  // The 2021 API left every one of these routes publicly readable.
  const guarded = [
    ['get', '/api/plants'],
    ['get', '/api/plants/1'],
    ['post', '/api/plants'],
    ['put', '/api/plants/1'],
    ['delete', '/api/plants/1'],
    ['get', '/api/users/me'],
    ['put', '/api/users/me'],
    ['delete', '/api/users/me'],
    ['post', '/api/users/logout'],
  ]

  it.each(guarded)('rejects unauthenticated %s %s', async (method, path) => {
    const res = await request(app)[method](path)
    expect(res.status).toBe(401)
  })

  it('rejects a token that is not a valid JWT', async () => {
    const res = await request(app).get('/api/plants').set('Authorization', 'Bearer nonsense')
    expect(res.status).toBe(401)
    expect(res.body.message).toBe('Invalid or expired token')
  })

  it('never echoes a stack trace to the client in production', async () => {
    const res = await request(app).get('/api/nope')
    expect(res.body.stack).toBeUndefined()
  })
})

describe('credential validation', () => {
  it('rejects a login with no body', async () => {
    const res = await request(app).post('/api/users/login').send({})
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('username is required')
  })

  it('rejects a login with a username but no password', async () => {
    const res = await request(app).post('/api/users/login').send({ username: 'a1stein' })
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('password is required')
  })

  it('rejects registration with a short password', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({ username: 'newbie', password: 'short' })
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/at least 8 characters/)
  })

  it('rejects a blank username made only of whitespace', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({ username: '   ', password: 'longenough1' })
    expect(res.status).toBe(400)
    expect(res.body.message).toBe('username is required')
  })
})
