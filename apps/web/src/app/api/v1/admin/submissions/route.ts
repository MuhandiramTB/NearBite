import { AdminRepository, AdminService } from '@nearbite/core';
import { handle } from '@/lib/api/respond';
import { resolveActor } from '@/lib/api/actor';
import { getRequestDb } from '@/lib/api/db';

/** GET /api/v1/admin/submissions — pending listing queue. FR-2.1. */
export async function GET() {
  return handle(async () => {
    const actor = await resolveActor();
    const db = await getRequestDb();
    const service = new AdminService(new AdminRepository(db));
    const data = await service.listSubmissions(actor);
    return { data };
  });
}
