import { pgEnum } from 'drizzle-orm/pg-core';

/** Postgres enums — mirror @nearbite/contracts common.ts. Add values without a rebuild. */
export const listingStatus = pgEnum('listing_status', [
  'pending',
  'approved',
  'rejected',
  'deactivated',
]);
export const liveStatus = pgEnum('live_status', ['open', 'closed', 'busy']);
export const userRole = pgEnum('user_role', ['consumer', 'owner', 'admin']);
export const reportStatus = pgEnum('report_status', ['open', 'reviewed', 'dismissed']);
