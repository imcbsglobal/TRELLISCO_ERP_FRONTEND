import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
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
    },
  },
})
