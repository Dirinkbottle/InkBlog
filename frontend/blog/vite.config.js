import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api/v1/notifications': {
        target: 'http://localhost:13160',
        changeOrigin: true,
      },
      '/events/notifications': {
        target: 'http://localhost:13160',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:13150',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:13150',
        changeOrigin: true,
      },
    },
  },
})
