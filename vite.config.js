import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000,
  },
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'https://vishwakarmabathouse.in',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
