import type { NextRequest } from 'next/server';
import { MarkNotificationsRead } from '@nearbite/contracts';
import { NotificationsRepository, NotificationsService } from '@nearbite/core';
import { handle } from '@/lib/api/respond';
import { resolveActor } from '@/lib/api/actor';
import { getRequestDb } from '@/lib/api/db';

function svc(db: Awaited<ReturnType<typeof getRequestDb>>) {
  return new NotificationsService(new NotificationsRepository(db));
}

/** GET /me/notifications — the signed-in user's notifications. */
export async function GET() {
  return handle(async () => {
    const actor = await resolveActor();
    const data = await svc(await getRequestDb()).list(actor);
    return { data };
  });
}

/** POST /me/notifications — mark read (ids, or empty = all). */
export async function POST(req: NextRequest) {
  return handle(async () => {
    const { ids } = MarkNotificationsRead.parse(await req.json().catch(() => ({})));
    const actor = await resolveActor();
    return svc(await getRequestDb()).markRead(actor, ids);
  });
}
