import type { NextRequest } from 'next/server';
import { RegisterPhoto } from '@nearbite/contracts';
import { MediaRepository, MediaService } from '@nearbite/core';
import { handle } from '@/lib/api/respond';
import { resolveActor } from '@/lib/api/actor';
import { getRequestDb, getAdminDb } from '@/lib/api/db';

/** POST /api/v1/businesses/:id/photos — register an uploaded object. FR-1.4. */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const actor = await resolveActor();
    const { storagePath, kind } = RegisterPhoto.parse(await req.json());
    const db = await getRequestDb();
    const service = new MediaService(new MediaRepository(db, getAdminDb()));
    return service.register(actor, id, storagePath, kind);
  }, 201);
}
