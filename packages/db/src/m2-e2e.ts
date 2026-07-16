/**
 * M2 discovery verification against the LIVE database.
 * Seeds 2 approved listings at known coords, then as ANONYMOUS verifies:
 * search finds them, distance is sane, radius/veg/price filters work,
 * detail returns full JSON, and a far-away listing is excluded.
 *
 * Run: tsx src/m2-e2e.ts
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!URL || !ANON || !SERVICE) throw new Error('Missing Supabase env');

const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });
const anon = createClient(URL, ANON, { auth: { persistSession: false } });

// An admin *session* (real JWT) is needed to approve — the status-guard trigger
// checks is_admin()/auth.uid(), which are null on the service-role connection.
const ADMIN_EMAIL = 'm2-admin@example.com';
const PASSWORD = 'Passw0rd!test';
let adminSession: SupabaseClient;

async function ensureAdminSession() {
  const { data: list } = await admin.auth.admin.listUsers();
  const existing = list.users.find((u) => u.email === ADMIN_EMAIL);
  if (existing) await admin.auth.admin.deleteUser(existing.id);
  const { data } = await admin.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: PASSWORD,
    email_confirm: true,
  });
  await admin.from('profiles').upsert({ id: data.user!.id, role: 'admin', full_name: 'admin' });
  adminSession = createClient(URL, ANON, { auth: { persistSession: false } });
  await adminSession.auth.signInWithPassword({ email: ADMIN_EMAIL, password: PASSWORD });
}

let pass = 0;
let fail = 0;
function check(label: string, ok: boolean, extra = '') {
  console.log(`${ok ? '✓' : '✗'} ${label}${extra ? ' — ' + extra : ''}`);
  if (ok) pass++;
  else fail++;
}

// Colombo Fort ~ (6.9344, 79.8428). Nearby veg cafe and a non-veg spot ~1km away.
const NEAR_LAT = 6.9344;
const NEAR_LNG = 79.8428;

async function seedListing(
  name: string,
  lat: number,
  lng: number,
  vegFriendly: boolean,
  priceTier: number,
  cityId: string,
  categoryId: string,
) {
  const { data: id } = await admin.rpc('create_business', {
    p_name: name,
    p_category_id: categoryId,
    p_city_id: cityId,
    p_description: 'm2 test',
    p_description_lang: 'en',
    p_address: 'test',
    p_lat: lat,
    p_lng: lng,
    p_phone: null,
    p_price_tier: priceTier,
    p_is_veg_friendly: vegFriendly,
  });
  // Approve via the admin session so the status-guard trigger permits it.
  await adminSession.from('businesses').update({ status: 'approved' }).eq('id', id as string);
  return id as string;
}

async function main() {
  const { data: city } = await admin.from('cities').select('id').limit(1).single();
  const { data: cat } = await admin.from('categories').select('id').limit(1).single();
  if (!city || !cat) throw new Error('Seed data missing');

  console.log('Provisioning admin + seeding listings...');
  await ensureAdminSession();
  const nearVeg = await seedListing('M2 Near Veg', NEAR_LAT, NEAR_LNG, true, 2, city.id, cat.id);
  const nearExpensive = await seedListing(
    'M2 Near Pricey',
    NEAR_LAT + 0.005,
    NEAR_LNG,
    false,
    4,
    city.id,
    cat.id,
  );
  // ~100km north (outside a 5km radius).
  const far = await seedListing('M2 Far', NEAR_LAT + 1.0, NEAR_LNG, true, 1, city.id, cat.id);

  const ids = new Set([nearVeg, nearExpensive, far]);

  // 1. Anonymous search within 5km finds the two near, not the far one.
  const { data: r1, error: e1 } = await anon.rpc('search_businesses', {
    p_lat: NEAR_LAT,
    p_lng: NEAR_LNG,
    p_radius_m: 5000,
    p_city_id: city.id,
    p_sort: 'distance',
    p_limit: 50,
    p_offset: 0,
  });
  const found = (r1 ?? []).filter((b: { id: string }) => ids.has(b.id));
  check('anon search returns results', !e1 && found.length >= 2, e1?.message);
  check(
    'far listing excluded by 5km radius',
    !found.some((b: { id: string }) => b.id === far),
  );

  // 2. Distance is computed and near-veg is closest (distance ascending).
  const nearRow = found.find((b: { id: string }) => b.id === nearVeg) as
    | { distance_m: number }
    | undefined;
  check(
    'distance computed and small for nearest',
    !!nearRow && nearRow.distance_m < 100,
    `distance_m=${nearRow?.distance_m?.toFixed(1)}`,
  );

  // 3. veg-only filter excludes the non-veg pricey one.
  const { data: r2 } = await anon.rpc('search_businesses', {
    p_lat: NEAR_LAT,
    p_lng: NEAR_LNG,
    p_radius_m: 5000,
    p_city_id: city.id,
    p_veg_only: true,
    p_limit: 50,
    p_offset: 0,
  });
  const vegIds = (r2 ?? []).map((b: { id: string }) => b.id);
  check('veg-only excludes non-veg', !vegIds.includes(nearExpensive) && vegIds.includes(nearVeg));

  // 4. price filter (<=2) excludes tier-4.
  const { data: r3 } = await anon.rpc('search_businesses', {
    p_lat: NEAR_LAT,
    p_lng: NEAR_LNG,
    p_radius_m: 5000,
    p_city_id: city.id,
    p_max_price_tier: 2,
    p_limit: 50,
    p_offset: 0,
  });
  const priceIds = (r3 ?? []).map((b: { id: string }) => b.id);
  check('price<=2 excludes tier-4', !priceIds.includes(nearExpensive));

  // 5. detail returns full JSON for an approved listing.
  const { data: detail, error: e5 } = await anon.rpc('business_detail', { p_id: nearVeg });
  const d = detail as Record<string, unknown> | null;
  check(
    'detail returns full object',
    !e5 && !!d && d.name === 'M2 Near Veg' && Array.isArray(d.menu),
    e5?.message,
  );
  check('detail has lat/lng round-tripped', !!d && Math.abs((d.lat as number) - NEAR_LAT) < 0.001);

  // 6. detail for a non-existent id → null (not an error).
  const { data: none } = await anon.rpc('business_detail', {
    p_id: '00000000-0000-0000-0000-000000000000',
  });
  check('detail for missing id is null', none === null);

  // Cleanup.
  await admin.from('businesses').delete().in('id', [...ids]);

  console.log(`\nResult: ${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}
main().catch((e) => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
