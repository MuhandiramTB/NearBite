import type { Db } from '../shared/db-port';
import { Errors } from '../shared/errors';

/** Analytics via SECURITY DEFINER RPCs (owner-scoped / admin-guarded in SQL). */
export class AnalyticsRepository {
  constructor(private readonly db: Db) {}

  async owner() {
    const { data, error } = await this.db.rpc('owner_analytics');
    if (error) throw Errors.validation(error.message);
    return data;
  }

  async admin() {
    const { data, error } = await this.db.rpc('admin_analytics');
    if (error) throw Errors.forbidden(error.message);
    return data;
  }
}
