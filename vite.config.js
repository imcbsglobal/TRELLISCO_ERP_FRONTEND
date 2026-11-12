import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // The port is part of the OAuth origin. Silently moving to 5174 when 5173 is
    // taken would break Google sign-in with "origin_mismatch", so fail loudly.
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000', // <-- change to your Django server's actual host:port
        changeOrigin: true,
      },
      // Keep T-ERP requests same-origin during local development so the
      // browser does not block them before the API can return its response.
      '/terp-api': {
        target: 'https://activate.imcbs.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/terp-api/, ''),
      },
      // Central Master (/api/user-master/) does not send CORS headers, so the
      // client admin account is created through this proxy in development.
      '/central-api': {
        target: 'https://centralmastermanagement.imcbs.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/central-api/, ''),
      },
    },
  },
})
