'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { apiGet, apiSend } from '@/lib/ui/api-client';
import { CONVENIENCE, CURRENCIES, FACILITIES, VISIT_PURPOSES } from '@nearbite/contracts';
import { attrLabel, freshness, liveLabel } from '@/lib/ui/format';
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

      <OwnerAnalytics />

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

function OwnerAnalytics() {
  const [a, setA] = useState<{
    listings: number;
    approved: number;
    pending: number;
    totalReviews: number;
    avgRating: number;
    favorites: number;
  } | null>(null);
  useEffect(() => {
    apiGet<typeof a>('/me/analytics').then(setA).catch(() => {});
  }, []);
  if (!a || a.listings === 0) return null;
  const tiles: [string, number | string][] = [
    ['Listings', a.listings],
    ['Approved', a.approved],
    ['Pending', a.pending],
    ['Reviews', a.totalReviews],
    ['Avg rating', a.avgRating ? `★${a.avgRating}` : '—'],
    ['Favorites', a.favorites],
  ];
  return (
    <div>
      <h2 className="h2">Your dashboard</h2>
      <div className="results" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', marginTop: 0 }}>
        {tiles.map(([label, val]) => (
          <div key={label} className="panel" style={{ textAlign: 'center', padding: 16 }}>
            <div style={{ fontSize: 26, fontWeight: 800 }}>{val}</div>
            <div className="muted" style={{ fontSize: 12 }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AttrPicker({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: readonly string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div>
      <p className="eyebrow" style={{ color: 'var(--muted)', marginBottom: 6 }}>{label}</p>
      <div className="row" style={{ gap: 6 }}>
        {options.map((o) => {
          const on = selected.includes(o);
          return (
            <button
              key={o}
              type="button"
              className="check"
              style={on ? { background: 'var(--brand)', color: 'var(--brand-ink)', borderColor: 'transparent' } : undefined}
              onClick={() => onChange(on ? selected.filter((x) => x !== o) : [...selected, o])}
            >
              {attrLabel(o)}
            </button>
          );
        })}
      </div>
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

  const load = useCallback(() => {
    apiGet<{ data: OwnerReview[] }>('/me/reviews')
      .then((r) => setItems(r.data))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  if (!loaded) return null;

  return (
    <div>
      <h2 className="h2">Reviews received</h2>
      {items.length === 0 ? (
        <p className="muted">No customer reviews yet.</p>
      ) : (
        <div className="stack">
          {items.map((r) => (
            <FeedbackItem key={r.id} r={r} onReplied={load} />
          ))}
        </div>
      )}
    </div>
  );
}

function FeedbackItem({ r, onReplied }: { r: OwnerReview; onReplied: () => void }) {
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function send() {
    setBusy(true);
    try {
      await apiSend('POST', `/reviews/${r.id}/respond`, { response: reply });
      setDone(true);
      onReplied();
    } catch {
      /* surfaced elsewhere */
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel">
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
      {done ? (
        <p className="notice" style={{ fontSize: 13, marginTop: 8 }}>Reply posted ✓</p>
      ) : (
        <div className="row" style={{ gap: 6, marginTop: 8 }}>
          <input
            className="input"
            style={{ padding: '6px 10px' }}
            placeholder="Reply publicly…"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
          />
          <button className="btn btn-sm" onClick={send} disabled={busy || reply.length < 1}>
            Reply
          </button>
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
  const [facilities, setFacilities] = useState<string[]>([]);
  const [purposes, setPurposes] = useState<string[]>([]);
  const [convenience, setConvenience] = useState<string[]>([]);
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
        facilities,
        visitPurposes: purposes,
        convenience,
      });
      setName('');
      setAddress('');
      setFacilities([]);
      setPurposes([]);
      setConvenience([]);
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
      <AttrPicker label="Good for" options={VISIT_PURPOSES} selected={purposes} onChange={setPurposes} />
      <AttrPicker label="Facilities" options={FACILITIES} selected={facilities} onChange={setFacilities} />
      <AttrPicker label="Convenience" options={CONVENIENCE} selected={convenience} onChange={setConvenience} />
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

      <div className="row" style={{ marginTop: 12, gap: 20, alignItems: 'flex-start' }}>
        <OfferManager businessId={b.id} onError={onError} />
        <PhotoGallery businessId={b.id} onError={onError} onDone={onChange} />
        <BusinessSettings businessId={b.id} onError={onError} />
      </div>
    </div>
  );
}

function OfferManager({ businessId, onError }: { businessId: string; onError: (s: string) => void }) {
  const [offers, setOffers] = useState<{ id: string; title: string; is_active: boolean; ends_at: string }[]>([]);
  const [title, setTitle] = useState('');
  const [open, setOpen] = useState(false);

  const load = useCallback(() => {
    apiGet<{ data: typeof offers }>(`/businesses/${businessId}/offers`)
      .then((r) => setOffers(r.data))
      .catch(() => {});
  }, [businessId]);
  useEffect(() => {
    if (open) load();
  }, [open, load]);

  async function add() {
    try {
      const ends = new Date(Date.now() + 7 * 864e5).toISOString(); // 7 days
      await apiSend('POST', `/businesses/${businessId}/offers`, { title, endsAt: ends });
      setTitle('');
      load();
    } catch (e) {
      onError(String((e as Error).message));
    }
  }
  async function expire(id: string) {
    try {
      await apiSend('DELETE', `/offers/${id}`);
      load();
    } catch (e) {
      onError(String((e as Error).message));
    }
  }

  return (
    <div style={{ flex: 1, minWidth: 220 }}>
      <button className="btn btn-sm" onClick={() => setOpen((v) => !v)}>
        {open ? 'Hide offers' : 'Offers'}
      </button>
      {open && (
        <div className="stack" style={{ marginTop: 8, gap: 8 }}>
          <div className="row" style={{ gap: 6 }}>
            <input
              className="input"
              style={{ padding: '6px 10px' }}
              placeholder="e.g. 20% off lunch"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <button className="btn btn-sm btn-primary" onClick={add} disabled={title.length < 2}>
              Add
            </button>
          </div>
          {offers.filter((o) => o.is_active).map((o) => (
            <div key={o.id} className="row between" style={{ fontSize: 13 }}>
              <span>🎉 {o.title}</span>
              <button className="btn btn-sm" onClick={() => expire(o.id)}>End</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type OwnerPhoto = { id: string; url: string | null; kind: string; sortOrder: number };
const MAX_MB = 5;
const OK_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function PhotoGallery({
  businessId,
  onError,
  onDone,
}: {
  businessId: string;
  onError: (s: string) => void;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [photos, setPhotos] = useState<OwnerPhoto[]>([]);
  const [progress, setProgress] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const dragIndex = useRef<number | null>(null);

  const load = useCallback(() => {
    apiGet<{ data: OwnerPhoto[] }>(`/businesses/${businessId}/photos`)
      .then((r) => setPhotos(r.data))
      .catch(() => {});
  }, [businessId]);
  useEffect(() => {
    if (open) load();
  }, [open, load]);

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files);
    for (const file of list) {
      if (!OK_TYPES.includes(file.type)) {
        onError(`"${file.name}" — only JPG, PNG, or WebP allowed.`);
        continue;
      }
      if (file.size > MAX_MB * 1024 * 1024) {
        onError(`"${file.name}" — max ${MAX_MB}MB.`);
        continue;
      }
      setProgress(10);
      try {
        const { path, token } = await apiSend<{ path: string; token: string }>(
          'POST',
          `/businesses/${businessId}/photos/upload-url`,
          { filename: file.name },
        );
        setProgress(45);
        const supabase = createSupabaseBrowser();
        const up = await supabase.storage.from('business-photos').uploadToSignedUrl(path, token, file);
        if (up.error) throw up.error;
        setProgress(80);
        await apiSend('POST', `/businesses/${businessId}/photos`, { storagePath: path, kind: 'food' });
        setProgress(100);
      } catch (e) {
        onError(String((e as Error).message));
      }
    }
    setProgress(null);
    load();
    onDone();
  }

  async function remove(id: string) {
    try {
      await apiSend('DELETE', `/photos/${id}`);
      setPhotos((cur) => cur.filter((p) => p.id !== id));
      onDone();
    } catch (e) {
      onError(String((e as Error).message));
    }
  }

  async function persistOrder(next: OwnerPhoto[]) {
    setPhotos(next);
    try {
      await apiSend('PUT', `/businesses/${businessId}/photos/order`, {
        photoIds: next.map((p) => p.id),
      });
    } catch (e) {
      onError(String((e as Error).message));
    }
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= photos.length || from === to) return;
    const next = [...photos];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item!);
    persistOrder(next);
  }

  return (
    <div style={{ flex: 1, minWidth: 240 }}>
      <button className="btn btn-sm" onClick={() => setOpen((v) => !v)}>
        {open ? 'Hide photos' : '📷 Photos'}
      </button>
      {open && (
        <div className="stack" style={{ marginTop: 10, gap: 10 }}>
          {/* drop zone */}
          <label
            className={`dropzone ${dragOver ? 'over' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
            }}
          >
            <input
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => e.target.files && uploadFiles(e.target.files)}
            />
            <span>📤 Drag & drop images here, or click to choose</span>
            <span className="muted" style={{ fontSize: 12 }}>JPG / PNG / WebP · max {MAX_MB}MB</span>
          </label>

          {progress !== null && (
            <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: 'var(--brand)', transition: 'width .2s' }} />
            </div>
          )}

          {photos.length === 0 ? (
            <p className="muted" style={{ fontSize: 13 }}>No photos yet.</p>
          ) : (
            <div className="gallery-grid">
              {photos.map((p, i) => (
                <div
                  key={p.id}
                  className="gallery-thumb"
                  draggable
                  onDragStart={() => (dragIndex.current = i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragIndex.current !== null) move(dragIndex.current, i);
                    dragIndex.current = null;
                  }}
                >
                  {p.url && <img src={p.url} alt="" />}
                  {i === 0 && <span className="cover-tag">Cover</span>}
                  <div className="thumb-actions">
                    <button className="thumb-btn" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move left">‹</button>
                    <button className="thumb-btn" onClick={() => remove(p.id)} aria-label="Remove">🗑</button>
                    <button className="thumb-btn" onClick={() => move(i, i + 1)} disabled={i === photos.length - 1} aria-label="Move right">›</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BusinessSettings({ businessId, onError }: { businessId: string; onError: (s: string) => void }) {
  const [open, setOpen] = useState(false);
  const [currency, setCurrency] = useState('LKR');
  const [facilities, setFacilities] = useState<string[]>([]);
  const [purposes, setPurposes] = useState<string[]>([]);
  const [convenience, setConvenience] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!open) return;
    apiGet<{
      currency: string | null;
      facilities: string[];
      visitPurposes: string[];
      convenience: string[];
    }>(`/businesses/${businessId}`)
      .then((d) => {
        setCurrency(d.currency ?? 'LKR');
        setFacilities(d.facilities ?? []);
        setPurposes(d.visitPurposes ?? []);
        setConvenience(d.convenience ?? []);
      })
      .catch(() => {});
  }, [open, businessId]);

  async function save() {
    setSaved(false);
    try {
      await apiSend('PUT', `/businesses/${businessId}/settings`, {
        currency,
        facilities,
        visitPurposes: purposes,
        convenience,
      });
      setSaved(true);
    } catch (e) {
      onError(String((e as Error).message));
    }
  }

  return (
    <div style={{ flex: 1, minWidth: 240 }}>
      <button className="btn btn-sm" onClick={() => setOpen((v) => !v)}>
        {open ? 'Hide settings' : '⚙ Settings'}
      </button>
      {open && (
        <div className="stack" style={{ marginTop: 10, gap: 12 }}>
          <div>
            <span className="label">Currency</span>
            <select className="select" style={{ maxWidth: 140 }} value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <AttrPicker label="Good for" options={VISIT_PURPOSES} selected={purposes} onChange={setPurposes} />
          <AttrPicker label="Facilities & dining" options={FACILITIES} selected={facilities} onChange={setFacilities} />
          <AttrPicker label="Convenience" options={CONVENIENCE} selected={convenience} onChange={setConvenience} />
          <div className="row">
            <button className="btn btn-sm btn-primary" onClick={save}>Save settings</button>
            {saved && <span className="notice" style={{ fontSize: 13 }}>Saved ✓</span>}
          </div>
        </div>
      )}
    </div>
  );
}
