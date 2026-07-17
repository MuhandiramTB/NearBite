import type { SearchQuery } from '@nearbite/contracts';
import type { Db } from '../shared/db-port';
import { Errors } from '../shared/errors';

const PHOTO_BUCKET = 'business-photos';

/** DB access for anonymous discovery. Calls the geo RPCs; RLS keeps results
 *  to approved listings even for anon. Only DB-touching file in the module. */
export class SearchRepository {
  constructor(private readonly db: Db) {}

  private publicUrl(path: string | null): string | null {
    if (!path) return null;
    return this.db.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
  }

  async search(q: SearchQuery, offset: number) {
    const { data, error } = await this.db.rpc('search_businesses', {
      p_lat: q.lat,
      p_lng: q.lng,
      p_radius_m: q.radiusM,
      p_city_id: q.cityId,
      p_q: q.q ?? null,
      p_category_id: q.categoryId ?? null,
      p_max_price_tier: q.maxPriceTier ?? null,
      p_veg_only: q.vegOnly,
      p_open_now: q.openNow,
      p_facilities: q.facilities ?? null,
      p_visit_purposes: q.visitPurposes ?? null,
      p_convenience: q.convenience ?? null,
      p_min_rating: q.minRating ?? null,
      p_sort: q.sort,
      p_limit: q.limit,
      p_offset: offset,
    });
    if (error) throw Errors.validation(error.message);
    type Row = {
      id: string;
      name: string;
      category_slug: string | null;
      price_tier: number;
      avg_rating: number | string;
      review_count: number;
      live: 'open' | 'closed' | 'busy';
      distance_m: number;
      thumbnail_path: string | null;
      last_updated_at: string;
    };
    return (data as Row[]).map((r) => ({
      id: r.id,
      name: r.name,
      categorySlug: r.category_slug,
      priceTier: r.price_tier,
      avgRating: Number(r.avg_rating),
      reviewCount: r.review_count,
      live: r.live,
      distanceM: r.distance_m,
      thumbnailUrl: this.publicUrl(r.thumbnail_path),
      lastUpdatedAt: new Date(r.last_updated_at).toISOString(),
    }));
  }

  async detail(id: string) {
    const { data, error } = await this.db.rpc('business_detail', { p_id: id });
    if (error) throw Errors.validation(error.message);
    if (!data) return null;
    // Convert photo storage paths to public URLs.
    const d = data as Record<string, unknown> & {
      photos: { id: string; storagePath: string; kind: string }[];
    };
    return {
      ...d,
      photos: d.photos.map((p) => ({
        id: p.id,
        url: this.publicUrl(p.storagePath),
        kind: p.kind,
      })),
    };
  }

  async categories() {
    const { data, error } = await this.db.from('categories').select('id,slug,i18n');
    if (error) throw Errors.validation(error.message);
    return data ?? [];
  }

  async cities() {
    // center lat/lng come from a small RPC (PostGIS geography → numbers).
    const { data, error } = await this.db.rpc('list_cities');
    if (error) throw Errors.validation(error.message);
    return (data ?? []) as { id: string; name: string; lat: number | null; lng: number | null }[];
  }
}
