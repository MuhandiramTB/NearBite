'use client';

import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import type { Map as LeafletMap } from 'leaflet';

/** Read-only location map for the customer detail page (spec §14). */
export function MapView({ lat, lng, label }: { lat: number; lng: number; label?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !ref.current || mapRef.current) return;
      const map = L.map(ref.current, {
        zoomControl: true,
        scrollWheelZoom: false,
      }).setView([lat, lng], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);
      const icon = L.divIcon({ className: 'nb-pin', html: '📍', iconSize: [30, 30], iconAnchor: [15, 28] });
      L.marker([lat, lng], { icon }).addTo(map).bindPopup(label ?? 'Here');
      mapRef.current = map;
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [lat, lng, label]);

  return <div ref={ref} className="map-box" />;
}
