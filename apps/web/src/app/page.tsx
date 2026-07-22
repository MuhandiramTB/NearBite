'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CONVENIENCE, FACILITIES, VISIT_PURPOSES } from '@nearbite/contracts';
import { apiGet } from '@/lib/ui/api-client';
import { attrLabel, cuisineEmoji, cuisineGradient, distance, freshness, liveLabel, priceTier } from '@/lib/ui/format';
import { useGeolocation } from '@/lib/ui/use-geolocation';
import { Icon } from '@/lib/ui/Icon';

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
type City = { id: string; name: string; lat: number | null; lng: number | null };

type View = 'grid' | 'list';

export default function DiscoverPage() {
  const [cats, setCats] = useState<Category[]>([]);
  const [cityId, setCityId] = useState('');
  const [cityCenter, setCityCenter] = useState<{ lat: number; lng: number } | null>(null);
  const geo = useGeolocation(cityCenter);
  const [category, setCategory] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [openNow, setOpenNow] = useState(false);
  const [minRating, setMinRating] = useState('');
  const [radius, setRadius] = useState('10000');
  const [facilities, setFacilities] = useState<string[]>([]);
  const [purposes, setPurposes] = useState<string[]>([]);
  const [convenience, setConvenience] = useState<string[]>([]);
  const [sort, setSort] = useState('distance');
  const [q, setQ] = useState('');
  const [view, setView] = useState<View>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [results, setResults] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([apiGet<{ data: City[] }>('/cities'), apiGet<{ data: Category[] }>('/categories')])
      .then(([c, k]) => {
        setCats(k.data);
        const city = c.data[0];
        if (city) {
          setCityId(city.id);
          if (city.lat != null && city.lng != null) setCityCenter({ lat: city.lat, lng: city.lng });
        }
      })
      .catch((e) => setError(String(e.message)));
  }, []);

  const runSearch = useCallback(async () => {
    if (!cityId || geo.lat == null || geo.lng == null) return;
    setLoading(true);
    setError('');
    const p = new URLSearchParams({
      lat: String(geo.lat),
      lng: String(geo.lng),
      cityId,
      radiusM: radius,
      sort,
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
  }, [cityId, geo.lat, geo.lng, category, maxPrice, vegOnly, openNow, minRating, radius, facilities, purposes, convenience, sort, q]);

  useEffect(() => {
    if (cityId && geo.lat != null) void runSearch();
  }, [cityId, geo.lat, runSearch]);

  // Featured rails computed client-side from the result set.
  const rails = useMemo(() => {
    const byRating = [...results].sort((a, b) => b.avgRating - a.avgRating).slice(0, 8);
    const trending = [...results].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 8);
    const fresh = [...results]
      .sort((a, b) => +new Date(b.lastUpdatedAt) - +new Date(a.lastUpdatedAt))
      .slice(0, 8);
    return { byRating, trending, fresh };
  }, [results]);

  const activeFilterCount =
    (category ? 1 : 0) +
    (maxPrice ? 1 : 0) +
    (vegOnly ? 1 : 0) +
    (openNow ? 1 : 0) +
    (minRating ? 1 : 0) +
    facilities.length +
    purposes.length +
    convenience.length;

  return (
    <div className="stack" style={{ gap: 4 }}>
      {/* Hero */}
      <section className="hero">
        <p className="eyebrow">
          {geo.status === 'granted' ? (
            '📍 Using your location'
          ) : geo.status === 'locating' ? (
            '📍 Finding you…'
          ) : (
            <>
              📍 Location off —{' '}
              <button
                onClick={geo.request}
                style={{ border: 'none', background: 'none', color: 'var(--brand)', cursor: 'pointer', font: 'inherit', padding: 0, textDecoration: 'underline' }}
              >
                use my location
              </button>
            </>
          )}
        </p>
        <h1 className="h1">Find where to eat — menus you can trust.</h1>
        <p className="lead" style={{ marginTop: 10 }}>
          Real prices, real photos, live open/busy status — kept fresh by the owners themselves.
        </p>
        <div className="searchbar">
          <div className="search-wrap">
            <Icon name="search" size={22} className="search-icon" />
            <input
              className="input search-input"
              placeholder="Search dishes, cuisines, or restaurants…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runSearch()}
            />
          </div>
          <button className="btn btn-primary" onClick={runSearch} disabled={loading}>
            {loading ? '…' : 'Find food'}
          </button>
        </div>

        {/* Category chips */}
        <div className="chip-scroll">
          <button
            className={`cat-chip ${!category ? 'on' : ''}`}
            onClick={() => setCategory('')}
          >
            All
          </button>
          {cats.map((c) => (
            <button
              key={c.id}
              className={`cat-chip ${category === c.id ? 'on' : ''}`}
              onClick={() => setCategory(category === c.id ? '' : c.id)}
            >
              {cuisineEmoji(c.slug)} {c.i18n.en}
            </button>
          ))}
        </div>
      </section>

      {/* Controls row */}
      <div className="row between" style={{ marginTop: 22 }}>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn btn-sm" onClick={() => setShowFilters((v) => !v)}>
            ⚙ Filters{activeFilterCount > 0 ? ` · ${activeFilterCount}` : ''}
          </button>
          <select
            className="select"
            style={{ width: 'auto', padding: '6px 10px' }}
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="distance">Sort: Nearest</option>
            <option value="rating">Sort: Top rated</option>
            <option value="price">Sort: Cheapest</option>
          </select>
        </div>
        <div className="seg">
          <button className={`seg-btn ${view === 'grid' ? 'on' : ''}`} onClick={() => setView('grid')} aria-label="Grid view">
            ▦
          </button>
          <button className={`seg-btn ${view === 'list' ? 'on' : ''}`} onClick={() => setView('list')} aria-label="List view">
            ☰
          </button>
        </div>
      </div>

      {showFilters && (
        <FilterPanel
          {...{
            maxPrice, setMaxPrice, vegOnly, setVegOnly, openNow, setOpenNow,
            minRating, setMinRating, radius, setRadius,
            facilities, setFacilities, purposes, setPurposes, convenience, setConvenience,
          }}
        />
      )}

      {error && <p className="error" style={{ marginTop: 16 }}>{error}</p>}

      {/* Featured rails (only on the default, unfiltered grid view) */}
      {!loading && activeFilterCount === 0 && !q && view === 'grid' && results.length > 3 && (
        <>
          <Rail title="⭐ Best rated" items={rails.byRating} />
          <Rail title="🔥 Trending" items={rails.trending} />
          <Rail title="🆕 Recently updated" items={rails.fresh} />
          <h2 className="h2" style={{ marginTop: 8 }}>All places</h2>
        </>
      )}

      {/* Main results */}
      {view === 'grid' ? (
        <div className="results">
          {loading && results.length === 0
            ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="skel skel-card" />)
            : results.map((b) => <RestaurantCard key={b.id} b={b} />)}
          {!loading && results.length === 0 && !error && (
            <div className="empty">
              <div className="big">🍽️</div>
              <p>No places match. Try widening your filters or radius.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="stack" style={{ marginTop: 18 }}>
          {results.map((b) => <RestaurantRow key={b.id} b={b} />)}
          {!loading && results.length === 0 && <p className="muted">No places found.</p>}
        </div>
      )}

      {/* Quick discover — bento */}
      <section style={{ marginTop: 40 }}>
        <h2 className="h2">Quick discover</h2>
        <div className="bento">
          {[
            { label: 'Local Favorites', img: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80' },
            { label: 'Sweets', img: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80' },
            { label: 'Drinks', img: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&q=80' },
          ].map((t) => (
            <div key={t.label} className="bento-tile" onClick={() => setShowFilters(true)}>
              <img src={t.img} alt={t.label} loading="lazy" />
              <div className="scrim" />
              <span className="bento-label">{t.label}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ---------- cards ---------- */

function CardMedia({ b }: { b: Card }) {
  const g = cuisineGradient(b.categorySlug);
  return (
    <div
      className={`card-media ${b.thumbnailUrl ? '' : 'ph'}`}
      style={!b.thumbnailUrl ? ({ ['--ph-a' as string]: g.a, ['--ph-b' as string]: g.b } as React.CSSProperties) : undefined}
    >
      {b.thumbnailUrl ? (
        <img src={b.thumbnailUrl} alt={b.name} loading="lazy" />
      ) : (
        <span className="ph-emoji">{cuisineEmoji(b.categorySlug)}</span>
      )}
      <span className="verified-badge">
        <Icon name="verified" size={15} fill /> Verified
      </span>
      {b.live !== 'closed' && (
        <span className={`live-pill live-pill-${b.live}`}>
          <span className="live-dot" /> {b.live === 'open' ? 'Open now' : 'Busy'}
        </span>
      )}
    </div>
  );
}

function RestaurantCard({ b }: { b: Card }) {
  return (
    <a href={`/b/${b.id}`} className="rcard">
      <CardMedia b={b} />
      <div className="rcard-body">
        <div className="row between" style={{ alignItems: 'flex-start', gap: 8 }}>
          <h3 className="rcard-title">{b.name}</h3>
          {b.reviewCount > 0 && (
            <span className="star-chip">
              <Icon name="star" size={16} fill style={{ color: 'var(--gold)' }} /> {b.avgRating}
            </span>
          )}
        </div>
        <div className="rcard-meta">
          <Icon name="location_on" size={16} />
          <span>
            {distance(b.distanceM)} · <span style={{ textTransform: 'capitalize' }}>{b.categorySlug ?? 'food'}</span> ·{' '}
            {priceTier(b.priceTier)}
          </span>
        </div>
        <div className="rcard-updated">
          <Icon name="schedule" size={15} />
          <span>Updated {freshness(b.lastUpdatedAt)}</span>
        </div>
      </div>
    </a>
  );
}

function RestaurantRow({ b }: { b: Card }) {
  const g = cuisineGradient(b.categorySlug);
  return (
    <a href={`/b/${b.id}`} className="panel row" style={{ gap: 14, alignItems: 'center', cursor: 'pointer' }}>
      <div
        className={`card-media ${b.thumbnailUrl ? '' : 'ph'}`}
        style={
          {
            width: 104,
            height: 78,
            borderRadius: 10,
            flex: 'none',
            aspectRatio: 'auto',
            ['--ph-a' as string]: g.a,
            ['--ph-b' as string]: g.b,
          } as React.CSSProperties
        }
      >
        {b.thumbnailUrl ? <img src={b.thumbnailUrl} alt={b.name} /> : <span className="ph-emoji" style={{ fontSize: 30 }}>{cuisineEmoji(b.categorySlug)}</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="row between">
          <span className="card-title">{b.name}</span>
          <span className={`live live-${b.live}`}>{liveLabel[b.live]}</span>
        </div>
        <div className="meta">
          <span style={{ textTransform: 'capitalize' }}>{b.categorySlug ?? 'food'}</span>
          <span className="dot" />
          <span className="price">{priceTier(b.priceTier)}</span>
          <span className="dot" />
          <span>{distance(b.distanceM)}</span>
          {b.reviewCount > 0 && (
            <>
              <span className="dot" />
              <span style={{ color: 'var(--gold)', fontWeight: 800 }}>★ {b.avgRating}</span>
            </>
          )}
        </div>
        <span className="fresh">Updated {freshness(b.lastUpdatedAt)}</span>
      </div>
    </a>
  );
}

function Rail({ title, items }: { title: string; items: Card[] }) {
  if (items.length === 0) return null;
  return (
    <div style={{ marginTop: 20 }}>
      <h2 className="h2" style={{ marginBottom: 10 }}>{title}</h2>
      <div className="rail">
        {items.map((b) => (
          <div key={b.id} className="rail-card">
            <RestaurantCard b={b} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- filter panel ---------- */

type FilterProps = {
  maxPrice: string; setMaxPrice: (v: string) => void;
  vegOnly: boolean; setVegOnly: (v: boolean) => void;
  openNow: boolean; setOpenNow: (v: boolean) => void;
  minRating: string; setMinRating: (v: string) => void;
  radius: string; setRadius: (v: string) => void;
  facilities: string[]; setFacilities: (v: string[]) => void;
  purposes: string[]; setPurposes: (v: string[]) => void;
  convenience: string[]; setConvenience: (v: string[]) => void;
};

function FilterPanel(p: FilterProps) {
  const toggle = (arr: string[], set: (v: string[]) => void, val: string) =>
    set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);

  return (
    <div className="panel stack" style={{ marginTop: 14, gap: 16 }}>
      <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
        <div>
          <span className="label">Budget</span>
          <select className="select" style={{ maxWidth: 160 }} value={p.maxPrice} onChange={(e) => p.setMaxPrice(e.target.value)}>
            <option value="">Any</option>
            <option value="1">Under Rs.500 ($)</option>
            <option value="2">Rs.500–1000 ($$)</option>
            <option value="3">Rs.1000–2000 ($$$)</option>
          </select>
        </div>
        <div>
          <span className="label">Rating</span>
          <select className="select" style={{ maxWidth: 130 }} value={p.minRating} onChange={(e) => p.setMinRating(e.target.value)}>
            <option value="">Any</option>
            <option value="4.5">4.5★ +</option>
            <option value="4">4★ +</option>
            <option value="3">3★ +</option>
          </select>
        </div>
        <div>
          <span className="label">Distance</span>
          <select className="select" style={{ maxWidth: 130 }} value={p.radius} onChange={(e) => p.setRadius(e.target.value)}>
            <option value="1000">1 km</option>
            <option value="5000">5 km</option>
            <option value="10000">10 km</option>
            <option value="25000">25 km</option>
          </select>
        </div>
        <div style={{ alignSelf: 'flex-end', display: 'flex', gap: 8 }}>
          <label className="check">
            <input type="checkbox" checked={p.vegOnly} onChange={(e) => p.setVegOnly(e.target.checked)} /> Veg
          </label>
          <label className="check">
            <input type="checkbox" checked={p.openNow} onChange={(e) => p.setOpenNow(e.target.checked)} /> Open now
          </label>
        </div>
      </div>

      {(
        [
          ['Good for', VISIT_PURPOSES, p.purposes, p.setPurposes],
          ['Facilities', FACILITIES, p.facilities, p.setFacilities],
          ['Convenience', CONVENIENCE, p.convenience, p.setConvenience],
        ] as const
      ).map(([label, opts, sel, set]) => (
        <div key={label}>
          <span className="label">{label}</span>
          <div className="row" style={{ gap: 6 }}>
            {opts.map((o) => (
              <button
                key={o}
                className="check"
                style={sel.includes(o) ? { background: 'var(--brand)', color: 'var(--brand-ink)', borderColor: 'transparent' } : undefined}
                onClick={() => toggle(sel as string[], set as (v: string[]) => void, o)}
              >
                {attrLabel(o)}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
