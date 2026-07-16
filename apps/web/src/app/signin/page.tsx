'use client';

import { useState } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { useSession } from '@/lib/ui/use-session';

export default function SignInPage() {
  const session = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const supabase = createSupabaseBrowser();

  async function signIn() {
    setBusy(true);
    setMsg('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    setMsg(error ? error.message : 'Signed in.');
  }
  async function signUp() {
    setBusy(true);
    setMsg('');
    const { error } = await supabase.auth.signUp({ email, password });
    setBusy(false);
    setMsg(error ? error.message : 'Account created — you are signed in.');
  }
  async function signOut() {
    await supabase.auth.signOut();
    setMsg('Signed out.');
  }

  if (session.email) {
    return (
      <div className="stack" style={{ maxWidth: 360 }}>
        <h1 className="h1">Account</h1>
        <p>
          Signed in as <strong>{session.email}</strong>
        </p>
        <button className="btn" onClick={signOut}>
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="stack" style={{ maxWidth: 360 }}>
      <h1 className="h1">Sign in</h1>
      <p className="muted">Required only to manage a business or moderate. Browsing is open to all.</p>
      <div>
        <label className="label">Email</label>
        <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <label className="label">Password</label>
        <input
          className="input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="row">
        <button className="btn btn-primary" onClick={signIn} disabled={busy}>
          Sign in
        </button>
        <button className="btn" onClick={signUp} disabled={busy}>
          Create account
        </button>
      </div>
      {msg && <p className="muted">{msg}</p>}
    </div>
  );
}
