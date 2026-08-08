const express = require('express')
const helmet = require('helmet')
const cors = require('cors')

const usersRouter = require('./routers/users')
const plantsRouter = require('./routers/plants')

const app = express()

app.use(helmet())
app.use(express.json())

// In production the API is served from the same origin as the built client
// (/api/* on the Vercel deployment), so no cross-origin access is needed.
// CORS_ORIGIN opens it up for a separately hosted frontend if that changes.
const corsOrigin = process.env.CORS_ORIGIN
app.use(cors(corsOrigin ? { origin: corsOrigin.split(',').map((o) => o.trim()) } : {}))

app.get('/api', (req, res) => {
  res.status(200).json({ message: 'API running' })
})

app.use('/api/users', usersRouter)
app.use('/api/plants', plantsRouter)

app.use((req, res) => {
  res.status(404).json({ message: `No route matches ${req.method} ${req.originalUrl}` })
})

// The original handler returned err.stack to the client on every 500.
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  const status = err.status || 500
  console.error(err)

  res.status(status).json({
    message: status === 500 ? 'Something went wrong' : err.message,
    ...(process.env.NODE_ENV !== 'production' && { detail: err.message, stack: err.stack }),
  })
})

module.exports = app
