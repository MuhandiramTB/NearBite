'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase/client';

export type SessionState = {
  loading: boolean;
  email: string | null;
  userId: string | null;
};

/** Reads the current Supabase session in the browser and keeps it in sync. */
export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({
    loading: true,
    email: null,
    userId: null,
  });

  useEffect(() => {
    const supabase = createSupabaseBrowser();
    supabase.auth.getUser().then(({ data }) => {
      setState({
        loading: false,
        email: data.user?.email ?? null,
        userId: data.user?.id ?? null,
      });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setState({
        loading: false,
        email: session?.user?.email ?? null,
        userId: session?.user?.id ?? null,
      });
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return state;
}
