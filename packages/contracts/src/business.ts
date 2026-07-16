import { z } from 'zod';
import { Locale, LiveStatus } from './common';

/** Lean list-item payload returned by search (API §4 BusinessCard). */
export const BusinessCard = z.object({
  id: z.string().uuid(),
  name: z.string(),
  categorySlug: z.string().nullable(),
  priceTier: z.number().int().min(1).max(4),
  avgRating: z.number(),
  reviewCount: z.number().int(),
  live: LiveStatus,
  distanceM: z.number(),
  thumbnailUrl: z.string().url().nullable(),
  lastUpdatedAt: z.string().datetime(), // drives the freshness badge
});
export type BusinessCard = z.infer<typeof BusinessCard>;

const Hour = z.object({
  weekday: z.number().int().min(0).max(6),
  open: z.string().nullable(),
  close: z.string().nullable(),
  isClosed: z.boolean(),
});

const MenuItemView = z.object({
  id: z.string().uuid(),
  name: z.string(),
  price: z.number(),
  currency: z.string(),
  isVeg: z.boolean(),
  section: z.string().nullable(),
  photoUrl: z.string().url().nullable(),
});

const OfferView = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
});

/** Full detail page payload (API §4 BusinessDetail). */
export const BusinessDetail = BusinessCard.extend({
  description: z.string().nullable(),
  descriptionLang: Locale,
  address: z.string().nullable(),
  lat: z.number(),
  lng: z.number(),
  phone: z.string().nullable(),
  isVegFriendly: z.boolean(),
  hours: z.array(Hour),
  menu: z.array(MenuItemView),
  photos: z.array(z.object({ id: z.string().uuid(), url: z.string().url(), kind: z.string() })),
  offers: z.array(OfferView),
});
export type BusinessDetail = z.infer<typeof BusinessDetail>;

/** Owner create-listing input (API §4 CreateBusiness). Server forces status=pending. */
export const CreateBusiness = z.object({
  name: z.string().min(2).max(120),
  categoryId: z.string().uuid(),
  cityId: z.string().uuid(),
  description: z.string().max(1000).optional(),
  descriptionLang: Locale.default('en'),
  address: z.string().optional(),
  lat: z.number(),
  lng: z.number(),
  phone: z.string().optional(),
  priceTier: z.number().int().min(1).max(4),
  isVegFriendly: z.boolean().default(false),
  facilities: z.array(z.string()).default([]),
  visitPurposes: z.array(z.string()).default([]),
  convenience: z.array(z.string()).default([]),
});
export type CreateBusiness = z.infer<typeof CreateBusiness>;

/** Canonical attribute vocabularies (UI chips + validation reference). */
export const FACILITIES = [
  'ac', 'parking', 'wifi', 'outdoor_seating', 'indoor_seating', 'rooftop',
  'garden', 'sea_view', 'mountain_view', 'kids_area', 'wheelchair', 'washroom',
] as const;
export const VISIT_PURPOSES = [
  'date', 'family', 'friends', 'business', 'birthday', 'relaxing', 'photo_spot', 'quick_meal',
] as const;
export const CONVENIENCE = [
  'delivery', 'takeaway', 'reservation', 'cash', 'card', 'pickme_uber',
] as const;

/** Partial edit; same shape, all optional. Major edits re-queue (FR-1.8, enforced server-side). */
export const UpdateBusiness = CreateBusiness.partial();
export type UpdateBusiness = z.infer<typeof UpdateBusiness>;

export const SetLiveStatus = z.object({ live: LiveStatus });
export type SetLiveStatus = z.infer<typeof SetLiveStatus>;
