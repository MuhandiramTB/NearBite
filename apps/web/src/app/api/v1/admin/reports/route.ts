import { AdminRepository, AdminService } from '@nearbite/core';
import { handle } from '@/lib/api/respond';
import { resolveActor } from '@/lib/api/actor';
import { getRequestDb } from '@/lib/api/db';

/** GET /admin/reports — open moderation queue (admin only). FR-2.4. */
export async function GET() {
  return handle(async () => {
    const actor = await resolveActor();
    const db = await getRequestDb();
    const data = await new AdminService(new AdminRepository(db)).reports(actor);
    return { data };
  });
}
