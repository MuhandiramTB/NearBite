import type { NextRequest } from 'next/server';
import { AdminDecision } from '@nearbite/contracts';
import { AdminRepository, AdminService } from '@nearbite/core';
import { handle } from '@/lib/api/respond';
import { resolveActor } from '@/lib/api/actor';
import { getRequestDb } from '@/lib/api/db';

/** POST /api/v1/admin/businesses/:id/decision — approve/reject. FR-2.2. */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const actor = await resolveActor();
    const decision = AdminDecision.parse(await req.json());
    const db = await getRequestDb();
    const service = new AdminService(new AdminRepository(db));
    return service.decide(actor, id, decision);
  });
}
