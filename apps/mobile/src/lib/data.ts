import { supabase } from './supabase';

/** Data access for the mobile app — same RPCs the web uses, called directly
 *  via the Supabase client (RLS restricts anon to approved listings). */

export type Card = {
  id: string;
  name: string;
  category_slug: string | null;
  price_tier: number;
  avg_rating: number;
  review_count: number;
  live: 'open' | 'closed' | 'busy';
  distance_m: number;
  last_updated_at: string;
};

// Colombo Fort (pilot default). A real build would use expo-location.
export const DEFAULT_LOC = { lat: 6.9344, lng: 79.8428 };

export async function getPilotCityId(): Promise<string | null> {
  const { data } = await supabase.from('cities').select('id').limit(1).maybeSingle();
  return (data?.id as string) ?? null;
}

export async function search(cityId: string, opts: { q?: string; vegOnly?: boolean } = {}) {
  const { data, error } = await supabase.rpc('search_businesses', {
    p_lat: DEFAULT_LOC.lat,
    p_lng: DEFAULT_LOC.lng,
    p_radius_m: 10000,
    p_city_id: cityId,
    p_q: opts.q ?? null,
    p_veg_only: opts.vegOnly ?? false,
    p_sort: 'distance',
    p_limit: 30,
    p_offset: 0,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as Card[];
}

export async function detail(id: string) {
  const { data, error } = await supabase.rpc('business_detail', { p_id: id });
  if (error) throw new Error(error.message);
  return data as Record<string, unknown> | null;
}

export function freshness(iso: string | null): string {
  if (!iso) return 'never';
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${Math.max(0, mins)}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function distanceLabel(m: number): string {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}
