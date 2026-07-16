import { z } from 'zod';

/** Owner offer/promotion (FR-1.6). */
export const CreateOffer = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(500).optional(),
  startsAt: z.string().datetime().optional(), // defaults to now server-side
  endsAt: z.string().datetime(),
});
export type CreateOffer = z.infer<typeof CreateOffer>;
