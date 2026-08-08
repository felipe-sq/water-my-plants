// Local development entry point. On Vercel the app is mounted by
// api/index.js as a serverless function instead, and this file is unused.
const app = require('./app')

const PORT = process.env.PORT || 9000

app.listen(PORT, () => {
  console.log(`Water My Plants API listening on http://localhost:${PORT}`)
})
