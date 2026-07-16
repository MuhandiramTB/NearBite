import { z } from 'zod';

/** Request a signed upload URL (API §6, step 1). */
export const UploadUrlRequest = z.object({
  filename: z.string().min(1).max(200),
});
export type UploadUrlRequest = z.infer<typeof UploadUrlRequest>;

export const UploadUrlResponse = z.object({
  path: z.string(),
  token: z.string(),
  signedUrl: z.string(),
});
export type UploadUrlResponse = z.infer<typeof UploadUrlResponse>;

/** Register an uploaded object (API §6, step 3). */
export const RegisterPhoto = z.object({
  storagePath: z.string().min(1),
  kind: z.enum(['venue', 'food', 'menu']).default('venue'),
});
export type RegisterPhoto = z.infer<typeof RegisterPhoto>;
