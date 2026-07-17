'use client';

import { useCallback, useEffect, useState } from 'react';

export type GeoState = {
  status: 'idle' | 'locating' | 'granted' | 'denied' | 'unavailable' | 'fallback';
  lat: number | null;
  lng: number | null;
};

/**
 * Real device location via the Geolocation API (spec: no hardcoded coords).
 * On permission grant → the user's actual position. On denial/unavailable →
 * `fallback` with the provided city-center coordinates (from the DB), so search
 * still works. `request()` re-prompts (e.g. a "Use my location" button).
 */
export function useGeolocation(fallback: { lat: number; lng: number } | null): GeoState & {
  request: () => void;
} {
  const [state, setState] = useState<GeoState>({ status: 'idle', lat: null, lng: null });

  const request = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setState({ status: 'unavailable', lat: fallback?.lat ?? null, lng: fallback?.lng ?? null });
      return;
    }
    setState((s) => ({ ...s, status: 'locating' }));
    navigator.geolocation.getCurrentPosition(
      (pos) => setState({ status: 'granted', lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setState({ status: 'denied', lat: fallback?.lat ?? null, lng: fallback?.lng ?? null }),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    );
  }, [fallback?.lat, fallback?.lng]);

  // Auto-request once a fallback is known (so we always have *some* location).
  useEffect(() => {
    if (fallback && state.status === 'idle') request();
  }, [fallback, state.status, request]);

  // If denied/unavailable but fallback arrives later, adopt it.
  useEffect(() => {
    if (fallback && state.lat === null && (state.status === 'denied' || state.status === 'unavailable')) {
      setState((s) => ({ ...s, status: 'fallback', lat: fallback.lat, lng: fallback.lng }));
    }
  }, [fallback, state.lat, state.status]);

  return { ...state, request };
}
