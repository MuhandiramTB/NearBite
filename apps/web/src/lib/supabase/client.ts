'use client';
import { createBrowserClient } from '@supabase/ssr';
import { publicEnv } from '../env';

/** Browser Supabase client — uses the anon key + user session. RLS always applies. */
export function createSupabaseBrowser() {
  return createBrowserClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
