import { ReviewsRepository, ReviewsService } from '@nearbite/core';
import { handle } from '@/lib/api/respond';
import { resolveActor } from '@/lib/api/actor';
import { getRequestDb } from '@/lib/api/db';

/** GET /me/reviews — feedback across all of the owner's listings (FR-1: owner
 *  reads reviews received). */
export async function GET() {
  return handle(async () => {
    const actor = await resolveActor();
    const db = await getRequestDb();
    const service = new ReviewsService(new ReviewsRepository(db));
    const data = await service.ownerFeedback(actor);
    return { data };
  });
}
