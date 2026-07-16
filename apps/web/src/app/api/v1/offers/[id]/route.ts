import { OffersRepository, OffersService } from '@nearbite/core';
import { handle } from '@/lib/api/respond';
import { resolveActor } from '@/lib/api/actor';
import { getRequestDb } from '@/lib/api/db';

/** DELETE /offers/:id — expire (deactivate) an offer. */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const actor = await resolveActor();
    const db = await getRequestDb();
    return new OffersService(new OffersRepository(db)).expire(actor, id);
  });
}
