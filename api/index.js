// Vercel serverless entry point. An Express app is already a
// (req, res) handler, so it can be exported directly. vercel.json rewrites
// every /api/* path here, and the router inside matches on the full URL.
module.exports = require('../server/app')
