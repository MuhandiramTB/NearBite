import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * The DB access port for repositories. We depend on the Supabase client so that
 * RLS and the auth.uid()/is_admin() triggers enforce security on every write
 * (the decision recorded for M1). Repositories receive this; nothing else in
 * core imports supabase-js directly.
 *
 * Untyped generics for now (no generated DB types yet); repositories cast
 * their own row shapes. When we generate Supabase types we can parameterize.
 */
export type Db = SupabaseClient;
