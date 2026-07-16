'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiGet, apiSend } from '@/lib/ui/api-client';
import { useSession } from '@/lib/ui/use-session';

type Submission = {
  id: string;
  name: string;
  category_id: string | null;
  city_id: string;
  created_at: string;
};

export default function AdminPage() {
  const session = useSession();
  const [queue, setQueue] = useState<Submission[]>([]);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await apiGet<{ data: Submission[] }>('/admin/submissions');
      setQueue(res.data);
    } catch (e) {
      setError(String((e as Error).message));
    }
  }, []);

  useEffect(() => {
    if (session.userId) void load();
  }, [session.userId, load]);

  async function decide(id: string, action: 'approve' | 'reject') {
    let reason: string | undefined;
    if (action === 'reject') {
      reason = window.prompt('Reason for rejection (required):') ?? '';
      if (reason.length < 5) {
        setError('Rejection reason must be at least 5 characters.');
        return;
      }
    }
    setBusyId(id);
    setError('');
    try {
      await apiSend('POST', `/admin/businesses/${id}/decision`, { action, reason });
      await load();
    } catch (e) {
      setError(String((e as Error).message));
    } finally {
      setBusyId('');
    }
  }

  if (session.loading) return <p className="muted">Loading…</p>;
  if (!session.userId)
    return (
      <div className="stack">
        <h1 className="h1">Admin</h1>
        <p>
          Please <a href="/signin" style={{ color: 'var(--brand)' }}>sign in</a> as an admin.
        </p>
      </div>
    );

  return (
    <div className="stack">
      <h1 className="h1">Admin</h1>
      <AdminAnalytics />

      <h2 className="h2">Approval queue</h2>
      <p className="muted">Pending business submissions. Approve genuine listings; reject spam with a reason.</p>

      {error && <p style={{ color: 'var(--brand)' }}>{error}</p>}

      {queue.length === 0 && <p className="muted">Queue is empty. 🎉</p>}
      <div className="stack">
        {queue.map((s) => (
          <div key={s.id} className="panel row" style={{ justifyContent: 'space-between' }}>
            <div>
              <strong>{s.name}</strong>
              <div className="muted" style={{ fontSize: 13 }}>
                submitted {new Date(s.created_at).toLocaleString()}
              </div>
            </div>
            <div className="row">
              <button className="btn btn-primary btn-sm" onClick={() => decide(s.id, 'approve')} disabled={busyId === s.id}>
                Approve
              </button>
              <button className="btn btn-sm" onClick={() => decide(s.id, 'reject')} disabled={busyId === s.id}>
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>

      <ReportsPanel onError={setError} />
      <UsersPanel onError={setError} />
    </div>
  );
}

function AdminAnalytics() {
  const [a, setA] = useState<Record<string, number> | null>(null);
  useEffect(() => {
    apiGet<Record<string, number>>('/admin/analytics')
      .then(setA)
      .catch(() => {});
  }, []);
  if (!a) return null;
  const n = (k: string) => a[k] ?? 0;
  const tiles: [string, number | string][] = [
    ['Users', n('users')],
    ['Owners', n('owners')],
    ['Listings', n('listingsTotal')],
    ['Approved', n('listingsApproved')],
    ['Pending', n('listingsPending')],
    ['Reviews', n('reviews')],
    ['Open reports', n('openReports')],
    ['Avg rating', n('avgRating') ? `★${n('avgRating')}` : '—'],
  ];
  return (
    <div
      className="results"
      style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(110px,1fr))', marginTop: 0, marginBottom: 8 }}
    >
      {tiles.map(([label, val]) => (
        <div key={label} className="panel" style={{ textAlign: 'center', padding: 14 }}>
          <div style={{ fontSize: 24, fontWeight: 800 }}>{val}</div>
          <div className="muted" style={{ fontSize: 12 }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

type Report = {
  id: string;
  targetType: 'review' | 'business';
  targetId: string;
  reason: string | null;
  targetLabel: string;
  createdAt: string;
};

function ReportsPanel({ onError }: { onError: (s: string) => void }) {
  const [reports, setReports] = useState<Report[]>([]);
  const [busyId, setBusyId] = useState('');

  const load = useCallback(() => {
    apiGet<{ data: Report[] }>('/admin/reports')
      .then((r) => setReports(r.data))
      .catch((e) => onError(String((e as Error).message)));
  }, [onError]);
  useEffect(() => {
    load();
  }, [load]);

  async function resolve(id: string, status: 'reviewed' | 'dismissed', action?: 'remove') {
    setBusyId(id);
    try {
      await apiSend('POST', `/admin/reports/${id}/resolve`, { status, action });
      load();
    } catch (e) {
      onError(String((e as Error).message));
    } finally {
      setBusyId('');
    }
  }

  return (
    <div>
      <h2 className="h2">Reported content</h2>
      {reports.length === 0 ? (
        <p className="muted">No open reports. 🎉</p>
      ) : (
        <div className="stack">
          {reports.map((r) => (
            <div key={r.id} className="panel">
              <div className="row between">
                <span className="badge">{r.targetType}</span>
                <span className="muted" style={{ fontSize: 12 }}>
                  {new Date(r.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p style={{ margin: '8px 0 2px' }}>{r.targetLabel}</p>
              {r.reason && <p className="muted" style={{ fontSize: 13 }}>Reason: {r.reason}</p>}
              <div className="row" style={{ marginTop: 8 }}>
                <button className="btn btn-sm" onClick={() => resolve(r.id, 'dismissed')} disabled={busyId === r.id}>
                  Dismiss
                </button>
                <button
                  className="btn btn-sm"
                  style={{ borderColor: 'var(--brand)', color: 'var(--brand)' }}
                  onClick={() => resolve(r.id, 'reviewed', 'remove')}
                  disabled={busyId === r.id}
                >
                  {r.targetType === 'review' ? 'Remove review' : 'Deactivate listing'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type AdminUser = {
  id: string;
  fullName: string | null;
  role: 'consumer' | 'owner' | 'admin';
  listings: number;
  reviews: number;
};

function UsersPanel({ onError }: { onError: (s: string) => void }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [q, setQ] = useState('');
  const [busyId, setBusyId] = useState('');

  const load = useCallback(
    (query: string) => {
      apiGet<{ data: AdminUser[] }>(`/admin/users${query ? `?q=${encodeURIComponent(query)}` : ''}`)
        .then((r) => setUsers(r.data))
        .catch((e) => onError(String((e as Error).message)));
    },
    [onError],
  );
  useEffect(() => {
    load('');
  }, [load]);

  async function setRole(userId: string, role: AdminUser['role']) {
    setBusyId(userId);
    try {
      await apiSend('POST', '/admin/users', { userId, role });
      load(q);
    } catch (e) {
      onError(String((e as Error).message));
    } finally {
      setBusyId('');
    }
  }

  return (
    <div>
      <h2 className="h2">Users</h2>
      <div className="row" style={{ marginBottom: 10 }}>
        <input
          className="input"
          style={{ maxWidth: 260 }}
          placeholder="Search by name…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load(q)}
        />
        <button className="btn btn-sm" onClick={() => load(q)}>Search</button>
      </div>
      <div className="stack">
        {users.map((u) => (
          <div key={u.id} className="panel row between">
            <div>
              <strong>{u.fullName ?? '(no name)'}</strong>
              <div className="muted" style={{ fontSize: 13 }}>
                {u.listings} listings · {u.reviews} reviews
              </div>
            </div>
            <div className="row">
              {(['consumer', 'owner', 'admin'] as const).map((role) => (
                <button
                  key={role}
                  className={`btn btn-sm ${u.role === role ? 'btn-primary' : ''}`}
                  onClick={() => u.role !== role && setRole(u.id, role)}
                  disabled={busyId === u.id}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
