import type { NextRequest } from 'next/server';
import { UploadUrlRequest } from '@nearbite/contracts';
import { MediaRepository, MediaService } from '@nearbite/core';
import { handle } from '@/lib/api/respond';
import { resolveActor } from '@/lib/api/actor';
import { getRequestDb, getAdminDb } from '@/lib/api/db';

/** POST /api/v1/businesses/:id/photos/upload-url — signed direct-upload URL. FR-1.4. */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const actor = await resolveActor();
    const { filename } = UploadUrlRequest.parse(await req.json());
    const db = await getRequestDb();
    const service = new MediaService(new MediaRepository(db, getAdminDb()));
    return service.getUploadUrl(actor, id, filename);
  }, 201);
}
