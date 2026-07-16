import 'server-only';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { getServerEnv, publicEnv } from '../env';

/**
 * Request-scoped Supabase client using the caller's session cookie.
 * RLS APPLIES — this is what user-facing reads/writes should use so the
 * database enforces the policies from policies.sql. Safe default.
 */
export async function createSupabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet: { name: string; value: string; options: CookieOptions }[]) => {
          try {
            toSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // called from a Server Component render — safe to ignore
          }
        },
      },
    },
  );
}

/**
 * Service-role client — BYPASSES RLS. Use ONLY for trusted server operations
 * that legitimately need to (e.g. admin actions after an explicit is_admin
 * guard, background jobs). NEVER expose this or its key to the client.
 */
export function createSupabaseAdmin() {
  const { SUPABASE_SERVICE_ROLE_KEY } = getServerEnv();
  return createClient(publicEnv.NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
