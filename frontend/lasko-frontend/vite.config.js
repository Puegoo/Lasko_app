import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    watch: {
      usePolling: true,
      interval: 1000,
      binaryInterval: 1000,
      ignored: ['**/node_modules/**', '**/.git/**']
    },
    hmr: {
      overlay: false,
      port: 3000,
      host: '0.0.0.0'
    }
  },
  build: {
    outDir: 'dist',
  },
  optimizeDeps: {
    force: true
  }
})