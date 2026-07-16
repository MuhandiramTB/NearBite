# NearBite — Food Discovery & Restaurant Recommendation Platform

## 📌 Overview

NearBite is a food discovery and restaurant recommendation platform that helps users
find the best places to eat based on their location, budget, food preferences, visit
purpose, and required facilities.

The platform provides verified restaurant information including menus, prices, photos,
reviews, ratings, opening hours, facilities, and services. Users can easily discover
restaurants, cafes, hotels, and food shops through smart search and filtering options.

The goal is a trusted food ecosystem where customers make better dining decisions while
businesses maintain an always-fresh online presence — freshness maintained by the owners
themselves, verified by admins.

> **Pilot scope:** single-city Sri Lanka launch, trilingual (English / Sinhala / Tamil),
> free to use. Full product PRD: [`NearBite_PRD (1).md`](./NearBite_PRD%20(1).md).

---

## 🚦 Implementation status (as of this build)

The **core trust loop is complete and verified end-to-end** against a live database.
The wider vision below is the target; this table is the honest current state.

| Area | Status |
|---|---|
| Owner creates listing → admin approves → goes live | ✅ Done |
| Geo search (near-me radius) + filters (cuisine, price, veg, open-now) + distance sort | ✅ Done |
| Listing detail: menu, prices, photos, hours, offers, live status | ✅ Done |
| Reviews (text + star rating, 1 per user), average auto-rollup | ✅ Done |
| Favorites (private per user) | ✅ Done |
| Owner "Reviews received" feedback inbox | ✅ Done |
| Live status (Open / Busy / Closed) + "last updated" freshness badge | ✅ Done |
| Photo upload (signed direct-to-storage) | ✅ API done · ⏳ owner upload UI pending |
| Offers / promotions | ✅ API + schema · ⏳ UI pending |
| Admin approval queue + audit log | ✅ Done · ⏳ report-moderation UI pending |
| **Owner responds to reviews** | ⏳ Planned |
| **Facilities** (AC, parking, WiFi, rooftop, sea view, kids area, accessibility…) | ⏳ Planned (schema addition) |
| **Visit purpose** (date, family, business, photo spot…) | ⏳ Planned (schema addition) |
| **Convenience flags** (delivery, takeaway, reservation, payment types) | ⏳ Planned (schema addition) |
| **Multi-dimensional ratings** (cleanliness, service, taste, value) | ⏳ Planned |
| **Owner engagement analytics** | ⏳ Planned |
| **Admin user management + system analytics** | ⏳ Planned |
| Mobile app (Expo) | ⏳ Auth shell only; screens pending (M4) |
| AI recommendations, voice search, ordering, loyalty | 🔮 Future |

---

## 👥 User Types

**Customer / Food Finder** — search & find nearby places, filter by need, view menus &
prices, read & write reviews, upload food photos, rate, save favorites.

**Business Owner** — create restaurant profile, manage menu / prices / photos / hours /
facilities, publish offers, set live status, read customer reviews & (planned) respond,
view engagement analytics.

**Platform Administrator** — verify & approve businesses, manage categories, moderate
reviews & remove fake content, manage users & platform settings, view system analytics.

---

## 🔍 Smart Search & Filter Options (product vision)

The pilot ships **location, budget/price, food type, open-now, and rating** filters today.
The following broader set is the roadmap target:

- **📍 Location** — near me, within 1 / 5 / 10 km, city / area, popular nearby
- **💰 Budget** — under Rs.500, Rs.500–1000, Rs.1000–2000, Rs.2000+, per-person
- **🍽️ Food type** — Sri Lankan, Chinese, Indian, Italian, Japanese, Korean, fast food,
  cafe, bakery, street food, seafood, desserts, drinks
- **👥 Visit purpose** — couple date, family, friends, business, birthday, relaxing,
  photo spot, quick meal
- **🏠 Facilities** — AC, parking, WiFi, indoor/outdoor seating, rooftop, garden, sea/
  mountain view, kids play area, wheelchair accessible, washroom
- **🕒 Time** — open now, breakfast, lunch, dinner, late night, 24 hours
- **⭐ Quality** — 4.5★+, most reviewed, new, verified, recently updated, plus
  cleanliness / service / taste / value-for-money ratings
- **🍛 Experience** — spicy, healthy, buffet, unlimited, traditional, chef special, family packs
- **🚗 Convenience** — delivery, takeaway, reservation, cash/card, PickMe/Uber

---

## 🏗️ System Architecture

```
apps/
  web/        Next.js (App Router) — consumer web + owner dashboard + admin panel
              + the REST API under /api/v1     → deploys to Vercel
  mobile/     Expo (React Native) — consumer + owner + field-onboarder (in progress)
packages/
  contracts/  Zod schemas + inferred types — the shared client+server source of truth
  core/       Modular monolith — business logic by module:
              listings · search · media · reviews · favorites · admin (+ shared kernel)
  db/         Drizzle schema + migrations + policies.sql (RLS, triggers, RPCs) + seeds
  config/     Shared tsconfig + eslint (module-boundary rules)
```

**Stack:** TypeScript everywhere · Next.js · Supabase (Postgres + **PostGIS** for geo,
Auth, Storage) · Drizzle (migrations) · Row-Level Security + DB triggers enforce every
rule at the database, not just the app.

**Dependency rule:** `apps → core → db`; everything may import `contracts`; `core` never
imports `apps`; only a module's `*.repository.ts` touches the database.

---

## 🚀 Getting started

### Prerequisites
- Node ≥ 22, pnpm 11 (`npm i -g pnpm`)
- A Supabase project (enable PostGIS)

### Setup
```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local     # fill Supabase URL + keys + DB URLs

# Provision the database (schema + RLS + triggers + RPCs), then seed:
pnpm --filter @nearbite/db exec tsx src/apply.ts --reset   # tables + policies
pnpm --filter @nearbite/db exec tsx src/ensure-bucket.ts   # storage bucket
pnpm --filter @nearbite/db exec tsx src/rich-seed.ts       # demo world (users, listings, reviews)
```

### Run
```bash
pnpm --filter @nearbite/web dev        # web → http://localhost:3000
pnpm --filter @nearbite/mobile start   # mobile (Expo)
```

### Quality gates (green before every merge to main)
```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

### Demo accounts (created by the rich seed · password `Passw0rd!x`)
- Consumers: `dinesh@nearbite.test`, `sanjana@nearbite.test`, `kasun@nearbite.test`, `priya@nearbite.test`
- Owners: `amara@nearbite.test`, `nuwan@nearbite.test`, `fathima@nearbite.test`

---

## 🗺️ Roadmap

**Shipped:** M0 foundation → M1 supply core → M2 discovery → M3 freshness+media →
web UI → M5 social (reviews, favorites, owner feedback).

**Next:** rich attributes (facilities / visit-purpose / convenience / multi-rating) ·
owner review responses · offers & photo-upload UI · owner + admin analytics ·
mobile screens (M4 field onboarder) · **launch gate (≥ 50 approved listings)** · deploy.

**Future:** AI recommendations · voice search · table reservation · food-ordering
integration · loyalty points · automated fake-review detection · advertising system.

---

## 💰 Business Model

Restaurant subscription plans · featured listings · advertisement packages ·
reservation commission · promotional campaigns. (Monetization is intentionally not built
into the MVP; the data model is designed so it can be added without a rebuild.)

## 🎯 Vision

To become the most trusted food discovery platform — where anyone can easily find the
right place to eat based on their needs, preferences, and budget, backed by information
the businesses keep fresh themselves.
