import { SearchRepository, SearchService } from '@nearbite/core';
import { handle } from '@/lib/api/respond';
import { getRequestDb } from '@/lib/api/db';

/** GET /api/v1/cities — list cities (for search + owner form). Anonymous. */
export async function GET() {
  return handle(async () => {
    const db = await getRequestDb();
    const service = new SearchService(new SearchRepository(db));
    const data = await service.cities();
    return { data };
  });
}
