import { defineConfig } from 'vitest/config'

// Split out from the unit config because these tests need a reachable
// Postgres at TESTING_DATABASE_URL. `npm test` stays runnable without one.
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['server/**/*.integration.test.js'],
    setupFiles: ['./server/__tests__/setup.js'],
    // The suite truncates shared tables between tests, so files must not
    // overlap in time.
    fileParallelism: false,
  },
})
