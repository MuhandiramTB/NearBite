/** Small presentational helpers shared across pages. */

export function freshness(iso: string | null | undefined): string {
  if (!iso) return 'never updated';
  const then = new Date(iso).getTime();
  const mins = Math.floor((Date.now() - then) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function priceTier(n: number): string {
  return '$'.repeat(Math.max(1, Math.min(4, n)));
}

export function distance(m: number): string {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

export const liveLabel: Record<string, string> = {
  open: 'Open',
  busy: 'Busy',
  closed: 'Closed',
};

/** Emoji used for the gradient placeholder when a listing has no photo. */
export function cuisineEmoji(slug: string | null | undefined): string {
  const map: Record<string, string> = {
    'sri-lankan': '🍛',
    cafe: '☕',
    chinese: '🥡',
    indian: '🍲',
    bakery: '🥐',
    'fast-food': '🍔',
  };
  return (slug && map[slug]) || '🍽️';
}
