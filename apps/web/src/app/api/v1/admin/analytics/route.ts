import { AnalyticsRepository, AnalyticsService } from '@nearbite/core';
import { handle } from '@/lib/api/respond';
import { resolveActor } from '@/lib/api/actor';
import { getRequestDb } from '@/lib/api/db';

/** GET /admin/analytics — platform-wide summary (admin only). */
export async function GET() {
  return handle(async () => {
    const actor = await resolveActor();
    const db = await getRequestDb();
    return new AnalyticsService(new AnalyticsRepository(db)).admin(actor);
  });
}
