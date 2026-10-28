import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

import { demoPlugin } from './plugins/demo.ts';
import { precompressPlugin } from './plugins/precompress.ts';

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), demoPlugin(), precompressPlugin()],
  // The demo (`vite build --mode demo`) is served at /demo, next to the app,
  // with its own pictures. See client/src/demo/main.tsx.
  ...(mode === 'demo' && {
    base: '/demo/',
    publicDir: 'demo-public',
    build: { outDir: 'dist/demo' },
  }),
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
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      // Not the code under test: the test helpers themselves, and types
      exclude: ['src/testing/**', 'src/**/*.test.{ts,tsx}', 'src/**/*.d.ts'],
      reporter: ['text-summary', 'html'],
      // The build fails when coverage drops below these. They sit a little
      // under what the tests reach today: a safety net against tests going
      // missing, not a target to chase.
      thresholds: { lines: 93, branches: 82, functions: 93, statements: 93 },
    },
  },
}));
