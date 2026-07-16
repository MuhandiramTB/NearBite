import { z } from 'zod';

/** Create a review (API §4 CreateReview). One-per-user-per-business enforced by DB unique + RLS. */
export const CreateReview = z.object({
  rating: z.number().int().min(1).max(5),
  body: z.string().max(2000).optional(),
});
export type CreateReview = z.infer<typeof CreateReview>;

export const ReviewView = z.object({
  id: z.string().uuid(),
  rating: z.number().int(),
  body: z.string().nullable(),
  createdAt: z.string().datetime(),
  authorName: z.string().nullable(),
});
export type ReviewView = z.infer<typeof ReviewView>;

/** Report content (API §4). */
export const CreateReport = z.object({
  targetType: z.enum(['review', 'business']),
  targetId: z.string().uuid(),
  reason: z.string().min(3).max(500),
});
export type CreateReport = z.infer<typeof CreateReport>;
