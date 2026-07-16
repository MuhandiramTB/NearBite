import type { NextRequest } from 'next/server';
import { CreateBusiness } from '@nearbite/contracts';
import { ListingsRepository, ListingsService } from '@nearbite/core';
import { handle } from '@/lib/api/respond';
import { resolveActor } from '@/lib/api/actor';
import { getRequestDb } from '@/lib/api/db';

/** POST /api/v1/businesses — owner creates a listing (→ pending). FR-1.1/1.2. */
export async function POST(req: NextRequest) {
  return handle(async () => {
    const actor = await resolveActor();
    const input = CreateBusiness.parse(await req.json());
    const db = await getRequestDb();
    const service = new ListingsService(new ListingsRepository(db));
    return service.createListing(actor, input);
  }, 201);
}
