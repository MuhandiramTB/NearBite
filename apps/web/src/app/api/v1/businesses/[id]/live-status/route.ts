import type { NextRequest } from 'next/server';
import { SetLiveStatus } from '@nearbite/contracts';
import { ListingsRepository, ListingsService } from '@nearbite/core';
import { handle } from '@/lib/api/respond';
import { resolveActor } from '@/lib/api/actor';
import { getRequestDb } from '@/lib/api/db';

/** PUT /api/v1/businesses/:id/live-status — owner toggles Open/Closed/Busy.
 *  Stamps last_owner_update_at via the freshness trigger. FR-1.5. */
export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const actor = await resolveActor();
    const input = SetLiveStatus.parse(await req.json());
    const db = await getRequestDb();
    const service = new ListingsService(new ListingsRepository(db));
    return service.setLiveStatus(actor, id, input);
  });
}
