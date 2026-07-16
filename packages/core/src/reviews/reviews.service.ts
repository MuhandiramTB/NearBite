import type { CreateReport, CreateReview } from '@nearbite/contracts';
import type { Actor } from '../shared/auth';
import { requireAuth } from '../shared/auth';
import type { ReviewsRepository } from './reviews.repository';

/** Reviews + reports logic. Any logged-in user may review (FR-4.1/4.2). */
export class ReviewsService {
  constructor(private readonly repo: ReviewsRepository) {}

  async add(actor: Actor, businessId: string, authorName: string, input: CreateReview) {
    requireAuth(actor);
    return this.repo.create(businessId, actor.userId, authorName, input);
  }

  async list(businessId: string) {
    return this.repo.listForBusiness(businessId);
  }

  async remove(actor: Actor, reviewId: string) {
    requireAuth(actor);
    return this.repo.deleteOwn(reviewId); // RLS: only own review (or admin)
  }

  /** Owner reads all feedback across their listings. */
  async ownerFeedback(actor: Actor) {
    requireAuth(actor);
    return this.repo.listForOwner(actor.userId);
  }

  async report(actor: Actor, input: CreateReport) {
    requireAuth(actor);
    return this.repo.report(actor.userId, input);
  }
}
