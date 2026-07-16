/**
 * Typed domain errors. Services throw these; the HTTP handler layer is the
 * ONLY place that maps them to status codes (foundation E §3/§4).
 * This keeps business logic transport-agnostic and testable.
 */

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'BUSINESS_RULE'
  | 'INTERNAL';

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const Errors = {
  validation: (message: string, details?: Record<string, unknown>) =>
    new AppError('VALIDATION_ERROR', message, details),
  unauthenticated: (message = 'Authentication required') =>
    new AppError('UNAUTHENTICATED', message),
  forbidden: (message = 'Not allowed') => new AppError('FORBIDDEN', message),
  notFound: (message = 'Not found') => new AppError('NOT_FOUND', message),
  conflict: (message: string, details?: Record<string, unknown>) =>
    new AppError('CONFLICT', message, details),
  businessRule: (message: string) => new AppError('BUSINESS_RULE', message),
} as const;

/** Maps a domain error code to an HTTP status (used once, in the handler layer). */
export const HTTP_STATUS: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  BUSINESS_RULE: 422,
  INTERNAL: 500,
};
