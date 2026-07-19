import { z } from 'zod';

/** Query params for GET /businesses (API §4 SearchQuery).
 *  z.coerce because query-string values arrive as strings. */
export const SearchQuery = z.object({
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  radiusM: z.coerce.number().max(50000).default(5000),
  cityId: z.string().uuid(),
  q: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  maxPriceTier: z.coerce.number().int().min(1).max(4).optional(),
  vegOnly: z.coerce.boolean().default(false),
  openNow: z.coerce.boolean().default(false),
  // Rich-attribute filters (comma-separated in the query string → arrays).
  facilities: z
    .string()
    .optional()
    .transform((s) => (s ? s.split(',').filter(Boolean) : undefined)),
  visitPurposes: z
    .string()
    .optional()
    .transform((s) => (s ? s.split(',').filter(Boolean) : undefined)),
  convenience: z
    .string()
    .optional()
    .transform((s) => (s ? s.split(',').filter(Boolean) : undefined)),
  minRating: z.coerce.number().min(0).max(5).optional(),
  sort: z.enum(['distance', 'rating', 'price']).default('distance'),
  limit: z.coerce.number().int().max(50).default(20),
  cursor: z.string().optional(),
});
export type SearchQuery = z.infer<typeof SearchQuery>;
