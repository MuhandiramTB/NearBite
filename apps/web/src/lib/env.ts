import { z } from 'zod';

/**
 * Validated environment. Splitting public vs server keeps the service-role
 * key out of anything the client could import (foundation §9).
 *
 * Parsing is lazy + non-fatal at module load so a build without env vars
 * (e.g. a first Vercel build) doesn't crash; missing values surface as clear
 * errors only when actually used at request time.
 */
const PublicEnv = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const ServerEnv = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  DATABASE_URL: z.string().min(1),
});

export const publicEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
};

/** Validate public env at request time (throws a clear error if unset). */
export function getPublicEnv() {
  return PublicEnv.parse(publicEnv);
}

/** Call ONLY from server code. Throws if imported where server env is absent. */
export function getServerEnv() {
  return ServerEnv.parse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
  });
}
