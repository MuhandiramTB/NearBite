import type { CreateOffer } from '@nearbite/contracts';
import type { Actor } from '../shared/auth';
import { requireOwner } from '../shared/auth';
import type { OffersRepository } from './offers.repository';

/** Offers logic — owner/admin only (RLS also enforces business ownership). */
export class OffersService {
  constructor(private readonly repo: OffersRepository) {}

  async create(actor: Actor, businessId: string, input: CreateOffer) {
    requireOwner(actor);
    return this.repo.create(businessId, input);
  }

  async list(actor: Actor, businessId: string) {
    requireOwner(actor);
    return this.repo.listForBusiness(businessId);
  }

  async expire(actor: Actor, offerId: string) {
    requireOwner(actor);
    return this.repo.expire(offerId);
  }
}
