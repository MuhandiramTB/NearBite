import type { NextRequest } from 'next/server';
import { CreateReport } from '@nearbite/contracts';
import { ReviewsRepository, ReviewsService } from '@nearbite/core';
import { handle } from '@/lib/api/respond';
import { resolveActor } from '@/lib/api/actor';
import { getRequestDb } from '@/lib/api/db';

/** POST /reports — report a review or listing. FR-4.4. */
export async function POST(req: NextRequest) {
  return handle(async () => {
    const actor = await resolveActor();
    const input = CreateReport.parse(await req.json());
    const db = await getRequestDb();
    const service = new ReviewsService(new ReviewsRepository(db));
    return service.report(actor, input);
  }, 201);
}
