import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  smallint,
  text,
  time,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { listingStatus, liveStatus, reportStatus, userRole } from './enums';
import { geographyPoint } from './geography';

// NOTE: `profiles.id` references auth.users(id) (Supabase-managed). We don't
// model auth.users in Drizzle; the FK is added in the RLS/policies SQL step.

export const cities = pgTable('cities', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  country: text('country').notNull().default('LK'),
  center: geographyPoint('center'),
  isActive: boolean('is_active').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  i18n: jsonb('i18n').notNull(), // {"en":"Cafe","si":..,"ta":..}
});

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(), // == auth.users.id
  role: userRole('role').notNull().default('consumer'),
  fullName: text('full_name'),
  phone: text('phone'),
  locale: text('locale').notNull().default('en'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const businesses = pgTable(
  'businesses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerId: uuid('owner_id').references(() => profiles.id, { onDelete: 'set null' }),
    cityId: uuid('city_id')
      .notNull()
      .references(() => cities.id),
    categoryId: uuid('category_id').references(() => categories.id),
    name: text('name').notNull(),
    description: text('description'),
    descriptionLang: text('description_lang').default('en'),
    address: text('address'),
    location: geographyPoint('location').notNull(),
    phone: text('phone'),
    priceTier: smallint('price_tier'),
    isVegFriendly: boolean('is_veg_friendly').default(false),
    // Rich attributes — many-valued tags (GIN-indexed for @>/&& filtering).
    facilities: text('facilities').array().default([]), // ac, parking, wifi, rooftop, sea_view…
    visitPurposes: text('visit_purposes').array().default([]), // date, family, business, photo…
    convenience: text('convenience').array().default([]), // delivery, takeaway, reservation, card…
    status: listingStatus('status').notNull().default('pending'),
    rejectionReason: text('rejection_reason'),
    live: liveStatus('live').notNull().default('closed'),
    avgRating: numeric('avg_rating', { precision: 2, scale: 1 }).default('0'),
    // Multi-dimensional rating rollups (avg of per-review sub-scores).
    ratingFood: numeric('rating_food', { precision: 2, scale: 1 }).default('0'),
    ratingService: numeric('rating_service', { precision: 2, scale: 1 }).default('0'),
    ratingValue: numeric('rating_value', { precision: 2, scale: 1 }).default('0'),
    ratingCleanliness: numeric('rating_cleanliness', { precision: 2, scale: 1 }).default('0'),
    reviewCount: integer('review_count').default(0),
    lastOwnerUpdateAt: timestamp('last_owner_update_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // GiST spatial index for radius search — the hot path.
    index('businesses_geo_idx').using('gist', t.location),
    index('businesses_status_idx').on(t.status, t.cityId),
    index('businesses_cat_idx').on(t.categoryId),
  ],
);

export const businessHours = pgTable('business_hours', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id')
    .notNull()
    .references(() => businesses.id, { onDelete: 'cascade' }),
  weekday: smallint('weekday').notNull(),
  openTime: time('open_time'),
  closeTime: time('close_time'),
  isClosed: boolean('is_closed').default(false),
});

export const photos = pgTable(
  'photos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    storagePath: text('storage_path').notNull(),
    kind: text('kind').default('venue'),
    uploadedBy: uuid('uploaded_by').references(() => profiles.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('photos_biz_idx').on(t.businessId)],
);

export const menuItems = pgTable(
  'menu_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    nameLang: text('name_lang').default('en'),
    price: numeric('price', { precision: 10, scale: 2 }).notNull(),
    currency: text('currency').notNull().default('LKR'),
    isVeg: boolean('is_veg').default(false),
    section: text('section'),
    photoId: uuid('photo_id').references(() => photos.id, { onDelete: 'set null' }),
    sortOrder: integer('sort_order').default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('menu_items_biz_idx').on(t.businessId)],
);

export const offers = pgTable(
  'offers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('offers_active_idx').on(t.businessId, t.isActive, t.endsAt)],
);

export const reviews = pgTable(
  'reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    rating: smallint('rating').notNull(),
    body: text('body'),
    authorName: text('author_name'), // denormalized display name (avoids cross-user profile RLS)
    // Optional per-dimension sub-scores (1-5); null = not rated on that axis.
    ratingFood: smallint('rating_food'),
    ratingService: smallint('rating_service'),
    ratingValue: smallint('rating_value'),
    ratingCleanliness: smallint('rating_cleanliness'),
    ownerResponse: text('owner_response'), // owner's reply to this review
    ownerRespondedAt: timestamp('owner_responded_at', { withTimezone: true }),
    isReported: boolean('is_reported').default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique('reviews_one_per_user').on(t.businessId, t.userId), // anti-fake-review
    index('reviews_biz_idx').on(t.businessId),
  ],
);

export const favorites = pgTable(
  'favorites',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.businessId] })],
);

export const contentReports = pgTable('content_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  reporterId: uuid('reporter_id').references(() => profiles.id),
  targetType: text('target_type').notNull(), // 'review' | 'business'
  targetId: uuid('target_id').notNull(),
  reason: text('reason'),
  status: reportStatus('status').notNull().default('open'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    type: text('type').notNull(), // 'listing_status' | 'new_review'
    title: text('title').notNull(),
    body: text('body'),
    link: text('link'), // e.g. /b/<id> or /owner
    isRead: boolean('is_read').default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('notifications_user_idx').on(t.userId, t.isRead)],
);

export const adminActionLog = pgTable('admin_action_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  adminId: uuid('admin_id').references(() => profiles.id),
  action: text('action').notNull(),
  targetType: text('target_type').notNull(),
  targetId: uuid('target_id').notNull(),
  reason: text('reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Re-export the raw sql tag so migration/policy scripts can use it if needed.
export { sql };
