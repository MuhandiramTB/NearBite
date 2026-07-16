'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiGet } from '@/lib/ui/api-client';
import { CONVENIENCE, FACILITIES, VISIT_PURPOSES } from '@nearbite/contracts';
import { attrLabel, cuisineEmoji, distance, freshness, liveLabel, priceTier } from '@/lib/ui/format';
import { useI18n } from '@/lib/i18n';

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

const DEFAULT = { lat: 6.9344, lng: 79.8428 }; // Colombo Fort (pilot)

export default function HomePage() {
  const { t } = useI18n();
  const [cats, setCats] = useState<Category[]>([]);
  const [cityId, setCityId] = useState('');
  const [category, setCategory] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [openNow, setOpenNow] = useState(false);
  const [minRating, setMinRating] = useState('');
  const [facilities, setFacilities] = useState<string[]>([]);
  const [purposes, setPurposes] = useState<string[]>([]);
  const [convenience, setConvenience] = useState<string[]>([]);
  const [showMore, setShowMore] = useState(false);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      apiGet<{ data: City[] }>('/cities'),
      apiGet<{ data: Category[] }>('/categories'),
    ])
      .then(([c, k]) => {
        setCats(k.data);
        if (c.data[0]) setCityId(c.data[0].id);
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
    if (minRating) p.set('minRating', minRating);
    if (facilities.length) p.set('facilities', facilities.join(','));
    if (purposes.length) p.set('visitPurposes', purposes.join(','));
    if (convenience.length) p.set('convenience', convenience.join(','));
    if (q) p.set('q', q);
    try {
      const res = await apiGet<{ data: Card[] }>(`/businesses?${p.toString()}`);
      setResults(res.data);
    } catch (e) {
      setError(String((e as Error).message));
    } finally {
      setLoading(false);
    }
  }, [cityId, category, maxPrice, vegOnly, openNow, minRating, facilities, purposes, convenience, q]);

  useEffect(() => {
    if (cityId) void runSearch();
  }, [cityId, runSearch]);

  return (
    <div className="stack" style={{ gap: 4 }}>
      <section className="hero">
        <p className="eyebrow">Colombo pilot</p>
        <h1 className="h1">{t('home.title')}</h1>
        <p className="lead" style={{ marginTop: 10 }}>
          {t('home.subtitle')}
        </p>

        <div className="searchbar">
          <input
            className="input search-input"
            placeholder={t('home.searchPlaceholder')}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runSearch()}
          />
          <button className="btn btn-primary" onClick={runSearch} disabled={loading}>
            {loading ? '…' : t('common.search')}
          </button>
        </div>

        <div className="filterbar">
          <select
            className="select"
            style={{ maxWidth: 180 }}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All cuisines</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.i18n.en}
              </option>
            ))}
          </select>
          <select
            className="select"
            style={{ maxWidth: 150 }}
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          >
            <option value="">Any price</option>
            <option value="1">$ or less</option>
            <option value="2">$$ or less</option>
            <option value="3">$$$ or less</option>
          </select>
          <label className="check">
            <input type="checkbox" checked={vegOnly} onChange={(e) => setVegOnly(e.target.checked)} />
            Veg
          </label>
          <label className="check">
            <input type="checkbox" checked={openNow} onChange={(e) => setOpenNow(e.target.checked)} />
            Open now
          </label>
          <select
            className="select"
            style={{ maxWidth: 150 }}
            value={minRating}
            onChange={(e) => setMinRating(e.target.value)}
          >
            <option value="">Any rating</option>
            <option value="4.5">4.5★ +</option>
            <option value="4">4★ +</option>
            <option value="3">3★ +</option>
          </select>
          <button className="btn btn-sm" onClick={() => setShowMore((v) => !v)}>
            {showMore ? 'Fewer filters' : 'More filters'}
          </button>
        </div>

        {showMore && (
          <div className="stack" style={{ marginTop: 14, gap: 12 }}>
            {(
              [
                ['Good for', VISIT_PURPOSES, purposes, setPurposes],
                ['Facilities', FACILITIES, facilities, setFacilities],
                ['Convenience', CONVENIENCE, convenience, setConvenience],
              ] as const
            ).map(([label, opts, sel, setSel]) => (
              <div key={label}>
                <p className="eyebrow" style={{ color: 'var(--muted)', marginBottom: 6 }}>{label}</p>
                <div className="row" style={{ gap: 6 }}>
                  {opts.map((o) => {
                    const on = (sel as string[]).includes(o);
                    return (
                      <button
                        key={o}
                        className="check"
                        style={
                          on
                            ? { background: 'var(--brand)', color: 'var(--brand-ink)', borderColor: 'transparent' }
                            : undefined
                        }
                        onClick={() =>
                          (setSel as (v: string[]) => void)(
                            on ? (sel as string[]).filter((x) => x !== o) : [...(sel as string[]), o],
                          )
                        }
                      >
                        {attrLabel(o)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {error && <p className="error" style={{ marginTop: 20 }}>{error}</p>}

      <div className="results">
        {loading &&
          results.length === 0 &&
          Array.from({ length: 6 }).map((_, i) => <div key={i} className="skel skel-card" />)}

        {!loading &&
          results.map((b) => (
            <a key={b.id} href={`/b/${b.id}`} className="card">
              <div className={`card-media ${b.thumbnailUrl ? '' : 'ph'}`}>
                {b.thumbnailUrl ? (
                  <img src={b.thumbnailUrl} alt={b.name} />
                ) : (
                  <span>{cuisineEmoji(b.categorySlug)}</span>
                )}
              </div>
              <div className="card-body">
                <div className="row between" style={{ gap: 8 }}>
                  <span className="card-title">{b.name}</span>
                  <span className={`live live-${b.live}`}>{liveLabel[b.live]}</span>
                </div>
                <div className="meta">
                  <span>{b.categorySlug ?? 'food'}</span>
                  <span className="dot" />
                  <span className="price">{priceTier(b.priceTier)}</span>
                  <span className="dot" />
                  <span>{distance(b.distanceM)}</span>
                  {b.reviewCount > 0 && (
                    <>
                      <span className="dot" />
                      <span>★ {b.avgRating}</span>
                    </>
                  )}
                </div>
                <span className="fresh">Updated {freshness(b.lastUpdatedAt)}</span>
              </div>
            </a>
          ))}

        {!loading && results.length === 0 && !error && (
          <div className="empty">
            <div className="big">🍽️</div>
            <p>No places match yet. Try widening your filters or search radius.</p>
          </div>
        )}
      </div>
    </div>
  );
}
