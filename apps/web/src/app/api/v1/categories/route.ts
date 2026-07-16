import { SearchRepository, SearchService } from '@nearbite/core';
import { handle } from '@/lib/api/respond';
import { getRequestDb } from '@/lib/api/db';

/** GET /api/v1/categories — cuisine list (i18n). Anonymous. FR-3.3. */
export async function GET() {
  return handle(async () => {
    const db = await getRequestDb();
    const service = new SearchService(new SearchRepository(db));
    const data = await service.categories();
    return { data };
  });
}
