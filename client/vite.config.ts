import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 3000,
    // Fail instead of silently moving to another port
    strictPort: true,
    // Forward API calls to the server. The browser only ever talks to this
    // address, so cookies and sign-in redirects need no special handling.
    proxy: {
      '/api': 'http://localhost:5001',
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/testing/setup.ts'],
    restoreMocks: true,
  },
});
