/** Create the business-photos storage bucket if missing (idempotent). */
import { createClient } from '@supabase/supabase-js';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

const BUCKET = 'business-photos';

async function main() {
  const { data: buckets } = await admin.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === BUCKET);
  if (exists) {
    console.log(`Bucket "${BUCKET}" already exists.`);
  } else {
    const { error } = await admin.storage.createBucket(BUCKET, {
      public: true, // listings are public; RLS on storage.objects gates writes
      fileSizeLimit: 5 * 1024 * 1024, // 5 MB per photo (NFR-5: optimize on mobile)
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    });
    if (error) throw new Error(error.message);
    console.log(`Created bucket "${BUCKET}".`);
  }
  process.exit(0);
}
main().catch((e) => {
  console.error('FAILED:', e.message);
  process.exit(1);
});
