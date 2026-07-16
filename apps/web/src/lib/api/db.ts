import { createSupabaseServer } from '../supabase/server';

/**
 * The DB handle passed to core repositories: a request-scoped Supabase client
 * carrying the caller's session. RLS and the auth.uid()/is_admin() triggers
 * therefore apply to every query (M1 decision — security enforced end-to-end).
 *
 * Drizzle is retained only for migrations (packages/db), never at runtime.
 */
export async function getRequestDb() {
  return createSupabaseServer();
}
