/**
 * Demo scenario seed: a few realistic APPROVED listings in the pilot city,
 * each with menu items + hours + live status, so the app looks real.
 * Idempotent-ish: deletes any prior demo listings (names prefixed "Demo:").
 *
 * Run: tsx src/demo-seed.ts
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });

async function adminSession(): Promise<SupabaseClient> {
  const email = 'demo-admin@example.com';
  const { data: list } = await admin.auth.admin.listUsers();
  const ex = list.users.find((u) => u.email === email);
  if (ex) await admin.auth.admin.deleteUser(ex.id);
  const { data } = await admin.auth.admin.createUser({
    email,
    password: 'Passw0rd!x',
    email_confirm: true,
  });
  await admin.from('profiles').upsert({ id: data.user!.id, role: 'admin' });
  const c = createClient(URL, ANON, { auth: { persistSession: false } });
  await c.auth.signInWithPassword({ email, password: 'Passw0rd!x' });
  return c;
}

type Spec = {
  name: string;
  cat: string;
  price: number;
  veg: boolean;
  live: 'open' | 'busy' | 'closed';
  lat: number;
  lng: number;
  address: string;
  menu: { name: string; price: number; veg: boolean; section: string }[];
};

const SPECS: Spec[] = [
  {
    name: 'Demo: Fort Kottu House',
    cat: 'sri-lankan',
    price: 2,
    veg: false,
    live: 'open',
    lat: 6.9344,
    lng: 79.8428,
    address: 'Fort, Colombo',
    menu: [
      { name: 'Chicken Kottu', price: 850, veg: false, section: 'Mains' },
      { name: 'Veg Kottu', price: 650, veg: true, section: 'Mains' },
      { name: 'Faluda', price: 400, veg: true, section: 'Drinks' },
    ],
  },
  {
    name: 'Demo: Green Leaf Cafe',
    cat: 'cafe',
    price: 2,
    veg: true,
    live: 'busy',
    lat: 6.9312,
    lng: 79.845,
    address: 'Pettah, Colombo',
    menu: [
      { name: 'Avocado Toast', price: 900, veg: true, section: 'Brunch' },
      { name: 'Flat White', price: 550, veg: true, section: 'Coffee' },
    ],
  },
  {
    name: 'Demo: Dragon Wok',
    cat: 'chinese',
    price: 3,
    veg: false,
    live: 'open',
    lat: 6.94,
    lng: 79.848,
    address: 'Slave Island, Colombo',
    menu: [
      { name: 'Nasi Goreng', price: 1200, veg: false, section: 'Mains' },
      { name: 'Hot Butter Cuttlefish', price: 1600, veg: false, section: 'Starters' },
    ],
  },
];

async function main() {
  const { data: city } = await admin.from('cities').select('id').limit(1).single();
  const { data: cats } = await admin.from('categories').select('id,slug');
  const catId = (slug: string) => cats!.find((c) => c.slug === slug)?.id;

  // Clean prior demo rows.
  await admin.from('businesses').delete().like('name', 'Demo:%');

  const adminC = await adminSession();

  for (const s of SPECS) {
    const { data: id } = await admin.rpc('create_business', {
      p_name: s.name,
      p_category_id: catId(s.cat),
      p_city_id: city!.id,
      p_description: `${s.name.replace('Demo: ', '')} — seeded demo listing.`,
      p_description_lang: 'en',
      p_address: s.address,
      p_lat: s.lat,
      p_lng: s.lng,
      p_phone: '+94 11 234 5678',
      p_price_tier: s.price,
      p_is_veg_friendly: s.veg,
    });
    const bizId = id as string;

    // Menu items + a few hours.
    await admin.from('menu_items').insert(
      s.menu.map((m, i) => ({
        business_id: bizId,
        name: m.name,
        price: m.price,
        is_veg: m.veg,
        section: m.section,
        sort_order: i,
      })),
    );
    await admin.from('business_hours').insert(
      [1, 2, 3, 4, 5, 6].map((wd) => ({
        business_id: bizId,
        weekday: wd,
        open_time: '10:00',
        close_time: '22:00',
        is_closed: false,
      })),
    );

    // Approve (admin session → trigger permits) and set live status.
    await adminC.from('businesses').update({ status: 'approved', live: s.live }).eq('id', bizId);
    console.log(`Seeded & approved: ${s.name} (${s.live})`);
  }

  console.log('\nDemo seed complete.');
  process.exit(0);
}
main().catch((e) => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
