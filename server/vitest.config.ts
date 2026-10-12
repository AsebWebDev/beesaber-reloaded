import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Applies the migrations to the test database once, before all tests
    globalSetup: ['./src/testing/globalSetup.ts'],
    // All test files share one database, so they must not run side by side
    fileParallelism: false,
    restoreMocks: true,
  },
});
