import type { AppError } from './errors.js';

/**
 * Lightweight Result type for flows where throwing is undesirable
 * (e.g. batch operations, validation pipelines). Services may return
 * Result<T> or throw AppError — both are supported; pick per use.
 */
export type Result<T, E = AppError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });
