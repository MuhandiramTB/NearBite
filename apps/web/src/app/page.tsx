'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiGet } from '@/lib/ui/api-client';
import { distance, freshness, liveLabel, priceTier } from '@/lib/ui/format';

type Card = {
  id: string;
  name: string;
  categorySlug: string | null;
  priceTier: number;
  avgRating: number;
  reviewCount: number;
  live: 'open' | 'closed' | 'busy';
  distanceM: number;
  thumbnailUrl: string | null;
  lastUpdatedAt: string;
};
type Category = { id: string; slug: string; i18n: { en: string } };
type City = { id: string };

// Colombo Fort default (pilot). Real app uses geolocation.
const DEFAULT = { lat: 6.9344, lng: 79.8428 };

export default function HomePage() {
  const [cats, setCats] = useState<Category[]>([]);
  const [cityId, setCityId] = useState('');
  const [category, setCategory] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [openNow, setOpenNow] = useState(false);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      apiGet<{ data: City[] }>('/cities'),
      apiGet<{ data: Category[] }>('/categories'),
    ])
      .then(([c, k]) => {
        setCats(k.data);
        const first = c.data[0];
        if (first) setCityId(first.id);
      })
      .catch((e) => setError(String(e.message)));
  }, []);

  const runSearch = useCallback(async () => {
    if (!cityId) return;
    setLoading(true);
    setError('');
    const p = new URLSearchParams({
      lat: String(DEFAULT.lat),
      lng: String(DEFAULT.lng),
      cityId,
      radiusM: '10000',
      sort: 'distance',
    });
    if (category) p.set('categoryId', category);
    if (maxPrice) p.set('maxPriceTier', maxPrice);
    if (vegOnly) p.set('vegOnly', 'true');
    if (openNow) p.set('openNow', 'true');
    if (q) p.set('q', q);
    try {
      const res = await apiGet<{ data: Card[] }>(`/businesses?${p.toString()}`);
      setResults(res.data);
    } catch (e) {
      setError(String((e as Error).message));
    } finally {
      setLoading(false);
    }
  }, [cityId, category, maxPrice, vegOnly, openNow, q]);

  useEffect(() => {
    if (cityId) void runSearch();
  }, [cityId, runSearch]);

  return (
    <div className="stack">
      <div>
        <h1 className="h1">Find where to eat</h1>
        <p className="muted">Accurate menus, real photos, live status — kept fresh by the owners.</p>
      </div>

      <div className="card stack">
        <input
          className="input"
          placeholder="Search dish or place…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && runSearch()}
        />
        <div className="row">
          <select className="select" style={{ maxWidth: 180 }} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All cuisines</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.i18n.en}
              </option>
            ))}
          </select>
          <select className="select" style={{ maxWidth: 140 }} value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}>
            <option value="">Any price</option>
            <option value="1">$ or less</option>
            <option value="2">$$ or less</option>
            <option value="3">$$$ or less</option>
          </select>
          <label className="row" style={{ gap: 4 }}>
            <input type="checkbox" checked={vegOnly} onChange={(e) => setVegOnly(e.target.checked)} /> Veg
          </label>
          <label className="row" style={{ gap: 4 }}>
            <input type="checkbox" checked={openNow} onChange={(e) => setOpenNow(e.target.checked)} /> Open now
          </label>
          <button className="btn btn-primary" onClick={runSearch} disabled={loading}>
            {loading ? 'Searching…' : 'Search'}
          </button>
        </div>
      </div>

      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}

      <div className="grid grid-2">
        {results.map((b) => (
          <a key={b.id} href={`/b/${b.id}`} className="card" style={{ display: 'block' }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <strong>{b.name}</strong>
              <span className={`badge badge-${b.live}`}>{liveLabel[b.live]}</span>
            </div>
            <div className="row muted" style={{ fontSize: 13, marginTop: 4 }}>
              <span>{b.categorySlug ?? '—'}</span>
              <span>· {priceTier(b.priceTier)}</span>
              <span>· {distance(b.distanceM)}</span>
              {b.reviewCount > 0 && <span>· ★ {b.avgRating}</span>}
            </div>
            <div className="badge" style={{ marginTop: 8 }}>
              Updated {freshness(b.lastUpdatedAt)}
            </div>
          </a>
        ))}
        {!loading && results.length === 0 && !error && (
          <p className="muted">No places found. Try widening your filters.</p>
        )}
      </div>
    </div>
  );
}
