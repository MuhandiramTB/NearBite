/**
 * Rich, realistic seed exercising the FULL workflow against the live DB:
 *   - admin + 3 owners + 4 consumer users (auto profiles via trigger)
 *   - owners create listings → admin approves
 *   - each listing gets generated SVG food images (uploaded to storage),
 *     menu items, weekly hours, live status
 *   - consumers post realistic text reviews (avg_rating auto-updates via trigger)
 *   - consumers favorite places
 * Idempotent: wipes prior "Demo:" listings + seed users first.
 *
 * Run: tsx src/rich-seed.ts
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!URL || !ANON || !SERVICE) throw new Error('Missing Supabase env');
const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });
const BUCKET = 'business-photos';
const PW = 'Passw0rd!x';

async function session(email: string, role: 'admin' | 'owner' | 'consumer', name: string) {
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
  const c = createClient(URL, ANON, { auth: { persistSession: false } });
  await c.auth.signInWithPassword({ email, password: PW });
  return { client: c, id: data.user!.id, name };
}

/** Generate a warm food "photo" as an SVG (a real, self-contained image file). */
function foodSvg(title: string, emoji: string, hue: number): Uint8Array {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl(${hue},70%,55%)"/>
      <stop offset="1" stop-color="hsl(${(hue + 30) % 360},75%,42%)"/>
    </linearGradient>
    <radialGradient id="v" cx="0.5" cy="0.4" r="0.8">
      <stop offset="0" stop-color="rgba(255,255,255,0.25)"/>
      <stop offset="1" stop-color="rgba(0,0,0,0.15)"/>
    </radialGradient>
  </defs>
  <rect width="800" height="500" fill="url(#g)"/>
  <rect width="800" height="500" fill="url(#v)"/>
  <circle cx="400" cy="215" r="120" fill="rgba(255,255,255,0.14)"/>
  <text x="400" y="255" font-size="130" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
  <text x="400" y="410" font-size="34" font-family="Segoe UI, sans-serif" font-weight="700"
        fill="rgba(255,255,255,0.95)" text-anchor="middle">${title}</text>
</svg>`;
  return new TextEncoder().encode(svg);
}

type Listing = {
  name: string;
  cat: string;
  emoji: string;
  hue: number;
  price: number;
  veg: boolean;
  live: 'open' | 'busy' | 'closed';
  lat: number;
  lng: number;
  address: string;
  desc: string;
  menu: { name: string; price: number; veg: boolean; section: string }[];
  photos: { title: string; emoji: string }[];
};

const OWNERS: { email: string; name: string; listings: Listing[] }[] = [
  {
    email: 'amara@nearbite.test',
    name: 'Amara Perera',
    listings: [
      {
        name: 'Demo: Amara’s Kottu Corner',
        cat: 'sri-lankan',
        emoji: '🍛',
        hue: 18,
        price: 2,
        veg: false,
        live: 'open',
        lat: 6.9344,
        lng: 79.8428,
        address: 'Fort, Colombo 01',
        desc: 'Family-run kottu spot famous for late-night chicken kottu and hoppers.',
        menu: [
          { name: 'Chicken Kottu', price: 850, veg: false, section: 'Kottu' },
          { name: 'Cheese Kottu', price: 1050, veg: false, section: 'Kottu' },
          { name: 'Veg Kottu', price: 650, veg: true, section: 'Kottu' },
          { name: 'Egg Hoppers (2)', price: 300, veg: true, section: 'Hoppers' },
          { name: 'Faluda', price: 400, veg: true, section: 'Drinks' },
        ],
        photos: [
          { title: 'Chicken Kottu', emoji: '🍛' },
          { title: 'Hoppers', emoji: '🥞' },
        ],
      },
    ],
  },
  {
    email: 'nuwan@nearbite.test',
    name: 'Nuwan Silva',
    listings: [
      {
        name: 'Demo: Green Leaf Cafe',
        cat: 'cafe',
        emoji: '☕',
        hue: 140,
        price: 2,
        veg: true,
        live: 'busy',
        lat: 6.9312,
        lng: 79.845,
        address: 'Pettah, Colombo 11',
        desc: 'Bright vegetarian café — brunch bowls, specialty coffee, fresh juices.',
        menu: [
          { name: 'Avocado Toast', price: 900, veg: true, section: 'Brunch' },
          { name: 'Veggie Buddha Bowl', price: 1200, veg: true, section: 'Brunch' },
          { name: 'Flat White', price: 550, veg: true, section: 'Coffee' },
          { name: 'Mango Smoothie', price: 650, veg: true, section: 'Drinks' },
        ],
        photos: [
          { title: 'Avocado Toast', emoji: '🥑' },
          { title: 'Flat White', emoji: '☕' },
        ],
      },
    ],
  },
  {
    email: 'fathima@nearbite.test',
    name: 'Fathima Rizvi',
    listings: [
      {
        name: 'Demo: Dragon Wok',
        cat: 'chinese',
        emoji: '🥡',
        hue: 5,
        price: 3,
        veg: false,
        live: 'open',
        lat: 6.94,
        lng: 79.848,
        address: 'Slave Island, Colombo 02',
        desc: 'Sri Lankan-Chinese classics — nasi goreng, hot butter cuttlefish, fried rice.',
        menu: [
          { name: 'Nasi Goreng', price: 1200, veg: false, section: 'Mains' },
          { name: 'Hot Butter Cuttlefish', price: 1600, veg: false, section: 'Starters' },
          { name: 'Veg Fried Rice', price: 900, veg: true, section: 'Rice' },
          { name: 'Chicken Chowmein', price: 1100, veg: false, section: 'Noodles' },
        ],
        photos: [
          { title: 'Nasi Goreng', emoji: '🍚' },
          { title: 'Hot Butter Cuttlefish', emoji: '🦑' },
        ],
      },
    ],
  },
];

const CONSUMERS = [
  { email: 'dinesh@nearbite.test', name: 'Dinesh' },
  { email: 'sanjana@nearbite.test', name: 'Sanjana' },
  { email: 'kasun@nearbite.test', name: 'Kasun' },
  { email: 'priya@nearbite.test', name: 'Priya' },
];

const REVIEW_POOL = [
  { rating: 5, body: 'Absolutely fresh and the portions are generous. Prices matched the menu exactly!' },
  { rating: 4, body: 'Really good — arrived and it was open just like the app said. Will come back.' },
  { rating: 5, body: 'Best in the area. The photos are accurate, which is rare. Loved it.' },
  { rating: 3, body: 'Decent food but was a bit busy when I went. Still worth it.' },
  { rating: 4, body: 'Tasty and quick. Nice that I could check they were open before heading over.' },
];

async function main() {
  console.log('Provisioning users…');
  const adminU = await session('demo-admin@example.com', 'admin', 'Admin');
  const consumers: SupabaseClient[] = [];
  const consumerNames: string[] = [];
  for (const c of CONSUMERS) {
    const s = await session(c.email, 'consumer', c.name);
    consumers.push(s.client);
    consumerNames.push(c.name);
  }

  const { data: city } = await admin.from('cities').select('id').limit(1).single();
  const { data: cats } = await admin.from('categories').select('id,slug');
  const catId = (slug: string) => cats!.find((c) => c.slug === slug)!.id;

  // Wipe prior demo listings.
  await admin.from('businesses').delete().like('name', 'Demo:%');

  const created: { id: string; name: string }[] = [];

  for (const owner of OWNERS) {
    const o = await session(owner.email, 'owner', owner.name);
    for (const L of owner.listings) {
      const { data: id } = await o.client.rpc('create_business', {
        p_name: L.name,
        p_category_id: catId(L.cat),
        p_city_id: city!.id,
        p_description: L.desc,
        p_description_lang: 'en',
        p_address: L.address,
        p_lat: L.lat,
        p_lng: L.lng,
        p_phone: '+94 11 234 5678',
        p_price_tier: L.price,
        p_is_veg_friendly: L.veg,
      });
      const bizId = id as string;

      // menu + hours (via service role — inserts allowed by grants)
      await admin.from('menu_items').insert(
        L.menu.map((m, i) => ({
          business_id: bizId,
          name: m.name,
          price: m.price,
          is_veg: m.veg,
          section: m.section,
          sort_order: i,
        })),
      );
      await admin.from('business_hours').insert(
        [1, 2, 3, 4, 5, 6, 0].map((wd) => ({
          business_id: bizId,
          weekday: wd,
          open_time: '10:00',
          close_time: '22:30',
          is_closed: false,
        })),
      );

      // upload generated SVG images + register photo rows (owner-owned path)
      for (let i = 0; i < L.photos.length; i++) {
        const p = L.photos[i]!;
        const path = `${bizId}/${i}-${p.title.toLowerCase().replace(/\W+/g, '-')}.svg`;
        const bytes = foodSvg(p.title, p.emoji, L.hue + i * 12);
        const up = await admin.storage.from(BUCKET).upload(path, bytes, {
          contentType: 'image/svg+xml',
          upsert: true,
        });
        if (up.error) console.log('  upload err:', up.error.message);
        await admin.from('photos').insert({
          business_id: bizId,
          storage_path: path,
          kind: i === 0 ? 'food' : 'venue',
        });
      }

      // approve (admin session) + set live status
      await adminU.client
        .from('businesses')
        .update({ status: 'approved', live: L.live })
        .eq('id', bizId);

      created.push({ id: bizId, name: L.name });
      console.log(`  ✓ ${L.name} — ${L.photos.length} photos, ${L.menu.length} menu items, ${L.live}`);
    }
  }

  // Reviews: each consumer reviews a couple of places (1 per user per place).
  console.log('Posting reviews…');
  let reviewCount = 0;
  for (let ci = 0; ci < consumers.length; ci++) {
    const c = consumers[ci]!;
    const uid = (await c.auth.getUser()).data.user!.id;
    // each consumer reviews 2 distinct listings
    for (let k = 0; k < 2; k++) {
      const biz = created[(ci + k) % created.length]!;
      const r = REVIEW_POOL[(ci + k) % REVIEW_POOL.length]!;
      const { error } = await c.from('reviews').insert({
        business_id: biz.id,
        user_id: uid, // required: RLS rev_insert checks user_id = auth.uid()
        rating: r.rating,
        body: r.body,
        author_name: consumerNames[ci],
      });
      if (error) console.log(`  review err (${consumerNames[ci]}→${biz.name}):`, error.message);
      else reviewCount++;
      const { error: favErr } = await c.from('favorites').upsert({
        user_id: uid,
        business_id: biz.id,
      });
      if (favErr) console.log('  fav err:', favErr.message);
    }
  }
  console.log(`  ✓ ${reviewCount} reviews + favorites posted`);

  // Show resulting avg ratings (proves the recompute trigger fired).
  const { data: summary } = await admin
    .from('businesses')
    .select('name,avg_rating,review_count,live')
    .like('name', 'Demo:%')
    .order('name');
  console.log('\nResult:');
  for (const b of summary ?? []) {
    console.log(`  ${b.name} — ★${b.avg_rating} (${b.review_count} reviews), ${b.live}`);
  }
  console.log('\nRich seed complete.');
  process.exit(0);
}
main().catch((e) => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
