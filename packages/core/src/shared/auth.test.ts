import { describe, expect, it } from 'vitest';
import { anonymous, requireAdmin, requireAuth, requireOwner } from './auth.js';
import { AppError } from './errors.js';

describe('auth guards', () => {
  it('rejects anonymous on requireAuth', () => {
    expect(() => requireAuth(anonymous)).toThrow(AppError);
  });

  it('allows owner and admin through requireOwner', () => {
    expect(() => requireOwner({ userId: 'u1', role: 'owner' })).not.toThrow();
    expect(() => requireOwner({ userId: 'a1', role: 'admin' })).not.toThrow();
  });

  it('rejects consumer on requireOwner with FORBIDDEN', () => {
    try {
      requireOwner({ userId: 'c1', role: 'consumer' });
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(AppError);
      expect((e as AppError).code).toBe('FORBIDDEN');
    }
  });

  it('rejects non-admin on requireAdmin', () => {
    expect(() => requireAdmin({ userId: 'o1', role: 'owner' })).toThrow(AppError);
  });
});
