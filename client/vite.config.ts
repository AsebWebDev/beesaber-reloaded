import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

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
});
