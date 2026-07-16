import type { NextRequest } from 'next/server';
import { SetUserRole } from '@nearbite/contracts';
import { AdminRepository, AdminService } from '@nearbite/core';
import { handle } from '@/lib/api/respond';
import { resolveActor } from '@/lib/api/actor';
import { getRequestDb } from '@/lib/api/db';

/** GET /admin/users?q= — list/search users (admin only). */
export async function GET(req: NextRequest) {
  return handle(async () => {
    const q = req.nextUrl.searchParams.get('q') ?? undefined;
    const actor = await resolveActor();
    const db = await getRequestDb();
    const data = await new AdminService(new AdminRepository(db)).listUsers(actor, q);
    return { data };
  });
}

/** POST /admin/users — set a user's role (admin only). */
export async function POST(req: NextRequest) {
  return handle(async () => {
    const { userId, role } = SetUserRole.parse(await req.json());
    const actor = await resolveActor();
    const db = await getRequestDb();
    return new AdminService(new AdminRepository(db)).setRole(actor, userId, role);
  });
}
