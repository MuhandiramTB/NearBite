import type { NextRequest } from 'next/server';
import { CreateOffer } from '@nearbite/contracts';
import { OffersRepository, OffersService } from '@nearbite/core';
import { handle } from '@/lib/api/respond';
import { resolveActor } from '@/lib/api/actor';
import { getRequestDb } from '@/lib/api/db';

function svc(db: Awaited<ReturnType<typeof getRequestDb>>) {
  return new OffersService(new OffersRepository(db));
}

/** GET /businesses/:id/offers — owner lists their offers (incl. expired). */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const actor = await resolveActor();
    const data = await svc(await getRequestDb()).list(actor, id);
    return { data };
  });
}

/** POST /businesses/:id/offers — create an offer. FR-1.6. */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const actor = await resolveActor();
    const input = CreateOffer.parse(await req.json());
    return svc(await getRequestDb()).create(actor, id, input);
  }, 201);
}
