'use client';

import { usePathname } from 'next/navigation';
import { useSession } from '@/lib/ui/use-session';
import { SvgIcon, type IconName } from '@/lib/ui/SvgIcon';

/** Mobile-only bottom navigation (spec §11). Unique SVG icon set, no web-font
 *  dependency so glyphs always render. Hidden on desktop via CSS. */
export function BottomNav() {
  const path = usePathname();
  const session = useSession();

  const accountHref = session.role === 'owner' || session.role === 'admin' ? '/owner' : session.userId ? '/signin' : '/signin';
  const items: { href: string; label: string; icon: IconName }[] = [
    { href: '/', label: 'Discover', icon: 'discover' },
    { href: '/favorites', label: 'Saved', icon: 'saved' },
    { href: accountHref, label: session.userId ? 'Account' : 'Sign in', icon: 'user' },
  ];

  return (
    <nav className="bottom-nav">
      {items.map((it) => {
        const active = path === it.href;
        return (
          <a key={it.href} href={it.href} className={`bn-item ${active ? 'on' : ''}`}>
            <SvgIcon name={it.icon} size={23} fill={active && it.icon === 'saved'} />
            <span>{it.label}</span>
          </a>
        );
      })}
    </nav>
  );
}
