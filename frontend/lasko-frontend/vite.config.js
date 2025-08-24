import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// USTAW to na hosta, pod którym wchodzisz w przeglądarce:
// - jeśli używasz http://localhost:3000 → 'localhost'
// - jeśli używasz http://192.168.x.x:3000 → '192.168.x.x'
const HMR_HOST = process.env.VITE_HMR_HOST || 'localhost'
const HMR_PORT = Number(process.env.VITE_HMR_PORT || 3000)

export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    // serwer może słuchać na wszystkich interfejsach (np. w Dockerze)
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
      // KLUCZOWE: nie używamy 0.0.0.0 dla klienta HMR
      protocol: 'ws',
      host: HMR_HOST,
      clientPort: HMR_PORT,
      overlay: false
    }
  },
  build: {
    outDir: 'dist'
  },
  optimizeDeps: {
    force: true
  }
})
