import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index';

/**
 * Server-only Drizzle client for TYPED WRITES and migrations.
 *
 * IMPORTANT (security, foundation §9): this connects with a privileged DB
 * connection string and BYPASSES RLS. It must only ever be imported from
 * server code (a module's *.repository.ts). Never bundle into web/mobile clients.
 *
 * Public reads that must respect RLS go through the Supabase client with the
 * user's JWT, not through this.
 */
export function createDbClient(connectionString: string) {
  const queryClient = postgres(connectionString, { prepare: false });
  return drizzle(queryClient, { schema });
}

export type Database = ReturnType<typeof createDbClient>;
export { schema };
