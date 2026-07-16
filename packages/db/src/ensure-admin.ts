/** Create/repair the pilot admin account (spec §7): admin@nearbite.com. */
import { createClient } from '@supabase/supabase-js';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

const EMAIL = 'admin@nearbite.com';
const PASSWORD = 'NearBite@123';

async function main() {
  const { data: list } = await admin.auth.admin.listUsers();
  const existing = list.users.find((u) => u.email === EMAIL);
  let id = existing?.id;
  if (existing) {
    await admin.auth.admin.updateUserById(existing.id, { password: PASSWORD, email_confirm: true });
    console.log('Updated existing admin user.');
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: 'NearBite Admin' },
    });
    if (error || !data.user) throw error ?? new Error('no user');
    id = data.user.id;
    console.log('Created admin user.');
  }
  await admin.from('profiles').upsert({ id: id!, role: 'admin', full_name: 'NearBite Admin' });
  console.log(`Admin ready: ${EMAIL} / ${PASSWORD}`);
  process.exit(0);
}
main().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
