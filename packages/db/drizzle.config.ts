import { defineConfig } from 'drizzle-kit';

/** drizzle-kit config. DATABASE_URL is the Supabase direct connection string
 *  (server-only, privileged). Used for generate/migrate/push. */
export default defineConfig({
  schema: './src/schema/index.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
  verbose: true,
  strict: true,
});
