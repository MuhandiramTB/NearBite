import { ListingsRepository, ListingsService } from '@nearbite/core';
import { handle } from '@/lib/api/respond';
import { resolveActor } from '@/lib/api/actor';
import { getRequestDb } from '@/lib/api/db';

/** GET /api/v1/me/businesses — owner sees their own listings + status. FR-1.7. */
export async function GET() {
  return handle(async () => {
    const actor = await resolveActor();
    const db = await getRequestDb();
    const service = new ListingsService(new ListingsRepository(db));
    const data = await service.listMine(actor);
    return { data };
  });
}
