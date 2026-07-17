import type { NextRequest } from 'next/server';
import { UpdateSettings } from '@nearbite/contracts';
import { ListingsRepository, ListingsService } from '@nearbite/core';
import { handle } from '@/lib/api/respond';
import { resolveActor } from '@/lib/api/actor';
import { getRequestDb } from '@/lib/api/db';

/** PUT /businesses/:id/settings — currency + facility/attribute toggles (spec §4). */
export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const actor = await resolveActor();
    const input = UpdateSettings.parse(await req.json());
    const db = await getRequestDb();
    return new ListingsService(new ListingsRepository(db)).updateSettings(actor, id, input);
  });
}
