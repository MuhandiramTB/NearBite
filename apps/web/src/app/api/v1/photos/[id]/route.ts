import { MediaRepository, MediaService } from '@nearbite/core';
import { handle } from '@/lib/api/respond';
import { resolveActor } from '@/lib/api/actor';
import { getRequestDb, getAdminDb } from '@/lib/api/db';

/** DELETE /api/v1/photos/:id — remove a photo (owner/admin). FR-1.4. */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const actor = await resolveActor();
    const db = await getRequestDb();
    const service = new MediaService(new MediaRepository(db, getAdminDb()));
    return service.remove(actor, id);
  });
}
