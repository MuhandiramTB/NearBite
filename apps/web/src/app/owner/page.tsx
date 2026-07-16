'use client';

import { useCallback, useEffect, useState } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { apiGet, apiSend } from '@/lib/ui/api-client';
import { freshness, liveLabel } from '@/lib/ui/format';
import { useSession } from '@/lib/ui/use-session';

type MyListing = {
  id: string;
  name: string;
  status: 'pending' | 'approved' | 'rejected' | 'deactivated';
  live: 'open' | 'closed' | 'busy';
  rejection_reason: string | null;
  last_owner_update_at: string | null;
};
type Category = { id: string; slug: string; i18n: { en: string } };
type City = { id: string; name: string };

export default function OwnerPage() {
  const session = useSession();
  const [listings, setListings] = useState<MyListing[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    try {
      const [mine, k, c] = await Promise.all([
        apiGet<{ data: MyListing[] }>('/me/businesses'),
        apiGet<{ data: Category[] }>('/categories'),
        apiGet<{ data: City[] }>('/cities'),
      ]);
      setListings(mine.data);
      setCats(k.data);
      setCities(c.data);
    } catch (e) {
      setError(String((e as Error).message));
    }
  }, []);

  useEffect(() => {
    if (session.userId) void load();
  }, [session.userId, load]);

  if (session.loading) return <p className="muted">Loading…</p>;
  if (!session.userId)
    return (
      <div className="stack">
        <h1 className="h1">My Business</h1>
        <p>
          Please <a href="/signin" style={{ color: 'var(--brand)' }}>sign in</a> to manage listings.
        </p>
      </div>
    );

  async function becomeOwner() {
    setError('');
    try {
      // become_owner is a Postgres RPC; call it via the browser client.
      const supabase = createSupabaseBrowser();
      const { error: e } = await supabase.rpc('become_owner');
      if (e) throw e;
      setNotice('You can now create listings.');
    } catch (e) {
      setError(String((e as Error).message));
    }
  }

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h1 className="h1">My Business</h1>
        <span className="muted" style={{ fontSize: 13 }}>{session.email}</span>
      </div>

      {error && <p style={{ color: 'var(--brand)' }}>{error}</p>}
      {notice && <p style={{ color: 'var(--open)' }}>{notice}</p>}

      <div className="panel">
        <p className="muted" style={{ marginTop: 0 }}>
          New here? Register as a business owner to create listings.
        </p>
        <button className="btn" onClick={becomeOwner}>
          Become an owner
        </button>
      </div>

      <CreateListing cats={cats} cities={cities} onCreated={load} onError={setError} />

      <h2 className="h2">Your listings</h2>
      {listings.length === 0 && <p className="muted">No listings yet.</p>}
      <div className="stack">
        {listings.map((b) => (
          <ListingRow key={b.id} b={b} onChange={load} onError={setError} />
        ))}
      </div>

      <FeedbackInbox />
    </div>
  );
}

type OwnerReview = {
  id: string;
  rating: number;
  body: string | null;
  createdAt: string;
  businessName: string;
};

function FeedbackInbox() {
  const [items, setItems] = useState<OwnerReview[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    apiGet<{ data: OwnerReview[] }>('/me/reviews')
      .then((r) => setItems(r.data))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded) return null;

  return (
    <div>
      <h2 className="h2">Reviews received</h2>
      {items.length === 0 ? (
        <p className="muted">No customer reviews yet.</p>
      ) : (
        <div className="stack">
          {items.map((r) => (
            <div key={r.id} className="panel">
              <div className="row between">
                <strong>{r.businessName}</strong>
                <span style={{ color: 'var(--warm)' }}>
                  {'★'.repeat(r.rating)}
                  {'☆'.repeat(5 - r.rating)}
                </span>
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

function CreateListing({
  cats,
  cities,
  onCreated,
  onError,
}: {
  cats: Category[];
  cities: City[];
  onCreated: () => void;
  onError: (s: string) => void;
}) {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [cityId, setCityId] = useState('');
  const [priceTier, setPriceTier] = useState('2');
  const [address, setAddress] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!cityId && cities[0]) setCityId(cities[0].id);
    if (!categoryId && cats[0]) setCategoryId(cats[0].id);
  }, [cities, cats, cityId, categoryId]);

  async function submit() {
    setBusy(true);
    onError('');
    try {
      await apiSend('POST', '/businesses', {
        name,
        categoryId,
        cityId,
        priceTier: Number(priceTier),
        address,
        lat: 6.9344,
        lng: 79.8428,
        isVegFriendly: false,
        descriptionLang: 'en',
      });
      setName('');
      setAddress('');
      onCreated();
    } catch (e) {
      onError(String((e as Error).message));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel stack">
      <strong>Create a listing</strong>
      <input className="input" placeholder="Business name" value={name} onChange={(e) => setName(e.target.value)} />
      <div className="row">
        <select className="select" style={{ maxWidth: 180 }} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          {cats.map((c) => (
            <option key={c.id} value={c.id}>{c.i18n.en}</option>
          ))}
        </select>
        <select className="select" style={{ maxWidth: 160 }} value={cityId} onChange={(e) => setCityId(e.target.value)}>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select className="select" style={{ maxWidth: 120 }} value={priceTier} onChange={(e) => setPriceTier(e.target.value)}>
          <option value="1">$</option>
          <option value="2">$$</option>
          <option value="3">$$$</option>
          <option value="4">$$$$</option>
        </select>
      </div>
      <input className="input" placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
      <button className="btn btn-primary" onClick={submit} disabled={busy || !name || !categoryId}>
        {busy ? 'Creating…' : 'Create (goes to review)'}
      </button>
    </div>
  );
}

function ListingRow({
  b,
  onChange,
  onError,
}: {
  b: MyListing;
  onChange: () => void;
  onError: (s: string) => void;
}) {
  const [busy, setBusy] = useState(false);

  async function setLive(live: string) {
    setBusy(true);
    onError('');
    try {
      await apiSend('PUT', `/businesses/${b.id}/live-status`, { live });
      onChange();
    } catch (e) {
      onError(String((e as Error).message));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <strong>{b.name}</strong>
        <span className={`badge badge-${b.status}`}>{b.status}</span>
      </div>
      {b.status === 'rejected' && b.rejection_reason && (
        <p style={{ color: 'var(--brand)', fontSize: 13 }}>Reason: {b.rejection_reason}</p>
      )}
      <div className="row" style={{ marginTop: 8, justifyContent: 'space-between' }}>
        <div className="row">
          <span className="muted" style={{ fontSize: 13 }}>Live:</span>
          {(['open', 'busy', 'closed'] as const).map((s) => (
            <button
              key={s}
              className={`btn btn-sm ${b.live === s ? 'btn-primary' : ''}`}
              onClick={() => setLive(s)}
              disabled={busy}
            >
              {liveLabel[s]}
            </button>
          ))}
        </div>
        <span className="badge">Updated {freshness(b.last_owner_update_at)}</span>
      </div>
    </div>
  );
}
