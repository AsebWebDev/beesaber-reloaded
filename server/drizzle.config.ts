import { defineConfig } from 'drizzle-kit';

// Used by the drizzle-kit commands (`pnpm db:generate`, `pnpm db:studio`)
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  casing: 'snake_case',
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      'postgres://beesaber:beesaber@localhost:5432/beesaber',
  },
});
