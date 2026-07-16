import type { AdminDecision } from '@nearbite/contracts';
import type { Actor } from '../shared/auth';
import { requireAdmin } from '../shared/auth';
import { Errors } from '../shared/errors';
import type { AdminRepository } from './admin.repository';

/**
 * Admin moderation logic. Every mutation writes an audit-log row (FR-2.6).
 * requireAdmin is the fast guard; RLS + the status-guard trigger are the
 * authoritative enforcement.
 */
export class AdminService {
  constructor(private readonly repo: AdminRepository) {}

  async listSubmissions(actor: Actor) {
    requireAdmin(actor);
    return this.repo.pendingSubmissions();
  }

  async decide(actor: Actor, businessId: string, decision: AdminDecision) {
    requireAdmin(actor);

    const current = await this.repo.getStatus(businessId);
    if (!current) throw Errors.notFound('Listing not found');
    if (current.status !== 'pending') {
      throw Errors.businessRule(`Listing is already ${current.status}, cannot decide again`);
    }

    if (decision.action === 'approve') {
      const row = await this.repo.setStatus(businessId, 'approved', null);
      await this.repo.logAction(actor.userId as string, 'approve', businessId, null);
      return row;
    }

    const row = await this.repo.setStatus(businessId, 'rejected', decision.reason);
    await this.repo.logAction(actor.userId as string, 'reject', businessId, decision.reason);
    return row;
  }
}
