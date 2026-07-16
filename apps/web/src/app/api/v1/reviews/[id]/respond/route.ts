import type { NextRequest } from 'next/server';
import { RespondToReview } from '@nearbite/contracts';
import { ReviewsRepository, ReviewsService } from '@nearbite/core';
import { handle } from '@/lib/api/respond';
import { resolveActor } from '@/lib/api/actor';
import { getRequestDb } from '@/lib/api/db';

/** POST /reviews/:id/respond — owner replies to a review on their listing. */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const actor = await resolveActor();
    const { response } = RespondToReview.parse(await req.json());
    const db = await getRequestDb();
    const service = new ReviewsService(new ReviewsRepository(db));
    return service.respond(actor, id, response);
  });
}
