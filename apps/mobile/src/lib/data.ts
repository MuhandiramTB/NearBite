import * as Location from 'expo-location';
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

export type Loc = { lat: number; lng: number };

/** Pilot city id + its center (fallback location if the user denies GPS). */
export async function getPilotCity(): Promise<{ id: string; center: Loc | null } | null> {
  const { data: cities } = await supabase.rpc('list_cities');
  const first = (cities ?? [])[0] as { id: string; lat: number | null; lng: number | null } | undefined;
  if (!first) return null;
  return {
    id: first.id,
    center: first.lat != null && first.lng != null ? { lat: first.lat, lng: first.lng } : null,
  };
}

/** Real device location via expo-location; falls back to the given city center. */
export async function getUserLocation(fallback: Loc | null): Promise<Loc | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return fallback;
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  } catch {
    return fallback;
  }
}

export async function search(cityId: string, loc: Loc, opts: { q?: string; vegOnly?: boolean } = {}) {
  const { data, error } = await supabase.rpc('search_businesses', {
    p_lat: loc.lat,
    p_lng: loc.lng,
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
