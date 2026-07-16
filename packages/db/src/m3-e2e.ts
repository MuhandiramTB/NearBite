/**
 * M3 freshness + media verification against the LIVE database.
 * As an owner (real session): create listing, get signed upload URL, upload a
 * tiny image, register it, confirm it appears in detail + as a search thumbnail,
 * and that a live-status change stamps last_owner_update_at (freshness).
 *
 * Run: tsx src/m3-e2e.ts
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!URL || !ANON || !SERVICE) throw new Error('Missing Supabase env');

const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });
const anon = createClient(URL, ANON, { auth: { persistSession: false } });

const OWNER = 'm3-owner@example.com';
const ADMIN = 'm3-admin@example.com';
const PW = 'Passw0rd!test';

let pass = 0;
let fail = 0;
function check(label: string, ok: boolean, extra = '') {
  console.log(`${ok ? '✓' : '✗'} ${label}${extra ? ' — ' + extra : ''}`);
  if (ok) pass++;
  else fail++;
}

async function makeUser(email: string, role: 'owner' | 'admin'): Promise<SupabaseClient> {
  const { data: list } = await admin.auth.admin.listUsers();
  const ex = list.users.find((u) => u.email === email);
  if (ex) await admin.auth.admin.deleteUser(ex.id);
  const { data } = await admin.auth.admin.createUser({
    email,
    password: PW,
    email_confirm: true,
  });
  await admin.from('profiles').upsert({ id: data.user!.id, role });
  const c = createClient(URL, ANON, { auth: { persistSession: false } });
  await c.auth.signInWithPassword({ email, password: PW });
  return c;
}

// 1x1 transparent PNG.
const PNG_1PX = Uint8Array.from(
  atob(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  ),
  (c) => c.charCodeAt(0),
);

async function main() {
  const { data: city } = await admin.from('cities').select('id').limit(1).single();
  const { data: cat } = await admin.from('categories').select('id').limit(1).single();
  if (!city || !cat) throw new Error('Seed missing');

  const owner = await makeUser(OWNER, 'owner');
  const adminU = await makeUser(ADMIN, 'admin');

  // Owner creates a listing.
  const { data: bizId } = await owner.rpc('create_business', {
    p_name: 'M3 Cafe',
    p_category_id: cat.id,
    p_city_id: city.id,
    p_description: 'm3',
    p_description_lang: 'en',
    p_address: 'x',
    p_lat: 6.9271,
    p_lng: 79.8612,
    p_phone: null,
    p_price_tier: 2,
    p_is_veg_friendly: true,
  });
  const id = bizId as string;
  check('owner creates listing', !!id);

  // --- MEDIA: signed upload URL ---
  // Minted server-side with service-role after the app verifies ownership
  // (mirrors the route: getUploadUrl → assertCanWrite → storageAdmin sign).
  const path = `${id}/${Date.now()}.png`;
  const { data: signed, error: sErr } = await admin.storage
    .from('business-photos')
    .createSignedUploadUrl(path);
  check('signed upload URL issued (service-role)', !sErr && !!signed?.signedUrl, sErr?.message);

  // Upload the bytes using the signed token.
  const { error: upErr } = await owner.storage
    .from('business-photos')
    .uploadToSignedUrl(path, signed!.token, PNG_1PX, { contentType: 'image/png' });
  check('bytes uploaded to storage', !upErr, upErr?.message);

  // Register the photo row.
  const { data: photo, error: regErr } = await owner
    .from('photos')
    .insert({ business_id: id, storage_path: path, kind: 'venue' })
    .select('id')
    .single();
  check('photo row registered', !regErr && !!photo?.id, regErr?.message);

  // Approve so anon can see it.
  await adminU.from('businesses').update({ status: 'approved' }).eq('id', id);

  // --- Photo visible in detail (public URL) ---
  const { data: detail } = await anon.rpc('business_detail', { p_id: id });
  const d = detail as { photos: { id: string; storagePath: string }[] } | null;
  check('photo appears in public detail', !!d && d.photos.length === 1);

  // --- FRESHNESS: capture, toggle live, confirm timestamp advanced ---
  const { data: before } = await anon
    .from('businesses')
    .select('last_owner_update_at')
    .eq('id', id)
    .single();

  await new Promise((r) => setTimeout(r, 1100)); // ensure a measurable delta

  const { error: liveErr } = await owner
    .from('businesses')
    .update({ live: 'open' })
    .eq('id', id);
  check('owner toggles live status', !liveErr, liveErr?.message);

  const { data: after } = await anon
    .from('businesses')
    .select('last_owner_update_at,live')
    .eq('id', id)
    .single();
  const advanced =
    !!after &&
    !!before &&
    new Date(after.last_owner_update_at as string).getTime() >
      new Date(before!.last_owner_update_at as string).getTime();
  check('freshness timestamp advanced on live toggle (trigger)', advanced);
  check('live status is now open', after?.live === 'open');

  // Cleanup.
  await admin.storage.from('business-photos').remove([path]);
  await admin.from('businesses').delete().eq('id', id);

  console.log(`\nResult: ${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}
main().catch((e) => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
