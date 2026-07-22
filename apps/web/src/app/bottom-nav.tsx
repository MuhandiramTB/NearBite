'use client';

import { usePathname } from 'next/navigation';
import { useSession } from '@/lib/ui/use-session';
import { Icon } from '@/lib/ui/Icon';

/** Mobile-only bottom navigation (spec §11). Hidden on desktop via CSS. */
export function BottomNav() {
  const path = usePathname();
  const session = useSession();
  const items = [
    { href: '/', label: 'Search', icon: 'search' },
    { href: '/favorites', label: 'Saved', icon: 'favorite' },
    {
      href: session.role === 'owner' || session.role === 'admin' ? '/owner' : '/signin',
      label: session.userId ? 'Account' : 'Sign in',
      icon: 'person',
    },
  ];
  return (
    <nav className="bottom-nav">
      {items.map((it) => {
        const active = path === it.href;
        return (
          <a key={it.href} href={it.href} className={`bn-item ${active ? 'on' : ''}`}>
            <Icon name={it.icon} size={24} fill={active} />
            {it.label}
          </a>
        );
      })}
    </nav>
  );
}
