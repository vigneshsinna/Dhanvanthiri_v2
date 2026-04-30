import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

const proxyTarget = process.env.VITE_PROXY_TARGET || 'http://127.0.0.1:8000';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    proxy: {
      '/api/v2': {
        target: proxyTarget,
        changeOrigin: true,
      },
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
      },
    },
  },
});
