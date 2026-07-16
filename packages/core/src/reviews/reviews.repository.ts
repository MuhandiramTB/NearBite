import type { CreateReport, CreateReview } from '@nearbite/contracts';
import type { Db } from '../shared/db-port';
import { Errors } from '../shared/errors';

/** DB access for reviews + reports. Only DB-touching file in the module.
 *  Insert is RLS-gated (rev_insert); the recompute_rating trigger keeps
 *  businesses.avg_rating / review_count correct automatically. */
export class ReviewsRepository {
  constructor(private readonly db: Db) {}

  async create(businessId: string, userId: string, authorName: string, input: CreateReview) {
    const { data, error } = await this.db
      .from('reviews')
      .insert({
        business_id: businessId,
        user_id: userId,
        author_name: authorName,
        rating: input.rating,
        body: input.body ?? null,
        rating_food: input.ratingFood ?? null,
        rating_service: input.ratingService ?? null,
        rating_value: input.ratingValue ?? null,
        rating_cleanliness: input.ratingCleanliness ?? null,
      })
      .select('id,rating,body,created_at,author_name')
      .single();
    if (error) {
      // unique(business_id,user_id) → one review per user per business
      if (error.code === '23505') throw Errors.conflict('You have already reviewed this place');
      throw Errors.validation(error.message);
    }
    return data;
  }

  async listForBusiness(businessId: string) {
    const { data, error } = await this.db
      .from('reviews')
      .select('id,rating,body,created_at,author_name,owner_response,owner_responded_at')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });
    if (error) throw Errors.validation(error.message);
    return (data ?? []).map((r) => ({
      id: r.id as string,
      rating: r.rating as number,
      body: (r.body as string | null) ?? null,
      createdAt: r.created_at as string,
      authorName: (r.author_name as string | null) ?? 'Guest',
      ownerResponse: (r.owner_response as string | null) ?? null,
      ownerRespondedAt: (r.owner_responded_at as string | null) ?? null,
    }));
  }

  async respond(reviewId: string, response: string) {
    const { error } = await this.db.rpc('respond_to_review', {
      p_review_id: reviewId,
      p_response: response,
    });
    if (error) throw Errors.validation(error.message);
    return { ok: true };
  }

  async deleteOwn(reviewId: string) {
    const { error } = await this.db.from('reviews').delete().eq('id', reviewId);
    if (error) throw Errors.validation(error.message);
    return { id: reviewId };
  }

  /** Reviews across all of an owner's listings — the owner feedback view. */
  async listForOwner(ownerId: string) {
    const { data, error } = await this.db
      .from('reviews')
      .select('id,rating,body,created_at,businesses!inner(id,name,owner_id)')
      .eq('businesses.owner_id', ownerId)
      .order('created_at', { ascending: false });
    if (error) throw Errors.validation(error.message);
    return (data ?? []).map((r) => {
      const rel = r.businesses as unknown;
      const biz = (Array.isArray(rel) ? rel[0] : rel) as { id: string; name: string } | null;
      return {
        id: r.id as string,
        rating: r.rating as number,
        body: (r.body as string | null) ?? null,
        createdAt: r.created_at as string,
        businessId: biz?.id ?? '',
        businessName: biz?.name ?? '',
      };
    });
  }

  async report(reporterId: string, input: CreateReport) {
    const { error } = await this.db.from('content_reports').insert({
      reporter_id: reporterId,
      target_type: input.targetType,
      target_id: input.targetId,
      reason: input.reason,
    });
    if (error) throw Errors.validation(error.message);
    return { ok: true };
  }
}
