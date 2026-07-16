'use client';

/** Thin browser fetch wrapper for our own /api/v1 endpoints. Throws on error
 *  with the API's error message so components can show it. */
export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`/api/v1${path}`, { credentials: 'include' });
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error?.message ?? 'Request failed');
  return body as T;
}

export async function apiSend<T>(
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  data?: unknown,
): Promise<T> {
  const res = await fetch(`/api/v1${path}`, {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error?.message ?? 'Request failed');
  return body as T;
}
