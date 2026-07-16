import type { Actor } from '../shared/auth';
import { requireAuth } from '../shared/auth';
import type { NotificationsRepository } from './notifications.repository';

export class NotificationsService {
  constructor(private readonly repo: NotificationsRepository) {}

  async list(actor: Actor) {
    requireAuth(actor);
    return this.repo.listForUser(actor.userId);
  }

  /** Mark specific ids read, or all (empty array) for the user. */
  async markRead(actor: Actor, ids: string[]) {
    requireAuth(actor);
    return this.repo.markRead(actor.userId, ids);
  }
}
