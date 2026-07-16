import type { CreateBusiness, SetLiveStatus, UpdateBusiness } from '@nearbite/contracts';
import type { Actor } from '../shared/auth';
import { requireOwner } from '../shared/auth';
import { Errors } from '../shared/errors';
import type { ListingsRepository } from './listings.repository';

/**
 * Listings business logic. Pure and transport-agnostic (foundation E §3):
 * no HTTP, no SQL. Unit-testable by mocking the repository.
 *
 * Note on defense-in-depth: RLS already enforces ownership at the DB. These
 * service checks are the fast first layer and make intent explicit.
 */
export class ListingsService {
  constructor(private readonly repo: ListingsRepository) {}

  async createListing(actor: Actor, input: CreateBusiness) {
    requireOwner(actor);
    // Owner id is taken from auth.uid() inside the create_business RPC.
    return this.repo.create(input);
  }

  async listMine(actor: Actor) {
    requireOwner(actor);
    return this.repo.findByOwner(actor.userId as string);
  }

  async setLiveStatus(actor: Actor, id: string, input: SetLiveStatus) {
    requireOwner(actor);
    const owned = await this.repo.findOwnedById(actor.userId as string, id);
    if (!owned) throw Errors.notFound('Listing not found');
    return this.repo.setLiveStatus(id, input.live);
  }

  async updateListing(actor: Actor, id: string, input: UpdateBusiness) {
    requireOwner(actor);
    const owned = await this.repo.findOwnedById(actor.userId as string, id);
    if (!owned) {
      // Either doesn't exist or isn't theirs — don't leak which.
      throw Errors.notFound('Listing not found');
    }
    const updated = await this.repo.update(id, input);
    if (!updated) throw Errors.notFound('Listing not found');
    return updated;
  }
}
