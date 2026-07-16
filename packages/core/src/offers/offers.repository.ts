import type { CreateOffer } from '@nearbite/contracts';
import type { Db } from '../shared/db-port';
import { Errors } from '../shared/errors';

/** Offers CRUD (owner/admin via RLS offer_write). */
export class OffersRepository {
  constructor(private readonly db: Db) {}

  async create(businessId: string, input: CreateOffer) {
    const { data, error } = await this.db
      .from('offers')
      .insert({
        business_id: businessId,
        title: input.title,
        description: input.description ?? null,
        starts_at: input.startsAt ?? new Date().toISOString(),
        ends_at: input.endsAt,
        is_active: true,
      })
      .select('id,title,ends_at')
      .single();
    if (error) throw Errors.validation(error.message);
    return data;
  }

  async listForBusiness(businessId: string) {
    const { data, error } = await this.db
      .from('offers')
      .select('id,title,description,starts_at,ends_at,is_active')
      .eq('business_id', businessId)
      .order('ends_at', { ascending: false });
    if (error) throw Errors.validation(error.message);
    return data ?? [];
  }

  async expire(offerId: string) {
    const { error } = await this.db.from('offers').update({ is_active: false }).eq('id', offerId);
    if (error) throw Errors.validation(error.message);
    return { id: offerId };
  }
}
