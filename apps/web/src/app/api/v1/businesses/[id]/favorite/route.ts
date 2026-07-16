import { FavoritesRepository, FavoritesService } from '@nearbite/core';
import { handle } from '@/lib/api/respond';
import { resolveActor } from '@/lib/api/actor';
import { getRequestDb } from '@/lib/api/db';

function svc(db: Awaited<ReturnType<typeof getRequestDb>>) {
  return new FavoritesService(new FavoritesRepository(db));
}

/** PUT /businesses/:id/favorite — save. FR-4.3. */
export async function PUT(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const actor = await resolveActor();
    return svc(await getRequestDb()).save(actor, id);
  });
}

/** DELETE /businesses/:id/favorite — unsave. */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const actor = await resolveActor();
    return svc(await getRequestDb()).unsave(actor, id);
  });
}
