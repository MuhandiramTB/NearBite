'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase/client';

export type Role = 'consumer' | 'owner' | 'admin';

export type SessionState = {
  loading: boolean;
  email: string | null;
  userId: string | null;
  role: Role | null;
};

/** Reads the Supabase session + the user's role from profiles, kept in sync. */
export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({
    loading: true,
    email: null,
    userId: null,
    role: null,
  });

  useEffect(() => {
    const supabase = createSupabaseBrowser();

    async function resolve(userId: string | null, email: string | null) {
      if (!userId) {
        setState({ loading: false, email: null, userId: null, role: null });
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();
      setState({
        loading: false,
        email,
        userId,
        role: (profile?.role as Role) ?? 'consumer',
      });
    }

    supabase.auth.getUser().then(({ data }) => resolve(data.user?.id ?? null, data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      resolve(session?.user?.id ?? null, session?.user?.email ?? null),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  return state;
}
