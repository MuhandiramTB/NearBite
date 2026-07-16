import { z } from 'zod';

/** Admin approve/reject (API §4 Decision). Reject requires a reason (FR-2.2). */
export const AdminDecision = z.discriminatedUnion('action', [
  z.object({ action: z.literal('approve') }),
  z.object({ action: z.literal('reject'), reason: z.string().min(5) }),
]);
export type AdminDecision = z.infer<typeof AdminDecision>;

export const ResolveReport = z.object({
  status: z.enum(['reviewed', 'dismissed']),
  action: z.enum(['remove']).optional(), // remove = delete review / deactivate listing
});
export type ResolveReport = z.infer<typeof ResolveReport>;

export const SetUserRole = z.object({
  userId: z.string().uuid(),
  role: z.enum(['consumer', 'owner', 'admin']),
});
export type SetUserRole = z.infer<typeof SetUserRole>;

export const MarkNotificationsRead = z.object({
  ids: z.array(z.string().uuid()).default([]), // empty = mark all
});
export type MarkNotificationsRead = z.infer<typeof MarkNotificationsRead>;
