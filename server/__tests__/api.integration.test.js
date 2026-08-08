// describe/it/expect come from vitest's `globals: true`.
// Requires a reachable Postgres at TESTING_DATABASE_URL. Run with:
//   npm run test:integration
const request = require('supertest')

const app = require('../app')
const db = require('../data/db-config')

const agent = () => request(app)

async function registerUser(username, password = 'password123') {
  const res = await agent().post('/api/users/register').send({ username, password })
  return res.body.token
}

beforeAll(async () => {
  await db.migrate.latest()
})

beforeEach(async () => {
  await db.raw('TRUNCATE TABLE revoked_tokens, plants, users RESTART IDENTITY CASCADE')
})

afterAll(async () => {
  await db.destroy()
})

describe('registration and login', () => {
  it('registers an account and returns a usable token', async () => {
    const res = await agent()
      .post('/api/users/register')
      .send({ username: 'newbie', password: 'password123' })

    expect(res.status).toBe(201)
    expect(res.body.token).toBeTruthy()
    expect(res.body.user.password).toBeUndefined()
  })

  it('rejects a duplicate username with 409, not a second account', async () => {
    await registerUser('twice')
    const res = await agent()
      .post('/api/users/register')
      .send({ username: 'twice', password: 'password123' })

    expect(res.status).toBe(409)
    const [{ count }] = await db('users').where({ username: 'twice' }).count()
    expect(Number(count)).toBe(1)
  })

  it('logs in with the right password', async () => {
    await registerUser('loginer')
    const res = await agent()
      .post('/api/users/login')
      .send({ username: 'loginer', password: 'password123' })

    expect(res.status).toBe(200)
    expect(res.body.token).toBeTruthy()
  })

  it('rejects the wrong password with 401', async () => {
    await registerUser('loginer')
    const res = await agent()
      .post('/api/users/login')
      .send({ username: 'loginer', password: 'not-the-password' })

    expect(res.status).toBe(401)
  })

  // The 2021 handler read user.password before checking the user existed,
  // so this path threw and surfaced as a 500.
  it('rejects an unknown username with 401 rather than 500', async () => {
    const res = await agent()
      .post('/api/users/login')
      .send({ username: 'ghost', password: 'password123' })

    expect(res.status).toBe(401)
  })

  it('stores the password as a bcrypt hash, never plaintext', async () => {
    await registerUser('hashed')
    const row = await db('users').where({ username: 'hashed' }).first()

    expect(row.password).not.toBe('password123')
    expect(row.password).toMatch(/^\$2[aby]\$/)
  })
})

