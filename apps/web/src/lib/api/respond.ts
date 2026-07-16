import { NextResponse } from 'next/server';
import { AppError, HTTP_STATUS } from '@nearbite/core';
import { ZodError } from 'zod';

/**
 * The single place that maps domain outcomes to HTTP (foundation E §3).
 * Handlers call `handle(() => service.x())` and never touch status codes.
 */
export async function handle<T>(fn: () => Promise<T>, okStatus = 200) {
  try {
    const value = await fn();
    return NextResponse.json(value, { status: okStatus });
  } catch (e) {
    if (e instanceof ZodError) {
      return errorResponse('VALIDATION_ERROR', 'Invalid request', 400, {
        issues: e.flatten(),
      });
    }
    if (e instanceof AppError) {
      return errorResponse(e.code, e.message, HTTP_STATUS[e.code], e.details);
    }
    // Unknown — don't leak internals.
    console.error('Unhandled error:', e);
    return errorResponse('INTERNAL', 'Something went wrong', 500);
  }
}

function errorResponse(
  code: string,
  message: string,
  status: number,
  details?: Record<string, unknown>,
) {
  return NextResponse.json({ error: { code, message, details } }, { status });
}
