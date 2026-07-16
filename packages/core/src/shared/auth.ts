import type { UserRole } from '@nearbite/contracts';
import { Errors } from './errors.js';

/**
 * The authenticated actor for a request, resolved from the Supabase JWT +
 * profiles.role by the handler layer. `null` userId = anonymous.
 *
 * These guards are the FIRST of the two security layers (API §1); Postgres
 * RLS is the second and authoritative one. Guards give fast, clear 401/403s.
 */
export interface Actor {
  userId: string | null;
  role: UserRole | null;
}

export const anonymous: Actor = { userId: null, role: null };

export function requireAuth(actor: Actor): asserts actor is Actor & { userId: string } {
  if (!actor.userId) throw Errors.unauthenticated();
}

export function requireRole(actor: Actor, ...roles: UserRole[]): void {
  requireAuth(actor);
  if (!actor.role || !roles.includes(actor.role)) {
    throw Errors.forbidden(`Requires role: ${roles.join(' or ')}`);
  }
}

export const requireOwner = (actor: Actor) => requireRole(actor, 'owner', 'admin');
export const requireAdmin = (actor: Actor) => requireRole(actor, 'admin');
