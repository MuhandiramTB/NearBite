import { ReviewsRepository, ReviewsService } from '@nearbite/core';
import { handle } from '@/lib/api/respond';
import { resolveActor } from '@/lib/api/actor';
import { getRequestDb } from '@/lib/api/db';

/** DELETE /reviews/:id — remove your own review (RLS-gated). FR-4.2. */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const actor = await resolveActor();
    const db = await getRequestDb();
    const service = new ReviewsService(new ReviewsRepository(db));
    return service.remove(actor, id);
  });
}
