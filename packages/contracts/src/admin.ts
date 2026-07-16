import { z } from 'zod';

/** Admin approve/reject (API §4 Decision). Reject requires a reason (FR-2.2). */
export const AdminDecision = z.discriminatedUnion('action', [
  z.object({ action: z.literal('approve') }),
  z.object({ action: z.literal('reject'), reason: z.string().min(5) }),
]);
export type AdminDecision = z.infer<typeof AdminDecision>;

export const ResolveReport = z.object({
  status: z.enum(['reviewed', 'dismissed']),
  note: z.string().max(500).optional(),
});
export type ResolveReport = z.infer<typeof ResolveReport>;
