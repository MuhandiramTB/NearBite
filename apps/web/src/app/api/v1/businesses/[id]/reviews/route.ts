import type { NextRequest } from 'next/server';
import { CreateReview } from '@nearbite/contracts';
import { ReviewsRepository, ReviewsService } from '@nearbite/core';
import { handle } from '@/lib/api/respond';
import { resolveActor } from '@/lib/api/actor';
import { getRequestDb } from '@/lib/api/db';
import { createSupabaseServer } from '@/lib/supabase/server';

/** GET /businesses/:id/reviews — public list. FR-4.5. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const db = await getRequestDb();
    const service = new ReviewsService(new ReviewsRepository(db));
    const data = await service.list(id);
    return { data };
  });
}

/** POST /businesses/:id/reviews — logged-in user leaves a review. FR-4.2. */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await ctx.params;
    const actor = await resolveActor();
    const input = CreateReview.parse(await req.json());
    // Resolve a display name for denormalized storage (avoids cross-user RLS).
    const sb = await createSupabaseServer();
    const { data: userRes } = await sb.auth.getUser();
    const authorName =
      (userRes.user?.user_metadata?.full_name as string) ??
      userRes.user?.email?.split('@')[0] ??
      'Guest';
    const db = await getRequestDb();
    const service = new ReviewsService(new ReviewsRepository(db));
    return service.add(actor, id, authorName, input);
  }, 201);
}
