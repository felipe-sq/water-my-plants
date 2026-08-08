const knex = require('knex')
const configs = require('../../knexfile')

const environment = process.env.NODE_ENV || 'development'
const config = configs[environment]

if (!config) {
  throw new Error(
    `No knex configuration for NODE_ENV="${environment}". ` +
      `Expected one of: ${Object.keys(configs).join(', ')}.`
  )
}

if (!config.connection) {
  throw new Error(
    `No database connection string for NODE_ENV="${environment}". ` +
      `Set the matching *_DATABASE_URL variable (see .env.example).`
  )
}

module.exports = knex(config)
