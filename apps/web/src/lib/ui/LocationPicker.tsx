'use client';

import 'leaflet/dist/leaflet.css';
import { useEffect, useRef, useState } from 'react';
import type { Map as LeafletMap, Marker } from 'leaflet';

/**
 * Interactive location picker (spec §14). Click the map or drag the pin to set
 * the business location; reverse-geocodes to a human address via the free
 * Nominatim (OpenStreetMap) service. No API key required.
 */
export type PickedLocation = {
  lat: number;
  lng: number;
  address?: string;
  city?: string;
  district?: string;
  country?: string;
};

export function LocationPicker({
  value,
  onChange,
}: {
  value: { lat: number; lng: number } | null;
  onChange: (loc: PickedLocation) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const [addr, setAddr] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !ref.current || mapRef.current) return;

      const start = value ?? { lat: 6.9271, lng: 79.8612 }; // map's initial view only
      const map = L.map(ref.current).setView([start.lat, start.lng], value ? 15 : 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      const icon = L.divIcon({
        className: 'nb-pin',
        html: '📍',
        iconSize: [30, 30],
        iconAnchor: [15, 28],
      });
      const marker = L.marker([start.lat, start.lng], { draggable: true, icon }).addTo(map);
      mapRef.current = map;
      markerRef.current = marker;

      async function commit(lat: number, lng: number) {
        marker.setLatLng([lat, lng]);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } },
          );
          const j = await res.json();
          const a = j.address ?? {};
          const label = j.display_name ?? '';
          setAddr(label);
          onChange({
            lat,
            lng,
            address: label,
            city: a.city ?? a.town ?? a.village ?? a.suburb,
            district: a.state_district ?? a.county,
            country: a.country,
          });
        } catch {
          onChange({ lat, lng });
          setAddr(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        }
      }

      map.on('click', (e: { latlng: { lat: number; lng: number } }) => commit(e.latlng.lat, e.latlng.lng));
      marker.on('dragend', () => {
        const p = marker.getLatLng();
        commit(p.lat, p.lng);
      });
      if (value) void commit(value.lat, value.lng);
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className="stack" style={{ gap: 6 }}>
      <div className="row" style={{ gap: 8 }}>
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => {
            navigator.geolocation?.getCurrentPosition((pos) => {
              const { latitude, longitude } = pos.coords;
              mapRef.current?.setView([latitude, longitude], 16);
              markerRef.current?.setLatLng([latitude, longitude]);
              markerRef.current?.fire('dragend');
            });
          }}
        >
          📍 Use my current location
        </button>
        <span className="muted" style={{ fontSize: 12 }}>or click / drag the pin</span>
      </div>
      <div ref={ref} className="map-box" />
      {addr && <p className="muted" style={{ fontSize: 13, margin: 0 }}>📍 {addr}</p>}
    </div>
  );
}
