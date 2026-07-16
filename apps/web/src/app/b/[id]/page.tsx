'use client';

import { use, useCallback, useEffect, useState } from 'react';
import { apiGet, apiSend } from '@/lib/ui/api-client';
import { cuisineEmoji, freshness, liveLabel, priceTier } from '@/lib/ui/format';
import { useSession } from '@/lib/ui/use-session';

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

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

type Review = { id: string; rating: number; body: string | null; createdAt: string; authorName: string };

export default function DetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const session = useSession();
  const [d, setD] = useState<Detail | null>(null);
  const [error, setError] = useState('');
  const [faved, setFaved] = useState(false);

  const loadDetail = useCallback(() => {
    apiGet<Detail>(`/businesses/${id}`)
      .then(setD)
      .catch((e) => setError(String(e.message)));
  }, [id]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  async function toggleFav() {
    try {
      await apiSend(faved ? 'DELETE' : 'PUT', `/businesses/${id}/favorite`);
      setFaved(!faved);
    } catch (e) {
      setError(String((e as Error).message));
    }
  }

  if (error) return <p className="error">{error}</p>;
  if (!d)
    return (
      <div className="stack">
        <div className="skel" style={{ height: 220 }} />
        <div className="skel" style={{ height: 24, width: '40%' }} />
        <div className="skel" style={{ height: 120 }} />
      </div>
    );

  // group menu by section
  const sections = d.menu.reduce<Record<string, typeof d.menu>>((acc, m) => {
    const k = m.section ?? 'Menu';
    (acc[k] ??= []).push(m);
    return acc;
  }, {});

  return (
    <div className="stack" style={{ gap: 20 }}>
      <a href="/" className="muted" style={{ fontSize: 14, fontWeight: 600 }}>
        ← Back to search
      </a>

      {/* gallery or placeholder */}
      {d.photos.some((p) => p.url) ? (
        <div className="gallery">
          {d.photos.map((p) => p.url && <img key={p.id} src={p.url} alt={d.name} />)}
        </div>
      ) : (
        <div className="card-media ph" style={{ borderRadius: 'var(--radius)', height: 200, aspectRatio: 'auto' }}>
          <span style={{ fontSize: 64 }}>{cuisineEmoji(d.categorySlug)}</span>
        </div>
      )}

      <div>
        <div className="row between">
          <h1 className="h1" style={{ fontSize: 32 }}>{d.name}</h1>
          <div className="row">
            {session.userId && (
              <button className="btn btn-sm" onClick={toggleFav}>
                {faved ? '★ Saved' : '☆ Save'}
              </button>
            )}
            <span className={`live live-${d.live}`}>{liveLabel[d.live]}</span>
          </div>
        </div>
        <div className="meta" style={{ marginTop: 8, fontSize: 14 }}>
          <span>{d.categorySlug ?? 'food'}</span>
          <span className="dot" />
          <span className="price">{priceTier(d.priceTier)}</span>
          {d.isVegFriendly && (
            <>
              <span className="dot" />
              <span>🌱 Veg-friendly</span>
            </>
          )}
          {d.reviewCount > 0 && (
            <>
              <span className="dot" />
              <span>★ {d.avgRating} ({d.reviewCount})</span>
            </>
          )}
          <span className="dot" />
          <span className="fresh">Updated {freshness(d.lastUpdatedAt)}</span>
        </div>
      </div>

      {d.description && <p className="lead">{d.description}</p>}
      <div className="row" style={{ gap: 20 }}>
        {d.address && <span className="muted">📍 {d.address}</span>}
        {d.phone && <span className="muted">📞 {d.phone}</span>}
      </div>

      {d.offers.length > 0 && (
        <div>
          <h2 className="h2">Current offers</h2>
          <div className="stack">
            {d.offers.map((o) => (
              <div key={o.id} className="panel" style={{ borderColor: 'var(--brand)' }}>
                <strong>{o.title}</strong>
                {o.description && <p className="muted" style={{ margin: '4px 0 0' }}>{o.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="h2">Menu</h2>
        {d.menu.length === 0 ? (
          <p className="muted">No menu items yet.</p>
        ) : (
          <div className="stack" style={{ gap: 20 }}>
            {Object.entries(sections).map(([section, items]) => (
              <div key={section}>
                <p className="eyebrow" style={{ color: 'var(--muted)' }}>{section}</p>
                <div className="panel" style={{ padding: '4px 18px' }}>
                  {items.map((m) => (
                    <div key={m.id} className="menu-item">
                      <span>
                        {m.isVeg && '🌱 '}
                        {m.name}
                      </span>
                      <strong style={{ whiteSpace: 'nowrap' }}>
                        {m.currency} {m.price}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {d.hours.length > 0 && (
        <div>
          <h2 className="h2">Opening hours</h2>
          <div className="panel">
            {d.hours.map((h) => (
              <div key={h.weekday} className="hours-row">
                <span>{DAYS[h.weekday]}</span>
                <span className={h.isClosed ? 'muted' : ''}>
                  {h.isClosed ? 'Closed' : `${(h.open ?? '').slice(0, 5)} – ${(h.close ?? '').slice(0, 5)}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Reviews businessId={id} canReview={!!session.userId} onPosted={loadDetail} />
    </div>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <span style={{ color: 'var(--warm)', letterSpacing: 1 }}>
      {'★'.repeat(n)}
      {'☆'.repeat(5 - n)}
    </span>
  );
}

function Reviews({
  businessId,
  canReview,
  onPosted,
}: {
  businessId: string;
  canReview: boolean;
  onPosted: () => void;
}) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const load = useCallback(() => {
    apiGet<{ data: Review[] }>(`/businesses/${businessId}/reviews`)
      .then((r) => setReviews(r.data))
      .catch(() => {});
  }, [businessId]);

  useEffect(() => {
    load();
  }, [load]);

  async function submit() {
    setBusy(true);
    setErr('');
    try {
      await apiSend('POST', `/businesses/${businessId}/reviews`, {
        rating,
        body: body || undefined,
      });
      setBody('');
      load();
      onPosted();
    } catch (e) {
      setErr(String((e as Error).message));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h2 className="h2">
        Reviews {reviews.length > 0 && <span className="muted">({reviews.length})</span>}
      </h2>

      {canReview ? (
        <div className="panel stack" style={{ marginBottom: 16 }}>
          <div className="row">
            <span className="label" style={{ margin: 0 }}>Your rating</span>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setRating(n)}
                className="btn btn-sm"
                style={{
                  padding: '2px 8px',
                  borderColor: n <= rating ? 'var(--warm)' : 'var(--border)',
                  color: n <= rating ? 'var(--warm)' : 'var(--muted)',
                }}
                aria-label={`${n} star`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            className="input"
            rows={3}
            placeholder="Share what you ordered and how it was…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <div>
            <button className="btn btn-primary" onClick={submit} disabled={busy}>
              {busy ? 'Posting…' : 'Post review'}
            </button>
          </div>
          {err && <p className="error">{err}</p>}
        </div>
      ) : (
        <p className="muted" style={{ marginBottom: 16 }}>
          <a href="/signin" style={{ color: 'var(--brand)' }}>Sign in</a> to leave a review.
        </p>
      )}

      {reviews.length === 0 ? (
        <p className="muted">No reviews yet. Be the first.</p>
      ) : (
        <div className="stack">
          {reviews.map((r) => (
            <div key={r.id} className="panel">
              <div className="row between">
                <strong>{r.authorName}</strong>
                <Stars n={r.rating} />
              </div>
              {r.body && <p style={{ margin: '6px 0 0' }}>{r.body}</p>}
              <p className="muted" style={{ fontSize: 12, margin: '6px 0 0' }}>
                {new Date(r.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
