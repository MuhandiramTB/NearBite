/**
 * M5 social full-workflow verification against the LIVE database:
 *   create → approve → consumer reviews (avg updates, 1-per-user enforced) →
 *   owner reads feedback → favorite add/list/remove → freshness NOT bumped by review.
 *
 * Run: tsx src/m5-e2e.ts
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });
const PW = 'Passw0rd!x';

let pass = 0,
  fail = 0;
const check = (l: string, ok: boolean, x = '') => {
  console.log(`${ok ? '✓' : '✗'} ${l}${x ? ' — ' + x : ''}`);
  if (ok) pass++;
  else fail++;
};

async function user(email: string, role: 'admin' | 'owner' | 'consumer', name: string) {
  const { data: list } = await admin.auth.admin.listUsers();
  const ex = list.users.find((u) => u.email === email);
  if (ex) await admin.auth.admin.deleteUser(ex.id);
  const { data } = await admin.auth.admin.createUser({
    email,
    password: PW,
    email_confirm: true,
    user_metadata: { full_name: name },
  });
  await admin.from('profiles').upsert({ id: data.user!.id, role, full_name: name });
  const c: SupabaseClient = createClient(URL, ANON, { auth: { persistSession: false } });
  await c.auth.signInWithPassword({ email, password: PW });
  return { client: c, id: data.user!.id, name };
}

async function main() {
  const { data: city } = await admin.from('cities').select('id').limit(1).single();
  const { data: cat } = await admin.from('categories').select('id').limit(1).single();

  const owner = await user('m5-owner@example.com', 'owner', 'M5 Owner');
  const adminU = await user('m5-admin@example.com', 'admin', 'M5 Admin');
  const c1 = await user('m5-c1@example.com', 'consumer', 'Reviewer One');
  const c2 = await user('m5-c2@example.com', 'consumer', 'Reviewer Two');

  const { data: bizId } = await owner.client.rpc('create_business', {
    p_name: 'M5 Test Eatery',
    p_category_id: cat!.id,
    p_city_id: city!.id,
    p_description: 'm5',
    p_description_lang: 'en',
    p_address: 'x',
    p_lat: 6.9344,
    p_lng: 79.8428,
    p_phone: null,
    p_price_tier: 2,
    p_is_veg_friendly: true,
  });
  const id = bizId as string;
  await adminU.client.from('businesses').update({ status: 'approved' }).eq('id', id);
  const { data: beforeFresh } = await admin
    .from('businesses')
    .select('last_owner_update_at')
    .eq('id', id)
    .single();

  // c1 reviews 5, c2 reviews 3 → avg should be 4.0, count 2
  const r1 = await c1.client
    .from('reviews')
    .insert({ business_id: id, user_id: c1.id, rating: 5, body: 'Amazing!', author_name: c1.name });
  check('consumer 1 posts review', !r1.error, r1.error?.message);
  const r2 = await c2.client
    .from('reviews')
    .insert({ business_id: id, user_id: c2.id, rating: 3, body: 'Okay.', author_name: c2.name });
  check('consumer 2 posts review', !r2.error, r2.error?.message);

  // one-per-user: c1 tries again → must fail (unique)
  const dup = await c1.client
    .from('reviews')
    .insert({ business_id: id, user_id: c1.id, rating: 1, author_name: c1.name });
  check('duplicate review blocked (1/user)', !!dup.error, dup.error?.code);

  // avg updated by trigger
  const { data: afterBiz } = await admin
    .from('businesses')
    .select('avg_rating,review_count,last_owner_update_at')
    .eq('id', id)
    .single();
  check('avg_rating recomputed', Number(afterBiz?.avg_rating) === 4 && afterBiz?.review_count === 2, `avg=${afterBiz?.avg_rating} n=${afterBiz?.review_count}`);
  check(
    'freshness NOT bumped by review',
    afterBiz?.last_owner_update_at === beforeFresh?.last_owner_update_at,
  );

  // public can read reviews with author names
  const anon = createClient(URL, ANON, { auth: { persistSession: false } });
  const { data: pub } = await anon.from('reviews').select('rating,author_name').eq('business_id', id);
  check('anon reads reviews w/ author names', (pub?.length ?? 0) === 2 && pub!.every((r) => !!r.author_name));

  // owner reads feedback across their listings
  const { data: fb } = await owner.client
    .from('reviews')
    .select('rating,body,businesses!inner(owner_id)')
    .eq('businesses.owner_id', owner.id);
  check('owner reads feedback for own listings', (fb?.length ?? 0) === 2);

  // favorites: add, list, remove
  await c1.client.from('favorites').upsert({ user_id: c1.id, business_id: id });
  const { data: favs } = await c1.client.from('favorites').select('business_id').eq('user_id', c1.id);
  check('favorite saved + listed', (favs ?? []).some((f) => f.business_id === id));
  await c1.client.from('favorites').delete().eq('user_id', c1.id).eq('business_id', id);
  const { data: favs2 } = await c1.client.from('favorites').select('business_id').eq('user_id', c1.id);
  check('favorite removed', !(favs2 ?? []).some((f) => f.business_id === id));

  // c2 cannot see c1's favorites (privacy)
  const { data: crossFav } = await c2.client.from('favorites').select('business_id').eq('user_id', c1.id);
  check('favorites are private to owner', (crossFav ?? []).length === 0);

  await admin.from('businesses').delete().eq('id', id);
  console.log(`\nResult: ${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}
main().catch((e) => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
