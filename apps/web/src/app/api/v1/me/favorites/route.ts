import { FavoritesRepository, FavoritesService } from '@nearbite/core';
import { handle } from '@/lib/api/respond';
import { resolveActor } from '@/lib/api/actor';
import { getRequestDb } from '@/lib/api/db';

/** GET /me/favorites — the signed-in user's saved places. FR-4.3. */
export async function GET() {
  return handle(async () => {
    const actor = await resolveActor();
    const db = await getRequestDb();
    const service = new FavoritesService(new FavoritesRepository(db));
    const data = await service.list(actor);
    return { data };
  });
}
