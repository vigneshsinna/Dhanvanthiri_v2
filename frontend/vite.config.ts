import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

const proxyTarget = process.env.VITE_PROXY_TARGET || 'http://127.0.0.1:8000';

export default defineConfig(({ mode }) => {
  const appEnv = loadEnv(mode, path.resolve(__dirname, '..'), '');
  const frontendEnv = loadEnv(mode, __dirname, '');
  const systemKey =
    process.env.VITE_SYSTEM_KEY ||
    frontendEnv.VITE_SYSTEM_KEY ||
    appEnv.VITE_SYSTEM_KEY ||
    appEnv.SYSTEM_KEY ||
    '';

  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_SYSTEM_KEY': JSON.stringify(systemKey),
    },
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
  };
});
