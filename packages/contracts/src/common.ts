import { z } from 'zod';

/** Shared primitives and enums — single source of truth mirrored by the DB enums. */

export const Locale = z.enum(['en', 'si', 'ta']);
export type Locale = z.infer<typeof Locale>;

export const LiveStatus = z.enum(['open', 'closed', 'busy']);
export type LiveStatus = z.infer<typeof LiveStatus>;

export const ListingStatus = z.enum(['pending', 'approved', 'rejected', 'deactivated']);
export type ListingStatus = z.infer<typeof ListingStatus>;

export const UserRole = z.enum(['consumer', 'owner', 'admin']);
export type UserRole = z.infer<typeof UserRole>;

/** i18n bag used on reference data (e.g. categories). */
export const I18nText = z.object({
  en: z.string(),
  si: z.string().optional(),
  ta: z.string().optional(),
});
export type I18nText = z.infer<typeof I18nText>;

/** Cursor-paginated envelope used by all list endpoints. */
export function paginated<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    data: z.array(item),
    nextCursor: z.string().nullable(),
  });
}

/** Standard error envelope (API conventions §2). */
export const ApiError = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.unknown()).optional(),
  }),
});
export type ApiError = z.infer<typeof ApiError>;
