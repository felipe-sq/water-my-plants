import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    // The server is CommonJS, and vitest's own API cannot be require()'d.
    // Exposing describe/it/expect as globals lets the test files stay CJS
    // alongside the code they exercise.
    globals: true,
    include: ['server/**/*.test.js'],
    setupFiles: ['./server/__tests__/setup.js'],
  },
})
