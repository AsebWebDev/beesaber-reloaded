import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Applies the migrations to the test database once, before all tests
    globalSetup: ['./src/testing/globalSetup.ts'],
    // All test files share one database, so they must not run side by side
    fileParallelism: false,
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
      thresholds: { lines: 86, branches: 81, functions: 81, statements: 85 },
    },
  },
});
