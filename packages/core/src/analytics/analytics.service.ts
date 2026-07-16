import type { Actor } from '../shared/auth';
import { requireAdmin, requireOwner } from '../shared/auth';
import type { AnalyticsRepository } from './analytics.repository';

export class AnalyticsService {
  constructor(private readonly repo: AnalyticsRepository) {}

  async owner(actor: Actor) {
    requireOwner(actor);
    return this.repo.owner();
  }

  async admin(actor: Actor) {
    requireAdmin(actor);
    return this.repo.admin();
  }
}
