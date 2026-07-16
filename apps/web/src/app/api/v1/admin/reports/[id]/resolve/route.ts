import type { NextRequest } from 'next/server';
import { ResolveReport } from '@nearbite/contracts';
import { AdminRepository, AdminService } from '@nearbite/core';
import { handle } from '@/lib/api/respond';
import { resolveActor } from '@/lib/api/actor';
import { getRequestDb } from '@/lib/api/db';

/** POST /admin/reports/:id/resolve — dismiss/action a report (admin only). */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const { status, action } = ResolveReport.parse(await req.json());
    const actor = await resolveActor();
    const db = await getRequestDb();
    return new AdminService(new AdminRepository(db)).resolveReport(actor, id, status, action);
  });
}
