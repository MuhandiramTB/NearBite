'use client';

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { useSession } from '@/lib/ui/use-session';

/**
 * Guest action-resume (spec §5). `requireAuth(fn)` runs fn immediately when
 * signed in; otherwise it opens a sign-in modal and, on success, resumes fn
 * exactly where the user was — no redirect to Discover.
 */
type Ctx = { requireAuth: (fn: () => void) => void };
const AuthGateContext = createContext<Ctx>({ requireAuth: (fn) => fn() });

export function useAuthGate() {
  return useContext(AuthGateContext);
}

export function AuthGateProvider({ children }: { children: ReactNode }) {
  const session = useSession();
  const [open, setOpen] = useState(false);
  const pending = useRef<(() => void) | null>(null);

  const requireAuth = useCallback(
    (fn: () => void) => {
      if (session.userId) {
        fn();
      } else {
        pending.current = fn;
        setOpen(true);
      }
    },
    [session.userId],
  );

  const onSuccess = useCallback(() => {
    setOpen(false);
    const fn = pending.current;
    pending.current = null;
    // Let auth state settle, then resume the original action.
    setTimeout(() => fn?.(), 150);
  }, []);

  return (
    <AuthGateContext.Provider value={{ requireAuth }}>
      {children}
      {open && <SignInModal onClose={() => setOpen(false)} onSuccess={onSuccess} />}
    </AuthGateContext.Provider>
  );
}

function SignInModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const supabase = createSupabaseBrowser();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function submit() {
    setBusy(true);
    setErr('');
    const fn =
      mode === 'in'
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password });
    const { error } = await fn;
    setBusy(false);
    if (error) setErr(error.message);
    else onSuccess();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <h2 className="h2" style={{ marginTop: 0 }}>
          {mode === 'in' ? 'Welcome back' : 'Create your account'}
        </h2>
        <p className="muted" style={{ marginTop: -8 }}>
          Sign in to continue — you’ll pick up right where you left off.
        </p>
        <div className="stack" style={{ gap: 10, marginTop: 8 }}>
          <input
            className="input"
            placeholder="you@example.com"
            autoCapitalize="none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div style={{ position: 'relative' }}>
            <input
              className="input"
              type={showPw ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="pw-toggle"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? '🙈' : '👁'}
            </button>
          </div>
          {err && <p className="error" style={{ margin: 0 }}>{err}</p>}
          <button className="btn btn-primary" onClick={submit} disabled={busy || !email || !password}>
            {busy ? '…' : mode === 'in' ? 'Sign in' : 'Create account'}
          </button>
          <button className="btn" onClick={() => setMode((m) => (m === 'in' ? 'up' : 'in'))}>
            {mode === 'in' ? 'New here? Create an account' : 'Have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
