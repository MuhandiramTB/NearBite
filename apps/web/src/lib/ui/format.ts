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

/** Human labels + icons for rich-attribute tags. */
export const ATTR_LABELS: Record<string, string> = {
  // facilities
  ac: 'AC', parking: 'Parking', wifi: 'WiFi', outdoor_seating: 'Outdoor seating',
  indoor_seating: 'Indoor seating', rooftop: 'Rooftop', garden: 'Garden',
  sea_view: 'Sea view', mountain_view: 'Mountain view', kids_area: 'Kids area',
  wheelchair: 'Wheelchair access', washroom: 'Washroom',
  // visit purpose
  date: 'Couple date', family: 'Family', friends: 'Friends', business: 'Business',
  birthday: 'Birthday', relaxing: 'Relaxing', photo_spot: 'Photo spot', quick_meal: 'Quick meal',
  // convenience
  delivery: 'Delivery', takeaway: 'Takeaway', reservation: 'Reservation',
  cash: 'Cash', card: 'Card', pickme_uber: 'PickMe / Uber',
};
export const attrLabel = (k: string) => ATTR_LABELS[k] ?? k.replace(/_/g, ' ');

/** Warm gradient stops per cuisine for the "no photo" card scene. */
export function cuisineGradient(slug: string | null | undefined): { a: string; b: string } {
  const map: Record<string, { a: string; b: string }> = {
    'sri-lankan': { a: '#ff8a3d', b: '#d81f1f' },
    cafe: { a: '#c98a4b', b: '#6b4423' },
    chinese: { a: '#ff5e5e', b: '#a80f2e' },
    indian: { a: '#ffb020', b: '#d8541f' },
    bakery: { a: '#f0b46b', b: '#b5651d' },
    'fast-food': { a: '#ffd23d', b: '#e0281a' },
  };
  return (slug && map[slug]) || { a: '#ff7a3d', b: '#e0281a' };
}

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
