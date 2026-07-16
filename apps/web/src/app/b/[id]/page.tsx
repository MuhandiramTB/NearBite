'use client';

import { use, useEffect, useState } from 'react';
import { apiGet } from '@/lib/ui/api-client';
import { freshness, liveLabel, priceTier } from '@/lib/ui/format';

type Detail = {
  id: string;
  name: string;
  categorySlug: string | null;
  priceTier: number;
  avgRating: number;
  reviewCount: number;
  live: 'open' | 'closed' | 'busy';
  description: string | null;
  address: string | null;
  phone: string | null;
  isVegFriendly: boolean;
  lastUpdatedAt: string;
  hours: { weekday: number; open: string | null; close: string | null; isClosed: boolean }[];
  menu: { id: string; name: string; price: number; currency: string; isVeg: boolean; section: string | null }[];
  photos: { id: string; url: string | null; kind: string }[];
  offers: { id: string; title: string; description: string | null; endsAt: string }[];
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function DetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [d, setD] = useState<Detail | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiGet<Detail>(`/businesses/${id}`)
      .then(setD)
      .catch((e) => setError(String(e.message)));
  }, [id]);

  if (error) return <p style={{ color: 'var(--danger)' }}>{error}</p>;
  if (!d) return <p className="muted">Loading…</p>;

  return (
    <div className="stack">
      <a href="/" className="muted" style={{ fontSize: 13 }}>
        ← Back to search
      </a>

      <div>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h1 className="h1">{d.name}</h1>
          <span className={`badge badge-${d.live}`}>{liveLabel[d.live]}</span>
        </div>
        <div className="row muted" style={{ fontSize: 14 }}>
          <span>{d.categorySlug ?? '—'}</span>
          <span>· {priceTier(d.priceTier)}</span>
          {d.isVegFriendly && <span>· 🌱 Veg-friendly</span>}
          {d.reviewCount > 0 && <span>· ★ {d.avgRating} ({d.reviewCount})</span>}
        </div>
        <div className="badge" style={{ marginTop: 8 }}>
          Updated {freshness(d.lastUpdatedAt)}
        </div>
      </div>

      {d.photos.length > 0 && (
        <div className="row" style={{ overflowX: 'auto' }}>
          {d.photos.map(
            (p) =>
              p.url && (
                <img
                  key={p.id}
                  src={p.url}
                  alt={d.name}
                  style={{ height: 160, borderRadius: 12, objectFit: 'cover' }}
                />
              ),
          )}
        </div>
      )}

      {d.description && <p>{d.description}</p>}
      {d.address && <p className="muted">📍 {d.address}</p>}
      {d.phone && <p className="muted">📞 {d.phone}</p>}

      {d.offers.length > 0 && (
        <div>
          <h2 className="h2">Offers</h2>
          {d.offers.map((o) => (
            <div key={o.id} className="card" style={{ borderColor: 'var(--brand)' }}>
              <strong>{o.title}</strong>
              {o.description && <p className="muted" style={{ margin: '4px 0 0' }}>{o.description}</p>}
            </div>
          ))}
        </div>
      )}

      <div>
        <h2 className="h2">Menu</h2>
        {d.menu.length === 0 && <p className="muted">No menu items yet.</p>}
        <div className="stack">
          {d.menu.map((m) => (
            <div key={m.id} className="row" style={{ justifyContent: 'space-between' }}>
              <span>
                {m.isVeg && '🌱 '}
                {m.name}
                {m.section && <span className="muted"> · {m.section}</span>}
              </span>
              <strong>
                {m.currency} {m.price}
              </strong>
            </div>
          ))}
        </div>
      </div>

      {d.hours.length > 0 && (
        <div>
          <h2 className="h2">Hours</h2>
          <div className="stack" style={{ gap: 4 }}>
            {d.hours.map((h) => (
              <div key={h.weekday} className="row muted" style={{ justifyContent: 'space-between', maxWidth: 240 }}>
                <span>{DAYS[h.weekday]}</span>
                <span>{h.isClosed ? 'Closed' : `${h.open ?? '—'} – ${h.close ?? '—'}`}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
