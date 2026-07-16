import type { SearchQuery } from '@nearbite/contracts';
import { Errors } from '../shared/errors';
import type { SearchRepository } from './search.repository';

/**
 * Discovery logic. Anonymous — no auth guard (FR-3.1: browse without login).
 * Cursor is an opaque base64 of the numeric offset for MVP.
 */
export class SearchService {
  constructor(private readonly repo: SearchRepository) {}

  async search(q: SearchQuery) {
    const offset = decodeCursor(q.cursor);
    const items = await this.repo.search(q, offset);
    // If we got a full page, there may be more → emit next cursor.
    const nextCursor = items.length === q.limit ? encodeCursor(offset + q.limit) : null;
    return { data: items, nextCursor };
  }

  async detail(id: string) {
    const d = await this.repo.detail(id);
    if (!d) throw Errors.notFound('Listing not found');
    return d;
  }

  async categories() {
    return this.repo.categories();
  }
}

// Opaque-ish cursor = "o<offset>". Kept dependency-free (no Buffer/Node types).
function encodeCursor(offset: number): string {
  return `o${offset}`;
}
function decodeCursor(cursor: string | undefined): number {
  if (!cursor || !cursor.startsWith('o')) return 0;
  const n = Number(cursor.slice(1));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}
