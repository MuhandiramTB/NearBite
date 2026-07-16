# NearBite

Trusted, always-fresh local food discovery platform. Trilingual (EN/SI/TA), single-city Sri Lanka pilot.

## Monorepo layout

```
apps/
  web/        Next.js — consumer web + admin panel + API (/api/v1)
  mobile/     Expo (React Native) — consumer + owner + field tool
packages/
  contracts/  Zod schemas + types — shared client+server truth
  core/       Modular monolith: business logic (shared kernel; modules added M1+)
  db/         Drizzle schema + migrations + policies.sql (RLS) + seed
  config/     Shared tsconfig + eslint
```

**Dependency rule:** `apps → core → db`; everything may import `contracts`. `core` never imports `apps`; only a module's `*.repository.ts` touches `db`.

## Prerequisites

- Node ≥ 22, pnpm 11 (`npm i -g pnpm`)
- A Supabase project (Postgres + PostGIS)

## Setup

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local   # fill in Supabase keys

# Database (after setting DATABASE_URL):
pnpm --filter @nearbite/db db:push             # create tables
# then apply RLS + triggers:
psql "$DATABASE_URL" -f packages/db/policies.sql
pnpm --filter @nearbite/db exec tsx src/seed.ts # seed categories + pilot city
```

## Develop

```bash
pnpm dev                          # all apps
pnpm --filter @nearbite/web dev   # web only  → http://localhost:3000
pnpm --filter @nearbite/mobile start  # mobile (Expo)
```

## Quality gates (must pass before merge to main)

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

## Roadmap

M0 foundation → **M1 supply core** (owner create + admin approve) → M2 discovery → M3 freshness+media → M4 field onboarder → **launch gate (≥50 listings)** → M5 social → M6 hardening.
