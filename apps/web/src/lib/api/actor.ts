import type { Actor } from '@nearbite/core';
import { anonymous } from '@nearbite/core';
import type { UserRole } from '@nearbite/contracts';
import { createSupabaseServer } from '../supabase/server';

/**
 * Resolve the authenticated Actor for the current request from the Supabase
 * session cookie. Anonymous (no session) → { userId: null, role: null }.
 *
 * The role comes from profiles.role; the read runs under the user's session so
 * RLS (prof_read: own row) applies. This is the fast first auth layer; RLS on
 * every table is the authoritative one.
 */
export async function resolveActor(): Promise<Actor> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return anonymous;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return { userId: user.id, role: (profile?.role as UserRole) ?? 'consumer' };
}
