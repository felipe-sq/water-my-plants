import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Keeps the browser talking to a same-origin /api in development, exactly
    // as it does on Vercel, so there is no CORS setup and no separate base URL.
    proxy: {
      '/api': {
        target: process.env.API_PROXY_TARGET || 'http://localhost:9000',
        changeOrigin: true,
      },
    },
  },
})
