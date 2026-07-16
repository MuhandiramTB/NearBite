import type { Db } from '../shared/db-port';
import { Errors } from '../shared/errors';

/** Notifications — users read/mark-read their own (RLS notif_read/notif_update). */
export class NotificationsRepository {
  constructor(private readonly db: Db) {}

  async listForUser(userId: string) {
    const { data, error } = await this.db
      .from('notifications')
      .select('id,type,title,body,link,is_read,created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw Errors.validation(error.message);
    return (data ?? []).map((n) => ({
      id: n.id as string,
      type: n.type as string,
      title: n.title as string,
      body: (n.body as string | null) ?? null,
      link: (n.link as string | null) ?? null,
      isRead: (n.is_read as boolean) ?? false,
      createdAt: n.created_at as string,
    }));
  }

  async markRead(userId: string, ids: string[]) {
    let query = this.db.from('notifications').update({ is_read: true }).eq('user_id', userId);
    if (ids.length > 0) query = query.in('id', ids);
    const { error } = await query;
    if (error) throw Errors.validation(error.message);
    return { ok: true };
  }
}
