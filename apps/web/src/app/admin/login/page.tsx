'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase/client';

/**
 * Hidden admin login (spec §7). Not linked from public nav.
 * The credentials must belong to a real Supabase user whose profiles.role is
 * 'admin' — RLS/admin RPCs still enforce authority server-side. The hardcoded
 * pair below is the intended pilot admin account.
 */
const EXPECTED_EMAIL = 'admin@nearbite.com';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function signIn() {
    setBusy(true);
    setErr('');
    const supabase = createSupabaseBrowser();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      setBusy(false);
      setErr('Invalid admin credentials.');
      return;
    }
    // Confirm the account is actually an admin before routing in.
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle();
    setBusy(false);
    if (profile?.role !== 'admin') {
      await supabase.auth.signOut();
      setErr('This account is not an administrator.');
      return;
    }
    router.push('/admin');
  }

  return (
    <div className="auth-split" style={{ maxWidth: 760, margin: '0 auto' }}>
      <div className="auth-hero">
        <div className="big-emoji">🛡️</div>
        <h1 className="h1" style={{ color: '#fff' }}>NearBite Admin</h1>
        <p style={{ opacity: 0.9 }}>Restricted access. Authorized administrators only.</p>
      </div>
      <div className="auth-form">
        <h2 className="h2" style={{ marginTop: 0 }}>Administrator sign in</h2>
        <div className="stack" style={{ gap: 12 }}>
          <div>
            <label className="label">Email</label>
            <input
              className="input"
              autoCapitalize="none"
              placeholder={EXPECTED_EMAIL}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && signIn()}
              />
              <button type="button" className="pw-toggle" onClick={() => setShowPw((v) => !v)}>
                {showPw ? '🙈' : '👁'}
              </button>
            </div>
          </div>
          {err && <p className="error" style={{ margin: 0 }}>{err}</p>}
          <button className="btn btn-primary" onClick={signIn} disabled={busy || !email || !password}>
            {busy ? '…' : 'Sign in to Admin'}
          </button>
        </div>
      </div>
    </div>
  );
}
