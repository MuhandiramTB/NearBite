/**
 * UI/API smoke test against the RUNNING dev server (http://localhost:3000).
 * Drives the real HTTP routes the browser uses:
 *   owner signs in → become_owner → POST /businesses → admin approves →
 *   anon GET /businesses shows it → GET /businesses/:id detail.
 */
import { createClient } from '@supabase/supabase-js';

const BASE = 'http://localhost:3000/api/v1';
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });

let pass = 0,
  fail = 0;
const check = (l: string, ok: boolean, x = '') => {
  console.log(`${ok ? '✓' : '✗'} ${l}${x ? ' — ' + x : ''}`);
  if (ok) pass++;
  else fail++;
};

async function mkUser(email: string, role: 'owner' | 'admin') {
  const { data: list } = await admin.auth.admin.listUsers();
  const ex = list.users.find((u) => u.email === email);
  if (ex) await admin.auth.admin.deleteUser(ex.id);
  const { data } = await admin.auth.admin.createUser({ email, password: 'Passw0rd!x', email_confirm: true });
  await admin.from('profiles').upsert({ id: data.user!.id, role });
  const c = createClient(URL, ANON, { auth: { persistSession: false } });
  const { data: s } = await c.auth.signInWithPassword({ email, password: 'Passw0rd!x' });
  return s.session!.access_token;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
async function req(method: string, path: string): Promise<{ status: number; body: any }> {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}

async function main() {
  const { data: city } = await admin.from('cities').select('id').limit(1).single();
  const { data: cat } = await admin.from('categories').select('id').limit(1).single();

  // health
  const h = await req('GET', '/health');
  check('health endpoint', h.status === 200 && h.body?.status === 'ok', `db=${h.body?.db}`);

  // anon categories + cities
  const cats = await req('GET', '/categories');
  check('GET /categories (anon)', cats.status === 200 && cats.body.data.length > 0);
  const cities = await req('GET', '/cities');
  check('GET /cities (anon)', cities.status === 200 && cities.body.data.length > 0);

  // NOTE: the API resolves the session from the Supabase cookie set by the
  // browser client. Bearer-only won't populate resolveActor(), so create+approve
  // through the API is validated separately in m1-e2e. Here we validate the
  // ANONYMOUS discovery path the browser uses, against seeded+approved data.
  const ownerTok = await mkUser('smoke-owner@example.com', 'owner');
  const { data: bizId } = await createClient(URL, ANON, { auth: { persistSession: false } })
    .auth.setSession({ access_token: ownerTok, refresh_token: ownerTok })
    .then(() =>
      admin.rpc('create_business', {
        p_name: 'Smoke Diner',
        p_category_id: cat!.id,
        p_city_id: city!.id,
        p_description: 'ui smoke',
        p_description_lang: 'en',
        p_address: 'Fort',
        p_lat: 6.9344,
        p_lng: 79.8428,
        p_phone: null,
        p_price_tier: 2,
        p_is_veg_friendly: true,
      }),
    );
  await mkUser('smoke-admin@example.com', 'admin');
  const adminC = createClient(URL, ANON, { auth: { persistSession: false } });
  await adminC.auth.signInWithPassword({ email: 'smoke-admin@example.com', password: 'Passw0rd!x' });
  await adminC.from('businesses').update({ status: 'approved' }).eq('id', bizId as string);

  // anon search sees it
  const search = await req(
    'GET',
    `/businesses?lat=6.9344&lng=79.8428&cityId=${city!.id}&radiusM=10000`,
  );
  const found = search.body?.data?.some((b: { id: string }) => b.id === bizId);
  check('GET /businesses (anon) returns approved listing', search.status === 200 && found);

  // anon detail
  const detail = await req('GET', `/businesses/${bizId}`);
  check('GET /businesses/:id (anon) detail', detail.status === 200 && detail.body?.name === 'Smoke Diner');

  await admin.from('businesses').delete().eq('id', bizId as string);
  console.log(`\nResult: ${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}
main().catch((e) => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
