import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Dev server proxies the API so the browser talks to one origin (no CORS setup needed locally).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8000',
      '/r': 'http://localhost:8000',
    },
  },
})
