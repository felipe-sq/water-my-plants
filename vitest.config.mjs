import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    // The server is CommonJS, and vitest's own API cannot be require()'d.
    // Exposing describe/it/expect as globals lets the test files stay CJS
    // alongside the code they exercise.
    globals: true,
    include: ['server/**/*.test.js'],
    // *.integration.test.js also matches the include glob, and those tests
    // need a live Postgres. Keeping them out is what lets `npm test` run on a
    // machine with no database. They run via `npm run test:integration`.
    exclude: ['**/node_modules/**', 'server/**/*.integration.test.js'],
    setupFiles: ['./server/__tests__/setup.js'],
  },
})
