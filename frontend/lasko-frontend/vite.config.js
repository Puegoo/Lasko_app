/* eslint-env node */
// frontend/lasko-frontend/vite.config.js - NAPRAWIONY PROXY
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const API_TARGET = 'http://localhost:8000';

console.log('🔗 [Vite] Proxy target:', API_TARGET);

export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    proxy: {
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('❌ [Proxy Error]:', err.message);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log(`🔄 [Proxy] ${req.method} ${req.url} → ${API_TARGET}${req.url}`);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log(`📥 [Proxy] ${req.method} ${req.url} → ${proxyRes.statusCode}`);
          });
        },
      },
      '/health': {
        target: API_TARGET,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: { outDir: 'dist' },
});