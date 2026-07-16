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
      <h1 className="h1">Approval Queue</h1>
      <p className="muted">Pending business submissions. Approve genuine listings; reject spam with a reason.</p>

      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}

      {queue.length === 0 && <p className="muted">Queue is empty. 🎉</p>}
      <div className="stack">
        {queue.map((s) => (
          <div key={s.id} className="card row" style={{ justifyContent: 'space-between' }}>
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
    </div>
  );
}
