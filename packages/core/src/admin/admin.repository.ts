import type { Db } from '../shared/db-port';
import { Errors } from '../shared/errors';

/**
 * DB access for admin moderation via the Supabase client, so RLS + the
 * status-guard trigger's is_admin()/auth.uid() checks work correctly.
 */
export class AdminRepository {
  constructor(private readonly db: Db) {}

  async pendingSubmissions() {
    const { data, error } = await this.db
      .from('businesses')
      .select('id,name,category_id,city_id,created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) throw Errors.validation(error.message);
    return data ?? [];
  }

  async getStatus(id: string) {
    const { data, error } = await this.db
      .from('businesses')
      .select('id,status')
      .eq('id', id)
      .maybeSingle();
    if (error) throw Errors.validation(error.message);
    return data ?? null;
  }

  async setStatus(id: string, status: 'approved' | 'rejected', reason: string | null) {
    const { data, error } = await this.db
      .from('businesses')
      .update({ status, rejection_reason: reason })
      .eq('id', id)
      .select('id,status')
      .maybeSingle();
    if (error) throw Errors.validation(error.message);
    return data ?? null;
  }

  async listUsers(q?: string) {
    const { data, error } = await this.db.rpc('admin_list_users', { p_q: q ?? null });
    if (error) throw Errors.forbidden(error.message);
    return data;
  }

  async setRole(userId: string, role: 'consumer' | 'owner' | 'admin') {
    const { error } = await this.db.rpc('admin_set_role', { p_user_id: userId, p_role: role });
    if (error) throw Errors.validation(error.message);
    return { ok: true };
  }

  async reports() {
    const { data, error } = await this.db.rpc('admin_reports');
    if (error) throw Errors.forbidden(error.message);
    return data;
  }

  async resolveReport(reportId: string, status: 'reviewed' | 'dismissed', action?: string) {
    const { error } = await this.db.rpc('admin_resolve_report', {
      p_report_id: reportId,
      p_status: status,
      p_action: action ?? null,
    });
    if (error) throw Errors.validation(error.message);
    return { ok: true };
  }

  async logAction(adminId: string, action: string, targetId: string, reason: string | null) {
    const { error } = await this.db.from('admin_action_log').insert({
      admin_id: adminId,
      action,
      target_type: 'business',
      target_id: targetId,
      reason,
    });
    if (error) throw Errors.validation(error.message);
  }
}
