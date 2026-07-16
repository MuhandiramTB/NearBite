import type { CreateBusiness, UpdateBusiness } from '@nearbite/contracts';
import type { Db } from '../shared/db-port';
import { Errors } from '../shared/errors';

/**
 * The ONLY file in the listings module that touches the database (E §3).
 * Uses the Supabase client so RLS + triggers enforce security (M1 decision).
 * Geography inserts go through the create_business RPC (builds the PostGIS point).
 */
export class ListingsRepository {
  constructor(private readonly db: Db) {}

  async create(input: CreateBusiness): Promise<{ id: string; status: string }> {
    const { data, error } = await this.db.rpc('create_business', {
      p_name: input.name,
      p_category_id: input.categoryId,
      p_city_id: input.cityId,
      p_description: input.description ?? null,
      p_description_lang: input.descriptionLang,
      p_address: input.address ?? null,
      p_lat: input.lat,
      p_lng: input.lng,
      p_phone: input.phone ?? null,
      p_price_tier: input.priceTier,
      p_is_veg_friendly: input.isVegFriendly,
    });
    if (error) throw Errors.validation(error.message);
    return { id: data as string, status: 'pending' };
  }

  async findByOwner(ownerId: string) {
    const { data, error } = await this.db
      .from('businesses')
      .select('id,name,status,live,rejection_reason,last_owner_update_at,created_at')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });
    if (error) throw Errors.validation(error.message);
    return data ?? [];
  }

  async findOwnedById(ownerId: string, id: string) {
    const { data, error } = await this.db
      .from('businesses')
      .select('id,owner_id,status')
      .eq('id', id)
      .eq('owner_id', ownerId)
      .maybeSingle();
    if (error) throw Errors.validation(error.message);
    return data ?? null;
  }

  async setLiveStatus(id: string, live: 'open' | 'closed' | 'busy') {
    // The freshness trigger stamps last_owner_update_at on this update.
    const { data, error } = await this.db
      .from('businesses')
      .update({ live })
      .eq('id', id)
      .select('id,live')
      .maybeSingle();
    if (error) throw Errors.validation(error.message);
    if (!data) throw Errors.notFound('Listing not found');
    return data as { id: string; live: string };
  }

  async update(id: string, input: UpdateBusiness): Promise<{ id: string; status: string }> {
    const patch: Record<string, unknown> = { status: 'pending' };
    if (input.name !== undefined) patch.name = input.name;
    if (input.description !== undefined) patch.description = input.description;
    if (input.descriptionLang !== undefined) patch.description_lang = input.descriptionLang;
    if (input.address !== undefined) patch.address = input.address;
    if (input.phone !== undefined) patch.phone = input.phone;
    if (input.priceTier !== undefined) patch.price_tier = input.priceTier;
    if (input.isVegFriendly !== undefined) patch.is_veg_friendly = input.isVegFriendly;
    if (input.categoryId !== undefined) patch.category_id = input.categoryId;
    // Location updates go through a dedicated RPC later; omitted from patch here.

    const { data, error } = await this.db
      .from('businesses')
      .update(patch)
      .eq('id', id)
      .select('id,status')
      .maybeSingle();
    if (error) throw Errors.validation(error.message);
    if (!data) throw Errors.notFound('Listing not found');
    return data as { id: string; status: string };
  }
}
