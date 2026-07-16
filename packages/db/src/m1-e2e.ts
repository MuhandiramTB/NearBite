/**
 * M1 end-to-end verification against the LIVE database.
 * Proves: owner creates listing (pending) → admin approves (approved),
 * audit row written, and a non-admin CANNOT change status (trigger blocks).
 *
 * Uses the service-role client to provision two test users, then acts as each
 * via the anon client with their own JWT so RLS + triggers are exercised.
 *
 * Run: tsx src/m1-e2e.ts   (needs NEXT_PUBLIC_SUPABASE_URL, ANON, SERVICE_ROLE)
 */
import { createClient } from '@supabase/supabase-js';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!URL || !ANON || !SERVICE) throw new Error('Missing Supabase env');

const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });

const OWNER_EMAIL = 'm1-owner@example.com';
const ADMIN_EMAIL = 'm1-admin@example.com';
const PASSWORD = 'Passw0rd!test';

let pass = 0;
let fail = 0;
function check(label: string, ok: boolean, extra = '') {
  console.log(`${ok ? '✓' : '✗'} ${label}${extra ? ' — ' + extra : ''}`);
  if (ok) pass++;
  else fail++;
}

async function ensureUser(email: string, role: 'owner' | 'admin') {
  // Clean any prior run.
  const { data: list } = await admin.auth.admin.listUsers();
  const existing = list.users.find((u) => u.email === email);
  if (existing) await admin.auth.admin.deleteUser(existing.id);

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`createUser ${email}: ${error?.message}`);
  const uid = data.user.id;
  // profiles row is created by our app normally; here upsert with the role.
  await admin.from('profiles').upsert({ id: uid, role, full_name: role });
  return uid;
}

async function sessionClient(email: string) {
  const c = createClient(URL, ANON, { auth: { persistSession: false } });
  const { error } = await c.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw new Error(`signIn ${email}: ${error.message}`);
  return c;
}

async function main() {
  console.log('Provisioning test users...');
  await ensureUser(OWNER_EMAIL, 'owner');
  await ensureUser(ADMIN_EMAIL, 'admin');

  // Need a city + category id.
  const { data: city } = await admin.from('cities').select('id').limit(1).single();
  const { data: cat } = await admin.from('categories').select('id').limit(1).single();
  if (!city || !cat) throw new Error('Seed data missing (city/category)');

  const owner = await sessionClient(OWNER_EMAIL);
  const adminUser = await sessionClient(ADMIN_EMAIL);

  // 1. Owner creates a listing via RPC → should be pending.
  const { data: newId, error: createErr } = await owner.rpc('create_business', {
    p_name: 'Test Cafe',
    p_category_id: cat.id,
    p_city_id: city.id,
    p_description: 'e2e',
    p_description_lang: 'en',
    p_address: 'Main St',
    p_lat: 6.9271,
    p_lng: 79.8612,
    p_phone: null,
    p_price_tier: 2,
    p_is_veg_friendly: true,
  });
  check('owner creates listing', !createErr && !!newId, createErr?.message);
  const bizId = newId as string;

  // 2. Owner sees it as pending.
  const { data: mine } = await owner
    .from('businesses')
    .select('status')
    .eq('id', bizId)
    .single();
  check('listing is pending', mine?.status === 'pending', `status=${mine?.status}`);

  // 3. Anonymous CANNOT see the pending listing (RLS).
  const anon = createClient(URL, ANON, { auth: { persistSession: false } });
  const { data: anonView } = await anon.from('businesses').select('id').eq('id', bizId);
  check('anon cannot see pending listing (RLS)', (anonView?.length ?? 0) === 0);

  // 4. Owner CANNOT self-approve (status-guard trigger blocks non-admin).
  const { error: selfApprove } = await owner
    .from('businesses')
    .update({ status: 'approved' })
    .eq('id', bizId);
  check('owner cannot self-approve (trigger)', !!selfApprove, selfApprove?.message ?? 'no error!');

  // 5. Admin sees it in the pending queue.
  const { data: queue } = await adminUser
    .from('businesses')
    .select('id')
    .eq('status', 'pending');
  check('admin sees pending in queue', (queue ?? []).some((b) => b.id === bizId));

  // 6. Admin approves.
  const { error: approveErr } = await adminUser
    .from('businesses')
    .update({ status: 'approved', rejection_reason: null })
    .eq('id', bizId);
  check('admin approves', !approveErr, approveErr?.message);

  // 7. Now anonymous CAN see it (approved).
  const { data: anonView2 } = await anon.from('businesses').select('id,status').eq('id', bizId);
  check('anon sees approved listing', (anonView2?.length ?? 0) === 1);

  // 8. Admin writes an audit log row.
  const { error: auditErr } = await adminUser.from('admin_action_log').insert({
    admin_id: (await adminUser.auth.getUser()).data.user!.id,
    action: 'approve',
    target_type: 'business',
    target_id: bizId,
    reason: null,
  });
  check('admin writes audit log', !auditErr, auditErr?.message);

  // Cleanup listing.
  await admin.from('businesses').delete().eq('id', bizId);

  console.log(`\nResult: ${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}
main().catch((e) => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
