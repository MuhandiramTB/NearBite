import type { Db } from '../shared/db-port';
import { Errors } from '../shared/errors';

/** DB access for favorites (fully private per fav_all RLS). */
export class FavoritesRepository {
  constructor(private readonly db: Db) {}

  async add(userId: string, businessId: string) {
    const { error } = await this.db
      .from('favorites')
      .upsert({ user_id: userId, business_id: businessId });
    if (error) throw Errors.validation(error.message);
    return { ok: true };
  }

  async remove(userId: string, businessId: string) {
    const { error } = await this.db
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('business_id', businessId);
    if (error) throw Errors.validation(error.message);
    return { ok: true };
  }

  async listForUser(userId: string) {
    const { data, error } = await this.db
      .from('favorites')
      .select('business_id,created_at,businesses(id,name,live,price_tier,category_id)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw Errors.validation(error.message);
    return (data ?? []).map((f) => {
      const rel = f.businesses as unknown;
      const b = (Array.isArray(rel) ? rel[0] : rel) as {
        id: string;
        name: string;
        live: string;
        price_tier: number;
      } | null;
      return {
        businessId: f.business_id as string,
        name: b?.name ?? '',
        live: b?.live ?? 'closed',
        priceTier: b?.price_tier ?? 1,
      };
    });
  }
}
