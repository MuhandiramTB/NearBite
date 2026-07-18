'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/ui/api-client';
import { useSession } from '@/lib/ui/use-session';
import { liveLabel, priceTier } from '@/lib/ui/format';

type Fav = { businessId: string; name: string; live: string; priceTier: number };

export default function FavoritesPage() {
  const session = useSession();
  const [items, setItems] = useState<Fav[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!session.userId) return;
    apiGet<{ data: Fav[] }>('/me/favorites')
      .then((r) => setItems(r.data))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [session.userId]);

  if (session.loading) return <p className="muted">Loading…</p>;
  if (!session.userId)
    return (
      <div className="stack" style={{ maxWidth: 420 }}>
        <h1 className="h1">Saved places</h1>
        <p>
          <a href="/signin" style={{ color: 'var(--brand)' }}>Sign in</a> to save and revisit your
          favorite places.
        </p>
      </div>
    );

  return (
    <div className="stack">
      <h1 className="h1">Saved places</h1>
      {loaded && items.length === 0 && (
        <div className="empty">
          <div className="big">❤️</div>
          <p>No saved places yet. Tap “Save” on any listing.</p>
        </div>
      )}
      <div className="results">
        {items.map((f) => (
          <a key={f.businessId} href={`/b/${f.businessId}`} className="card">
            <div className="card-body">
              <div className="row between">
                <span className="card-title">{f.name}</span>
                <span className={`live live-${f.live}`}>{liveLabel[f.live] ?? f.live}</span>
              </div>
              <span className="price">{priceTier(f.priceTier)}</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
