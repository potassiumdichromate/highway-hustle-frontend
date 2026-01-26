import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    // SPA fallback - redirect all routes to index.html in dev mode
    historyApiFallback: true
  },
  preview: {
    port: 3000,
    // SPA fallback for preview mode as well
    historyApiFallback: true
  }
})
