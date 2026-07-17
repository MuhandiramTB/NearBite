import type { NextRequest } from 'next/server';
import { ReorderPhotos } from '@nearbite/contracts';
import { MediaRepository, MediaService } from '@nearbite/core';
import { handle } from '@/lib/api/respond';
import { resolveActor } from '@/lib/api/actor';
import { getRequestDb, getAdminDb } from '@/lib/api/db';

/** PUT /businesses/:id/photos/order — reorder photos (spec §1). */
export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const actor = await resolveActor();
    const { photoIds } = ReorderPhotos.parse(await req.json());
    const db = await getRequestDb();
    const service = new MediaService(new MediaRepository(db, getAdminDb()));
    return service.reorder(actor, id, photoIds);
  });
}
