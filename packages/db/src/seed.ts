/**
 * Seed reference data for local/pilot use.
 * Run: DATABASE_URL=... pnpm --filter @nearbite/db exec tsx src/seed.ts
 *
 * Seeds the pilot city + cuisine categories. This is also where the
 * launch-gate seed listings (§ roadmap, ≥50) would be inserted later.
 */
import { createDbClient, schema } from './index';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is required to seed');

const db = createDbClient(url);

const CATEGORIES: { slug: string; i18n: Record<string, string> }[] = [
  { slug: 'sri-lankan', i18n: { en: 'Sri Lankan', si: 'ශ්‍රී ලාංකික', ta: 'இலங்கை' } },
  { slug: 'cafe', i18n: { en: 'Cafe', si: 'කැෆේ', ta: 'கஃபே' } },
  { slug: 'chinese', i18n: { en: 'Chinese', si: 'චීන', ta: 'சீன' } },
  { slug: 'indian', i18n: { en: 'Indian', si: 'ඉන්දියානු', ta: 'இந்திய' } },
  { slug: 'bakery', i18n: { en: 'Bakery', si: 'බේකරි', ta: 'பேக்கரி' } },
  { slug: 'fast-food', i18n: { en: 'Fast Food', si: 'ක්ෂණික ආහාර', ta: 'துரித உணவு' } },
];

async function main() {
  await db
    .insert(schema.categories)
    .values(CATEGORIES)
    .onConflictDoNothing({ target: schema.categories.slug });

  // Pilot city (inactive until launch gate is met).
  await db
    .insert(schema.cities)
    .values({ name: 'Pilot City', country: 'LK', isActive: false })
    .onConflictDoNothing();

  console.log('Seed complete: categories + pilot city.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
