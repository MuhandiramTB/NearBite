/**
 * Inline SVG icons — guaranteed to render (no web-font dependency, unlike the
 * Material Symbols font which can fail/flash on mobile). A small, cohesive
 * NearBite set drawn on a 24px grid, 2px stroke, rounded — our own look.
 */
type Props = { name: IconName; size?: number; fill?: boolean; className?: string; style?: React.CSSProperties };
export type IconName =
  | 'discover'
  | 'saved'
  | 'saved-fill'
  | 'user'
  | 'store'
  | 'search'
  | 'menu'
  | 'close'
  | 'star'
  | 'pin'
  | 'clock'
  | 'shield';

const P: Record<IconName, string> = {
  // compass / discover
  discover: 'M12 22a10 10 0 100-20 10 10 0 000 20zM16 8l-2.5 5.5L8 16l2.5-5.5L16 8z',
  saved: 'M20.8 5.6a5 5 0 00-7.1 0L12 7.3l-1.7-1.7a5 5 0 10-7.1 7.1L12 21.5l8.8-8.8a5 5 0 000-7.1z',
  'saved-fill': 'M20.8 5.6a5 5 0 00-7.1 0L12 7.3l-1.7-1.7a5 5 0 10-7.1 7.1L12 21.5l8.8-8.8a5 5 0 000-7.1z',
  user: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z',
  store: 'M3 9l1.5-5h15L21 9 M4 9v11h16V9 M4 9h16 M9 20v-6h6v6',
  search: 'M11 19a8 8 0 100-16 8 8 0 000 16z M21 21l-4.3-4.3',
  menu: 'M3 6h18 M3 12h18 M3 18h18',
  close: 'M18 6L6 18 M6 6l12 12',
  star: 'M12 2l3 6.5 7 .9-5 4.8 1.2 7L12 18l-6.4 3.2 1.2-7-5-4.8 7-.9L12 2z',
  pin: 'M12 22s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z M12 12a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
  clock: 'M12 22a10 10 0 100-20 10 10 0 000 20z M12 7v5l3 2',
  shield: 'M12 2l8 3v6c0 5-3.4 9-8 11-4.6-2-8-6-8-11V5l8-3z M9 12l2 2 4-4',
};

export function SvgIcon({ name, size = 24, fill = false, className, style }: Props) {
  const filled = name === 'saved-fill' || (fill && name === 'saved') || (fill && name === 'star');
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <path d={P[name]} />
    </svg>
  );
}
