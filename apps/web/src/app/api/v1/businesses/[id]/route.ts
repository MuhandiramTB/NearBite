import { SearchRepository, SearchService } from '@nearbite/core';
import { handle } from '@/lib/api/respond';
import { getRequestDb } from '@/lib/api/db';

/** GET /api/v1/businesses/:id — full detail page. Anonymous. FR-3.4. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const db = await getRequestDb();
    const service = new SearchService(new SearchRepository(db));
    return service.detail(id);
  });
}
