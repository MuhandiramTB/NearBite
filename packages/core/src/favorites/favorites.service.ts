import type { Actor } from '../shared/auth';
import { requireAuth } from '../shared/auth';
import type { FavoritesRepository } from './favorites.repository';

/** Favorites logic — logged-in only (FR-4.3). */
export class FavoritesService {
  constructor(private readonly repo: FavoritesRepository) {}

  async save(actor: Actor, businessId: string) {
    requireAuth(actor);
    return this.repo.add(actor.userId, businessId);
  }

  async unsave(actor: Actor, businessId: string) {
    requireAuth(actor);
    return this.repo.remove(actor.userId, businessId);
  }

  async list(actor: Actor) {
    requireAuth(actor);
    return this.repo.listForUser(actor.userId);
  }
}
