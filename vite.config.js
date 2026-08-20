import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    build: {
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) {
                return 'vendor-react'
              }
              if (id.includes('framer-motion')) {
                return 'vendor-framer'
              }
              if (id.includes('swiper')) {
                return 'vendor-swiper'
              }
              if (id.includes('lucide-react')) {
                return 'vendor-lucide'
              }
              if (id.includes('canvas-confetti') || id.includes('react-toastify') || id.includes('axios')) {
                return 'vendor-utils'
              }
            }
          }
        }
      }
    },
    server: {
      proxy: {
        '/api': {
          target: env.VITE_BACKEND_URL || 'http://127.0.0.1:8000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
