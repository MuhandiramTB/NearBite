'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiGet, apiSend } from '@/lib/ui/api-client';
import { useSession } from '@/lib/ui/use-session';
import { useTheme } from '@/lib/ui/theme';
import { SvgIcon } from '@/lib/ui/SvgIcon';

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
    apiGet<{ data: Notif[] }>('/me/notifications').then((r) => setItems(r.data)).catch(() => {});
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
      <button className="icon-btn" onClick={toggle} aria-label="Notifications">
        🔔
        {unread > 0 && <span className="notif-dot">{unread}</span>}
      </button>
      {open && (
        <div className="panel" style={{ position: 'absolute', right: 0, top: 44, width: 300, maxHeight: 360, overflowY: 'auto', zIndex: 60 }}>
          {items.length === 0 ? (
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>No notifications yet.</p>
          ) : (
            items.map((n) => (
              <a key={n.id} href={n.link ?? '#'} style={{ display: 'block', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
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
    <button className="icon-btn" onClick={toggle} aria-label="Toggle theme" title="Toggle light/dark">
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}

export function Nav() {
  const session = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const isAdmin = session.role === 'admin';
  const isOwner = session.role === 'owner' || isAdmin;

  const links = [
    { href: '/', label: 'Discover' },
    { href: '/favorites', label: 'Saved' },
    ...(isOwner ? [{ href: '/owner', label: 'My Business' }] : []),
    ...(isAdmin ? [{ href: '/admin', label: 'Admin' }] : []),
  ];

  return (
    <>
      <header className="nav">
        <div className="container nav-inner">
          {/* mobile hamburger */}
          <button className="icon-btn nav-burger" onClick={() => setMenuOpen(true)} aria-label="Menu">
            <SvgIcon name="menu" size={22} />
          </button>

          <a href="/" className="brand">
            Near<span>Bite</span>
          </a>

          {/* desktop links */}
          <nav className="nav-links">
            {links.map((l) => (
              <a key={l.href} href={l.href}>{l.label}</a>
            ))}
          </nav>

          <div className="nav-actions">
            <NotificationBell />
            <ThemeToggle />
            {session.userId ? (
              <a href={isOwner ? '/owner' : '/favorites'} className="btn btn-sm nav-signin">Account</a>
            ) : (
              <a href="/signin" className="btn btn-primary btn-sm nav-signin">Sign in</a>
            )}
          </div>
        </div>
      </header>

      {/* mobile slide-in menu */}
      {menuOpen && (
        <div className="drawer-overlay" onClick={() => setMenuOpen(false)}>
          <aside className="drawer" onClick={(e) => e.stopPropagation()}>
            <div className="row between" style={{ marginBottom: 18 }}>
              <span className="brand">Near<span>Bite</span></span>
              <button className="icon-btn" onClick={() => setMenuOpen(false)} aria-label="Close">
                <SvgIcon name="close" size={22} />
              </button>
            </div>
            {!session.userId && (
              <a href="/signin" className="btn btn-primary" style={{ width: '100%', marginBottom: 14 }}>
                Sign in
              </a>
            )}
            <nav className="drawer-links">
              <a href="/" onClick={() => setMenuOpen(false)}><SvgIcon name="discover" size={20} /> Discover</a>
              <a href="/favorites" onClick={() => setMenuOpen(false)}><SvgIcon name="saved" size={20} /> Saved places</a>
              {isOwner && <a href="/owner" onClick={() => setMenuOpen(false)}><SvgIcon name="store" size={20} /> My Business</a>}
              {isAdmin && <a href="/admin" onClick={() => setMenuOpen(false)}><SvgIcon name="shield" size={20} /> Admin</a>}
              {!isOwner && (
                <a href="/owner" onClick={() => setMenuOpen(false)}><SvgIcon name="store" size={20} /> Add your restaurant</a>
              )}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