describe('plant CRUD', () => {
  let token

  beforeEach(async () => {
    token = await registerUser('owner')
  })

  it('creates, reads, updates and deletes a plant', async () => {
    const created = await agent()
      .post('/api/plants')
      .set('Authorization', `Bearer ${token}`)
      .send({ nickname: 'Fernie', species: 'Boston Fern', h2o_frequency: 4, h2o_unit: 'days' })
    expect(created.status).toBe(201)

    const id = created.body.id

    // Replaces a handler that returned an undefined `req.shout`.
    const read = await agent().get(`/api/plants/${id}`).set('Authorization', `Bearer ${token}`)
    expect(read.status).toBe(200)
    expect(read.body.nickname).toBe('Fernie')

    // Replaces a handler that called an undefined `projects.update`.
    const updated = await agent()
      .put(`/api/plants/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ nickname: 'Fernie', species: 'Boston Fern', h2o_frequency: 9, h2o_unit: 'weeks' })
    expect(updated.status).toBe(200)
    expect(updated.body.h2o_frequency).toBe(9)

    // Replaces a handler that called an undefined `Shouts.remove`.
    const deleted = await agent()
      .delete(`/api/plants/${id}`)
      .set('Authorization', `Bearer ${token}`)
    expect(deleted.status).toBe(204)

    const gone = await agent().get(`/api/plants/${id}`).set('Authorization', `Bearer ${token}`)
    expect(gone.status).toBe(404)
  })

  it('stamps the creating user as the owner', async () => {
    const created = await agent()
      .post('/api/plants')
      .set('Authorization', `Bearer ${token}`)
      .send({ nickname: 'Spike', species: 'Aloe', h2o_frequency: 2, h2o_unit: 'weeks' })

    const owner = await db('users').where({ username: 'owner' }).first()
    expect(created.body.user_id).toBe(owner.id)
  })

  it('rejects an invalid frequency or unit', async () => {
    const bad = await agent()
      .post('/api/plants')
      .set('Authorization', `Bearer ${token}`)
      .send({ nickname: 'X', species: 'Y', h2o_frequency: 0, h2o_unit: 'fortnights' })

    expect(bad.status).toBe(400)
  })

  it('ignores a user_id supplied in the request body', async () => {
    const intruder = await registerUser('intruder')
    const intruderRow = await db('users').where({ username: 'intruder' }).first()

    const created = await agent()
      .post('/api/plants')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nickname: 'Planted',
        species: 'Ficus',
        h2o_frequency: 1,
        h2o_unit: 'days',
        user_id: intruderRow.id,
      })

    const owner = await db('users').where({ username: 'owner' }).first()
    expect(created.body.user_id).toBe(owner.id)
    expect(created.body.user_id).not.toBe(intruderRow.id)
    expect(intruder).toBeTruthy()
  })
})

// The single most important behavior in this rebuild: the 2021 schema had no
// owner column, so every account shared one global plant list.
describe('cross-user isolation', () => {
  let tokenA
  let tokenB
  let plantId

  beforeEach(async () => {
    tokenA = await registerUser('alice')
    tokenB = await registerUser('bob')

    const created = await agent()
      .post('/api/plants')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ nickname: 'Alices Fern', species: 'Fern', h2o_frequency: 3, h2o_unit: 'days' })
    plantId = created.body.id
  })

  it("does not list another user's plants", async () => {
    const res = await agent().get('/api/plants').set('Authorization', `Bearer ${tokenB}`)
    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  it.each([
    ['get', 'read'],
    ['delete', 'delete'],
  ])("does not let another user %s someone else's plant", async (method) => {
    const res = await agent()
      [method](`/api/plants/${plantId}`)
      .set('Authorization', `Bearer ${tokenB}`)
    expect(res.status).toBe(404)
  })

  it("does not let another user update someone else's plant", async () => {
    const res = await agent()
      .put(`/api/plants/${plantId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ nickname: 'Stolen', species: 'Nope', h2o_frequency: 1, h2o_unit: 'days' })

    expect(res.status).toBe(404)

    const row = await db('plants').where({ id: plantId }).first()
    expect(row.nickname).toBe('Alices Fern')
  })
})

describe('profile', () => {
  let token

  beforeEach(async () => {
    token = await registerUser('profiler')
  })

  it('returns the caller and never the password hash', async () => {
    const res = await agent().get('/api/users/me').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.username).toBe('profiler')
    expect(res.body.password).toBeUndefined()
  })

  it('updates the caller and re-hashes a new password', async () => {
    const res = await agent()
      .put('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'new@example.com', password: 'brand-new-password' })

    expect(res.status).toBe(200)
    expect(res.body.email).toBe('new@example.com')
    expect(res.body.password).toBeUndefined()

    const relogin = await agent()
      .post('/api/users/login')
      .send({ username: 'profiler', password: 'brand-new-password' })
    expect(relogin.status).toBe(200)
  })

  it('deletes the account and cascades to its plants', async () => {
    await agent()
      .post('/api/plants')
      .set('Authorization', `Bearer ${token}`)
      .send({ nickname: 'Doomed', species: 'Fern', h2o_frequency: 1, h2o_unit: 'days' })

    const res = await agent().delete('/api/users/me').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(204)

    const [{ count }] = await db('plants').count()
    expect(Number(count)).toBe(0)
  })
})

describe('logout', () => {
  // In 2021 this route was declared after GET /:id, which swallowed it.
  it('revokes the token so it stops working', async () => {
    const token = await registerUser('quitter')

    const before = await agent().get('/api/plants').set('Authorization', `Bearer ${token}`)
    expect(before.status).toBe(200)

    const out = await agent().post('/api/users/logout').set('Authorization', `Bearer ${token}`)
    expect(out.status).toBe(200)

    const after = await agent().get('/api/plants').set('Authorization', `Bearer ${token}`)
    expect(after.status).toBe(401)
  })

  // Regression test for token determinism: `iat` has second resolution, so
  // without the jti claim this second login returned the token that was just
  // revoked, locking the account out until the clock ticked over.
  it('lets the same user log straight back in within the same second', async () => {
    await registerUser('fastfingers')

    const first = await agent()
      .post('/api/users/login')
      .send({ username: 'fastfingers', password: 'password123' })
    await agent().post('/api/users/logout').set('Authorization', `Bearer ${first.body.token}`)

    const second = await agent()
      .post('/api/users/login')
      .send({ username: 'fastfingers', password: 'password123' })
    expect(second.body.token).not.toBe(first.body.token)

    const res = await agent().get('/api/plants').set('Authorization', `Bearer ${second.body.token}`)
    expect(res.status).toBe(200)
  })
})
