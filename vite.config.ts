import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// The UI was designed in Figma Make, which imports images as "figma:asset/<hash>.png"; serve them from src/assets.
const figmaAssets = {
  name: 'figma-assets',
  resolveId(id: string) {
    if (id.startsWith('figma:asset/')) return path.resolve(import.meta.dirname, 'src/assets', id.slice('figma:asset/'.length))
  },
}

export default defineConfig({
  plugins: [figmaAssets, react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } },
  server: { port: 5173 },
})
