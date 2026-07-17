import type { Db } from '../shared/db-port';
import { Errors } from '../shared/errors';

const BUCKET = 'business-photos';

/**
 * DB + storage access for photos. Only DB-touching file in the media module.
 *
 * Takes TWO clients: `db` (user session — RLS applies, used for ownership check
 * and photo-row writes) and `storage` (service-role — used ONLY to mint signed
 * upload URLs, matching API §6 where the server vouches for the upload after
 * verifying ownership itself). This avoids the storage-RLS insert-at-sign-time
 * limitation while keeping row writes under RLS.
 */
export class MediaRepository {
  constructor(
    private readonly db: Db,
    private readonly storageAdmin: Db,
  ) {}

  private publicUrl(path: string | null): string | null {
    if (!path) return null;
    return this.db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }

  /** Verify the caller owns (or admins) the business before we hand out an
   *  upload URL. RLS would also block a mismatched write, but we fail early. */
  async assertCanWrite(businessId: string): Promise<void> {
    const { data, error } = await this.db
      .from('businesses')
      .select('id')
      .eq('id', businessId)
      .maybeSingle();
    if (error) throw Errors.validation(error.message);
    // RLS biz_read lets owner/admin see their row; if not visible → not theirs.
    if (!data) throw Errors.forbidden('Not allowed to modify this listing');
  }

  /** Signed URL for a direct client→storage PUT. Path = {businessId}/{key}. */
  async createUploadUrl(businessId: string, filename: string) {
    const path = `${businessId}/${filename}`;
    // Mint with the service-role storage client (ownership already asserted).
    const { data, error } = await this.storageAdmin.storage
      .from(BUCKET)
      .createSignedUploadUrl(path);
    if (error) throw Errors.validation(error.message);
    return { path: data.path, token: data.token, signedUrl: data.signedUrl };
  }

  /** Register an uploaded object as a photo row (freshness trigger stamps biz). */
  async registerPhoto(businessId: string, storagePath: string, kind: string, uploadedBy: string) {
    const { data, error } = await this.db
      .from('photos')
      .insert({
        business_id: businessId,
        storage_path: storagePath,
        kind,
        uploaded_by: uploadedBy,
      })
      .select('id,storage_path,kind')
      .single();
    if (error) throw Errors.validation(error.message);
    // Touch the parent so the freshness badge updates (owner content changed).
    await this.db
      .from('businesses')
      .update({ last_owner_update_at: new Date().toISOString() })
      .eq('id', businessId);
    return data;
  }

  async listPhotos(businessId: string) {
    const { data, error } = await this.db
      .from('photos')
      .select('id,storage_path,kind,sort_order')
      .eq('business_id', businessId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) throw Errors.validation(error.message);
    return (data ?? []).map((p) => ({
      id: p.id as string,
      url: this.publicUrl(p.storage_path as string),
      kind: (p.kind as string) ?? 'venue',
      sortOrder: (p.sort_order as number) ?? 0,
    }));
  }

  async reorder(businessId: string, photoIds: string[]) {
    const { error } = await this.db.rpc('reorder_photos', {
      p_business_id: businessId,
      p_photo_ids: photoIds,
    });
    if (error) throw Errors.validation(error.message);
    return { ok: true };
  }

  async deletePhoto(photoId: string) {
    // Fetch path first (to remove the storage object too).
    const { data: photo, error: readErr } = await this.db
      .from('photos')
      .select('id,business_id,storage_path')
      .eq('id', photoId)
      .maybeSingle();
    if (readErr) throw Errors.validation(readErr.message);
    if (!photo) throw Errors.notFound('Photo not found');

    const { error: delErr } = await this.db.from('photos').delete().eq('id', photoId);
    if (delErr) throw Errors.validation(delErr.message);
    // Row delete is RLS-gated above; remove the file with the storage client.
    await this.storageAdmin.storage.from(BUCKET).remove([photo.storage_path as string]);
    return { id: photoId };
  }
}
