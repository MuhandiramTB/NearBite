import type { Actor } from '../shared/auth';
import { requireOwner } from '../shared/auth';
import { Errors } from '../shared/errors';
import type { MediaRepository } from './media.repository';

const ALLOWED_KINDS = ['venue', 'food', 'menu'] as const;
type PhotoKind = (typeof ALLOWED_KINDS)[number];

/** Photo lifecycle logic. Owner/admin only. */
export class MediaService {
  constructor(private readonly repo: MediaRepository) {}

  async getUploadUrl(actor: Actor, businessId: string, filename: string) {
    requireOwner(actor);
    await this.repo.assertCanWrite(businessId);
    // Sanitize the filename to a safe key; keep the extension.
    const ext = filename.includes('.') ? filename.split('.').pop() : 'jpg';
    const safe = `${Date.now()}-${Math.round(cryptoRandom() * 1e6)}.${ext}`;
    return this.repo.createUploadUrl(businessId, safe);
  }

  async register(actor: Actor, businessId: string, storagePath: string, kind: string) {
    requireOwner(actor);
    if (!ALLOWED_KINDS.includes(kind as PhotoKind)) {
      throw Errors.validation(`kind must be one of ${ALLOWED_KINDS.join(', ')}`);
    }
    await this.repo.assertCanWrite(businessId);
    return this.repo.registerPhoto(businessId, storagePath, kind, actor.userId as string);
  }

  async remove(actor: Actor, photoId: string) {
    requireOwner(actor);
    // RLS photo_write ensures only owner/admin can actually delete.
    return this.repo.deletePhoto(photoId);
  }
}

// Small deterministic-ish randomness without Node crypto types in core.
function cryptoRandom(): number {
  // Math.random is fine for a filename suffix (not security-sensitive).
  return Math.random();
}
