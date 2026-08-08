// describe/it/expect come from vitest's `globals: true` (see vitest.config.mjs).
const jwt = require('jsonwebtoken')

const { generateToken, verifyToken, extractToken } = require('../util/tokens')

const user = { id: 1, username: 'a1stein' }

describe('generateToken', () => {
  // Regression test. `iat` only has second resolution, so a payload of just
  // {sub, username} signed twice inside the same second produced two
  // byte-identical tokens. Because logout records the exact token string in
  // revoked_tokens, logging out and back in within that second returned a
  // token that was already on the revocation list, and every subsequent
  // request 401'd until the clock ticked over.
  it('issues a distinct token every time, even within the same second', () => {
    const tokens = new Set(Array.from({ length: 200 }, () => generateToken(user)))
    expect(tokens.size).toBe(200)
  })

  it('carries a unique jti claim', () => {
    const a = jwt.decode(generateToken(user))
    const b = jwt.decode(generateToken(user))

    expect(a.jti).toBeTruthy()
    expect(a.jti).not.toBe(b.jti)
  })

  it('identifies the user in the subject claim', () => {
    const decoded = jwt.decode(generateToken(user))
    expect(decoded.sub).toBe(user.id)
    expect(decoded.username).toBe(user.username)
  })

  it('round-trips through verifyToken', () => {
    expect(verifyToken(generateToken(user)).sub).toBe(user.id)
  })

  it('rejects a token signed with a different secret', () => {
    const foreign = jwt.sign({ sub: 1 }, 'some-other-secret')
    expect(() => verifyToken(foreign)).toThrow()
  })
})

describe('extractToken', () => {
  const req = (authorization) => ({ get: () => authorization })

  it('reads a Bearer token', () => {
    expect(extractToken(req('Bearer abc.def.ghi'))).toBe('abc.def.ghi')
  })

  it('is case-insensitive about the scheme', () => {
    expect(extractToken(req('bearer abc.def.ghi'))).toBe('abc.def.ghi')
  })

  // The 2021 browser client sent the raw token with no scheme.
  it('accepts a bare token for backwards compatibility', () => {
    expect(extractToken(req('abc.def.ghi'))).toBe('abc.def.ghi')
  })

  it('returns null when the header is absent or empty', () => {
    expect(extractToken(req(undefined))).toBeNull()
    expect(extractToken(req('   '))).toBeNull()
  })
})
