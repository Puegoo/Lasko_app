/* eslint-env node */
// Lasko_app/frontend/lasko-frontend/vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// HMR – adres, pod którym łączy się przeglądarka
const HMR_HOST = process.env.VITE_HMR_HOST || 'localhost';
const HMR_PORT = Number(process.env.VITE_HMR_PORT || 3000);

// Proxy – backend (docker-compose: http://backend:8000)
const API_TARGET =
  process.env.VITE_PROXY_TARGET ||
  process.env.VITE_API_URL ||
  'http://backend:8000';

export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    watch: {
      usePolling: true,
      interval: 1000,
      binaryInterval: 1000,
      ignored: ['**/node_modules/**', '**/.git/**'],
    },
    hmr: {
      protocol: 'ws',
      host: HMR_HOST,
      clientPort: HMR_PORT,
      overlay: false,
    },
    proxy: {
      '/api': { target: API_TARGET, changeOrigin: true, secure: false },
      '/media': { target: API_TARGET, changeOrigin: true, secure: false },
      '/static': { target: API_TARGET, changeOrigin: true, secure: false },
    },
  },
  build: { outDir: 'dist' },
});