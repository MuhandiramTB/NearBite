'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiGet, apiSend } from '@/lib/ui/api-client';
import { useSession } from '@/lib/ui/use-session';
import { useTheme } from '@/lib/ui/theme';

type Notif = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

function NotificationBell() {
  const session = useSession();
  const [items, setItems] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);
  const unread = items.filter((n) => !n.isRead).length;

  const load = useCallback(() => {
    apiGet<{ data: Notif[] }>('/me/notifications')
      .then((r) => setItems(r.data))
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (session.userId) load();
  }, [session.userId, load]);

  if (!session.userId) return null;

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      await apiSend('POST', '/me/notifications', { ids: [] }).catch(() => {});
      setItems((cur) => cur.map((n) => ({ ...n, isRead: true })));
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <button className="btn btn-sm" onClick={toggle} aria-label="Notifications">
        🔔{unread > 0 ? ` ${unread}` : ''}
      </button>
      {open && (
        <div
          className="panel"
          style={{ position: 'absolute', right: 0, top: 40, width: 300, maxHeight: 360, overflowY: 'auto', zIndex: 30 }}
        >
          {items.length === 0 ? (
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>No notifications yet.</p>
          ) : (
            items.map((n) => (
              <a
                key={n.id}
                href={n.link ?? '#'}
                style={{ display: 'block', padding: '8px 0', borderBottom: '1px solid var(--border)' }}
              >
                <strong style={{ fontSize: 13 }}>{n.title}</strong>
                {n.body && <p className="muted" style={{ fontSize: 12, margin: '2px 0 0' }}>{n.body}</p>}
              </a>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button className="btn btn-sm" onClick={toggle} aria-label="Toggle theme" title="Toggle light/dark">
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}

export function Nav() {
  const session = useSession();
  const isAdmin = session.role === 'admin';
  const isOwner = session.role === 'owner' || isAdmin;
  return (
    <nav className="nav">
      <div className="container nav-inner">
        <a href="/" className="brand">
          Near<span>Bite</span>
        </a>
        <a href="/">Discover</a>
        {isOwner && <a href="/owner">My Business</a>}
        {isAdmin && <a href="/admin">Admin</a>}
        {!session.userId && <a href="/signin">Sign in</a>}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <NotificationBell />
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
