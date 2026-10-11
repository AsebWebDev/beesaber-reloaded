import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 3000,
    // Fail instead of silently moving to another port
    strictPort: true,
    // Forward API calls to the server, so the client can use relative URLs
    // in development and production alike.
    proxy: {
      '/api': 'http://localhost:5001',
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/testing/setup.ts'],
    // Mock mode, so the app offers the dev login instead of Google
    env: { VITE_MSW: 'enabled' },
    restoreMocks: true,
  },
});
