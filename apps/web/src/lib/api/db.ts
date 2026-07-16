import { createSupabaseServer, createSupabaseAdmin } from '../supabase/server';

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

/**
 * Service-role client — bypasses RLS. Use ONLY where the app has already
 * verified authorization (e.g. minting a signed upload URL after an ownership
 * check). Never expose to the client. Server-only (see supabase/server.ts).
 */
export function getAdminDb() {
  return createSupabaseAdmin();
}
