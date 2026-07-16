'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { useSession } from '@/lib/ui/use-session';

export default function SignInPage() {
  const session = useSession();
  const router = useRouter();
  const supabase = createSupabaseBrowser();

  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  // password strength (for sign-up)
  const strength = scorePassword(password);

  async function routeByRole(userId: string) {
    const { data } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle();
    router.push(data?.role === 'owner' ? '/owner' : '/');
  }

  async function submit() {
    setBusy(true);
    setMsg('');
    if (mode === 'up' && strength.score < 2) {
      setBusy(false);
      setMsg('Please choose a stronger password.');
      return;
    }
    const res =
      mode === 'in'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (res.error) {
      setMsg(res.error.message);
    } else if (res.data.user) {
      await routeByRole(res.data.user.id);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setMsg('Signed out.');
  }

  if (session.email) {
    return (
      <div className="stack" style={{ maxWidth: 420 }}>
        <h1 className="h1">Your account</h1>
        <p>
          Signed in as <strong>{session.email}</strong>{' '}
          <span className="badge">{session.role}</span>
        </p>
        <div className="row">
          {(session.role === 'owner' || session.role === 'admin') && (
            <a className="btn btn-primary" href="/owner">My Business</a>
          )}
          <button className="btn" onClick={signOut}>Sign out</button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-split" style={{ maxWidth: 860, margin: '0 auto' }}>
      <div className="auth-hero">
        <div className="big-emoji">🍽️</div>
        <h1 className="h1" style={{ color: '#fff' }}>
          {mode === 'in' ? 'Welcome back to NearBite' : 'Join NearBite'}
        </h1>
        <p style={{ opacity: 0.92, maxWidth: '34ch' }}>
          Discover trustworthy places to eat — accurate menus, real photos, kept fresh by the
          owners themselves.
        </p>
      </div>

      <div className="auth-form">
        <h2 className="h2" style={{ marginTop: 0 }}>
          {mode === 'in' ? 'Sign in' : 'Create your account'}
        </h2>

        <div className="stack" style={{ gap: 12 }}>
          <div>
            <label className="label">Email</label>
            <input
              className="input"
              autoCapitalize="none"
              placeholder="you@example.com"
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
                onKeyDown={(e) => e.key === 'Enter' && submit()}
              />
              <button type="button" className="pw-toggle" onClick={() => setShowPw((v) => !v)}>
                {showPw ? '🙈' : '👁'}
              </button>
            </div>
            {mode === 'up' && password.length > 0 && (
              <div style={{ marginTop: 6 }}>
                <div style={{ height: 5, background: 'var(--surface-2)', borderRadius: 3, overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${(strength.score / 4) * 100}%`,
                      height: '100%',
                      background: strength.color,
                      transition: 'width .2s',
                    }}
                  />
                </div>
                <span className="muted" style={{ fontSize: 12 }}>{strength.label}</span>
              </div>
            )}
          </div>

          <div className="row between" style={{ fontSize: 13 }}>
            <label className="row" style={{ gap: 6 }}>
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              <span className="muted">Remember me</span>
            </label>
            <a className="muted" href="#" onClick={(e) => { e.preventDefault(); setMsg('Password reset coming soon.'); }}>
              Forgot password?
            </a>
          </div>

          <button className="btn btn-primary" onClick={submit} disabled={busy || !email || !password}>
            {busy ? '…' : mode === 'in' ? 'Sign in' : 'Create account'}
          </button>

          {/* Social login placeholders */}
          <div className="row" style={{ gap: 8 }}>
            <button className="btn" style={{ flex: 1 }} disabled title="Coming soon">Google</button>
            <button className="btn" style={{ flex: 1 }} disabled title="Coming soon">Apple</button>
          </div>

          {msg && <p className="muted" style={{ margin: 0 }}>{msg}</p>}

          <button
            className="btn"
            style={{ border: 'none', background: 'transparent' }}
            onClick={() => setMode((m) => (m === 'in' ? 'up' : 'in'))}
          >
            {mode === 'in' ? 'New to NearBite? Create an account' : 'Have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}

function scorePassword(pw: string): { score: number; label: string; color: string } {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const labels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['#dc2626', '#dc2626', '#d97706', '#16a34a', '#16a34a'];
  return { score: s, label: labels[s] ?? 'Too weak', color: colors[s] ?? '#dc2626' };
}
