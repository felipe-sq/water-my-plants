# Water My Plants

A plant-care scheduler. Sign up, add your plants, and record how often each one
needs watering.

React frontend, Express + PostgreSQL API, deployed to Vercel as a single
project.

**Live app → https://water-my-plants-felipesqs-projects.vercel.app**

Sign up with any username to try it; accounts only ever see their own plants.
The database scales to zero when idle, so the first request after a quiet
spell takes a few seconds to wake it.

---

## Background

This started as a 2021 team build-week project split across two repositories —
a Create React App frontend and an Express/Knex backend on Heroku. Heroku's
free tier was retired in November 2022 and took the API and its database with
it, leaving the deployed frontend unable to log anyone in.

This repository consolidates both halves into one project, modernizes the
stack, and repairs the defects that kept the original from working. See
[What changed](#what-changed) for the full list.

## Stack

| Layer    | Then (2021)                | Now                          |
| -------- | -------------------------- | ---------------------------- |
| Frontend | Create React App, React 17 | Vite 8, React 19             |
| Routing  | React Router 5             | React Router 7               |
| UI       | Bootstrap 4, reactstrap    | Bootstrap 5, react-bootstrap |
| API      | Express 4, Node 14         | Express 5, Node 20+          |
| Database | Knex 0.95, Heroku Postgres | Knex 3, any Postgres         |
| Tests    | Jest                       | Vitest                       |
| Hosting  | Heroku + Netlify           | Vercel (one project)         |

## Layout

```
.
├── api/index.js       Vercel serverless entry — exports the Express app
├── server/            Express API
│   ├── app.js         App assembly: middleware, routers, error handling
│   ├── index.js       Local dev listener
│   ├── data/          Knex connection, migrations, seeds
│   ├── middleware/    Auth gate and request validation
│   ├── models/        All database access
│   └── routers/       Route handlers
├── client/            Vite + React frontend
├── knexfile.js        Per-environment database config
└── vercel.json        Build and routing config
```

## Running it locally

You need Node 20+ and a PostgreSQL server.

```bash
npm install
cp .env.example .env
```

Fill in `.env` — at minimum `DEV_DATABASE_URL` and `JWT_SECRET`. Generate a
secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Create the schema and load two sample plants:

```bash
npm run migrate && npm run seed
```

Then start the API and frontend together:

```bash
npm run dev
```

The frontend is on <http://localhost:5173> and proxies `/api` to the API on
port 9000, so the browser talks to a same-origin `/api` in development exactly
as it does in production.

The seeded account is `a1stein` / `password`.

## Testing

Unit tests — routing, request validation, the auth gate, and token issuance.
No database required:

```bash
npm test
```

Integration tests — registration, login, the full plant CRUD cycle, profile
updates, logout revocation, and cross-user isolation, all against real
Postgres. These need `TESTING_DATABASE_URL` pointing at a scratch database,
and they truncate its tables between tests:

```bash
npm run test:integration
```

`createdb water_my_plants_test` is enough to set that database up; the suite
runs the migrations itself.

## Deploying to Vercel

1. **Provision a database.** In the Vercel dashboard, add a Postgres
   integration from the Marketplace (Neon has a free tier). It sets
   `DATABASE_URL` on the project automatically.

2. **Set the remaining environment variables** for the Production environment:

   | Variable         | Value                                    |
   | ---------------- | ---------------------------------------- |
   | `JWT_SECRET`     | a long random string, generated as above |
   | `NODE_ENV`       | `production`                             |
   | `BCRYPT_ROUNDS`  | `10` (optional)                          |
   | `JWT_EXPIRES_IN` | `1d` (optional)                          |

3. **Deploy**, then run the migration once against the production database:

   ```bash
   vercel env pull .env.production.local
   NODE_ENV=production npx knex migrate:latest
   ```

`vercel.json` builds the client to `client/dist`, routes `/api/*` to the
serverless function in `api/`, and sends everything else to `index.html` so
client-side routing works on a hard refresh.

## API

All responses are JSON. Authenticated routes expect `Authorization: Bearer <token>`.

| Method   | Route                 | Auth | Purpose                                  |
| -------- | --------------------- | ---- | ---------------------------------------- |
| `GET`    | `/api`                | —    | Health check                             |
| `POST`   | `/api/users/register` | —    | Create an account; returns a token       |
| `POST`   | `/api/users/login`    | —    | Sign in; returns a token                 |
| `POST`   | `/api/users/logout`   | ✓    | Revoke the current token                 |
| `GET`    | `/api/users/me`       | ✓    | Read your own profile                    |
| `PUT`    | `/api/users/me`       | ✓    | Update your own profile                  |
| `DELETE` | `/api/users/me`       | ✓    | Delete your account and all of its plants |
| `GET`    | `/api/plants`         | ✓    | List your plants                         |
| `POST`   | `/api/plants`         | ✓    | Add a plant                              |
| `GET`    | `/api/plants/:id`     | ✓    | Read one of your plants                  |
| `PUT`    | `/api/plants/:id`     | ✓    | Update one of your plants                |
| `DELETE` | `/api/plants/:id`     | ✓    | Delete one of your plants                |

## What changed

**Security**

- The `auth` middleware existed in 2021 but was never applied to a route, so
  the whole API was public. Every user and plant route now requires a token.
- `GET /api/users` returned every row of the users table — bcrypt hashes
  included — to any unauthenticated caller. It is gone, replaced by
  self-scoped `/api/users/me` routes.
- The `plants` table had no owner column, so all accounts shared one global
  plant list. Plants now belong to a user via a foreign key, and every query
  in `server/models/plants.js` is scoped by `user_id`.
- The error handler returned `err.stack` to the client on every 500. Stack
  traces are now development-only.
- Login read `user.password` before checking the user existed, so an unknown
  username produced a 500 instead of a 401.
- Passwords now have a minimum length, and usernames are unique at the database
  level (duplicate registration returns 409 rather than creating a second
  account).
- Tokens carry a random `jti` claim. Without one, the payload was fully
  determined by the user and `iat` — which has second resolution — so logging
  out and back in within the same second reissued the exact token that logout
  had just added to the revocation list, locking the account out until the
  clock ticked over.

**Broken code**

- `PUT /api/users/:id` and `middleware/user.js` referenced a `db` that was
  never imported. `DELETE /api/users/:id` called `users.deleteUserById`, which
  did not exist.
- `GET /api/plants/:id` returned `req.shout`, `PUT` called `projects.update`,
  and `DELETE` called `Shouts.remove` — three identifiers left over from an
  unrelated scaffold, none of which existed in the project.
- `GET /api/users/logout` was declared after `GET /api/users/:id`, so the
  parameterized route swallowed it. This is the 500 the old `App.js` mentions
  in a commented-out block.
- `update()` in both models called an undefined `get()`.
- The seed inserted a plaintext password, so the seeded account could never log
  in, and it hardcoded row ids without resetting sequences, so the next insert
  collided.
- `index.js` served a `client/dist` directory that did not exist in the repo.
- The frontend deleted plants from local state only, never calling the API, so
  they returned on the next refresh.

**Cleanup**

- Two different `Login` components existed at paths that resolved ambiguously;
  `src/services/` was an unused tutorial leftover pointing at endpoints the API
  never had; `PrivateRoute` was written but never mounted.
- Two overlapping navbars each declared their own route table, rendering
  several routes twice.
- The Heroku API URL was hardcoded in four separate files. There is now one
  axios instance against a same-origin `/api`.
- `node_modules` was committed to the old repository.

## License

MIT
