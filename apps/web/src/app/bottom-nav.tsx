'use client';

import { usePathname } from 'next/navigation';
import { useSession } from '@/lib/ui/use-session';

/** Mobile-only bottom navigation (spec §11). Hidden on desktop via CSS. */
export function BottomNav() {
  const path = usePathname();
  const session = useSession();
  const items = [
    { href: '/', label: 'Home', icon: '🏠' },
    { href: '/favorites', label: 'Saved', icon: '❤️' },
    {
      href: session.role === 'owner' || session.role === 'admin' ? '/owner' : '/signin',
      label: session.userId ? 'Account' : 'Sign in',
      icon: '👤',
    },
  ];
  return (
    <nav className="bottom-nav">
      {items.map((it) => {
        const active = path === it.href;
        return (
          <a key={it.href} href={it.href} className={`bn-item ${active ? 'on' : ''}`}>
            <span className="bn-icon">{it.icon}</span>
            {it.label}
          </a>
        );
      })}
    </nav>
  );
}
