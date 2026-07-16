# NearBite
### A Trusted, Always-Updated Local Food Discovery Platform

**Product Requirements Document (PRD)**
Version 1.0 | Draft for Review
Prepared by: Product Team
Date: July 3, 2026

---

## Document Control

| Field | Detail |
|---|---|
| Product Name (working title) | NearBite (placeholder — subject to branding) |
| Document Owner | Product Owner |
| Status | Draft v1.0 — pending stakeholder review |
| Last Updated | July 3, 2026 |
| Distribution | Founders, Design, Engineering, QA |

### Revision History

| Version | Date | Author | Summary |
|---|---|---|---|
| 0.1 | Jul 3, 2026 | Product Owner | Initial draft based on founder interview |

---

## 1. Executive Summary

NearBite is a mobile and web platform that lets restaurants, cafes, hotels, and food shops create and maintain their own verified online presence — menus, prices, photos, and live status — so that people searching for a place to eat get accurate, current information in one trusted place, instead of scattered, outdated results across Google Images, Facebook groups, and word of mouth.

The idea originated from a first-hand frustration: a group of college students traveling out of town struggled to find a trustworthy place for lunch because Google listings showed stale prices and photos, and relevant Facebook groups were fragmented and hard to search. NearBite solves this by putting the update responsibility directly in the hands of the business owners, with admin verification to maintain trust.

The MVP will launch as a single-city pilot in Sri Lanka, food-and-beverage businesses only, free to use, with no login required to browse and login only required to review or save favorites. Every business listing is manually approved by an admin before it goes live. The pilot serves both local residents making everyday meal decisions and travelers/visitors unfamiliar with the area, and the app will support English, Sinhala, and Tamil from launch. A development team is already in place and a moderate funding budget is available for the MVP build; no direct competitor has been identified in the target market to date, which strengthens the case for moving quickly.

---

## 2. Background & Problem Statement

### 2.1 The Problem

- Search engines (Google) frequently show outdated prices, menus, and photos for small food businesses, since owners rarely update their Google Business listings.
- Facebook groups with local recommendations are unstructured, hard to search, and buried in unrelated posts — there is no reliable way to filter by cuisine, price, or location.
- Travelers, students, and newcomers to an area have no single trusted source to quickly find a place to eat that matches their budget, dietary needs, and current availability.
- Small food businesses have no easy, low-cost way to maintain an accurate online presence — they are dependent on third-party platforms they don't control.

### 2.2 Why Now

Smartphone and mobile data penetration make it easy for small business owners to self-manage a lightweight online profile, and there is no dominant, trusted, owner-maintained local food directory in the target market today. A single-city pilot lets us validate the core loop — owners keep listings fresh, users trust and return — before expanding.

---

## 3. Product Vision & Objectives

### 3.1 Vision Statement

*To become the most trusted place to discover where to eat — built on real-time information maintained by the businesses themselves, not stale third-party data.*

### 3.2 Objectives (MVP)

1. Give users a fast, filterable way to find nearby food businesses with accurate menus, prices, and photos.
2. Give business owners a simple, free, self-serve way to create and keep their listing up to date.
3. Establish trust through an admin-verified onboarding process for every listing.
4. Validate the model in one pilot city before expanding geography or business categories.
5. Build the foundation (data model, admin tooling) to support future monetization and category expansion.

---

## 4. Target Users & Personas

### 4.1 Persona 1 — "Dinesh, the Diner" (Primary Consumer — Local or Visitor)

- Either a local resident deciding where to eat today, or a traveler/visitor unfamiliar with the area — both need the same accurate, filterable information.
- Frustrated by outdated Google listings and hard-to-search Facebook groups.
- Comfortable in English, Sinhala, or Tamil — expects the app to work in their preferred language.
- Wants: filter by price/cuisine/distance, see real recent photos, know if a place is currently open.

### 4.2 Persona 2 — "Amara, the Café Owner" (Business User)

- Runs a small café or eatery, has limited time and no dedicated marketing/IT staff.
- Currently relies on word of mouth and an inconsistently updated Facebook page.
- Wants: a free, quick way to post her menu and photos, and be found by nearby customers without needing technical skill.

### 4.3 Persona 3 — "Admin Moderator" (Internal User)

- Reviews and approves new business submissions to keep listings genuine and prevent spam/duplicate/fake entries.
- Needs an efficient queue, clear approval/rejection workflow, and the ability to edit or remove listings that violate guidelines.

---

## 5. Scope

### 5.1 In Scope — MVP (Phase 1)

- Single pilot city/town launch.
- Business category: food & beverage only (restaurants, cafes, hotels' dining, small food shops).
- Public browsing and search with no login required.
- Login required only to post a review/rating or save a favorite.
- Business self-serve signup to create a listing (menu, prices, photos, hours, location, offers).
- Admin manual review and approval before any listing goes live; admin can also create/edit listings directly.
- Search & filter by cuisine, price range, distance, and dietary tag (veg/non-veg).
- Live status indicator (open/closed, busy) settable by the business owner.
- Ratings & reviews from logged-in users.
- Owner-posted offers/promotions on their listing.
- Mobile app (iOS & Android) and responsive web app, sharing one backend.
- Trilingual UI: English, Sinhala, and Tamil, selectable at launch.
- Serves both local residents and travelers/visitors as equally weighted target users.

### 5.2 Out of Scope — MVP (Deferred to later phases)

- Categories beyond food & beverage (retail, services, etc.).
- In-app ordering, table booking, or payments.
- Paid/featured listings or any monetization mechanism (see Section 12 — Open Question).
- Multi-city or multi-country expansion.
- Automated fraud detection / AI-based content moderation (manual admin review only for MVP).
- Loyalty programs, push-notification marketing campaigns.

---

## 6. Assumptions & Constraints

### 6.1 Assumptions

- Business owners are willing to spend a few minutes creating and periodically updating their listing at no cost during the pilot.
- A single admin/small moderation team is sufficient to review listing submissions at pilot-city volume.
- Target users have smartphones with data connectivity and are comfortable using a mobile/web app instead of Facebook/Google.
- Location services (GPS) are available and permitted by the user for distance-based search.

### 6.2 Constraints

- A development team is already available for the build; MVP scope in Section 5.1 is sized to fit a moderate, funded (but not unlimited) budget rather than a bootstrapped one — allowing native-quality mobile apps and trilingual support at launch without requiring Phase 2 deferral.
- No dedicated content-moderation team beyond a small admin group at launch.
- Monetization model is not yet decided; MVP must be built so a pricing/monetization layer can be added later without a rebuild (see Section 12).
- Trilingual content (English/Sinhala/Tamil) adds translation and testing overhead for both the app UI and, where feasible, owner-submitted content (menus, descriptions).

---

## 7. User Stories

### 7.1 Consumer (Diner)

- As a user, I want to search for food places near me without logging in, so I can quickly decide where to eat.
- As a user, I want to filter results by cuisine, price range, distance, and veg/non-veg, so I can find options that match my needs.
- As a user, I want to see a business's current menu, prices, and recent photos, so I can trust the information before I go.
- As a user, I want to see whether a place is currently open or busy, so I don't waste a trip.
- As a user, I want to read ratings and reviews from other users, so I can judge quality before visiting.
- As a user, I want to log in to leave a review or save a favorite place, so I can contribute and revisit easily.
- As a user, I want to see current offers/promotions from a business, so I can find good deals.

### 7.2 Business Owner

- As a business owner, I want to create a free listing for my shop/café/hotel, so customers can find me.
- As a business owner, I want to upload and update my menu, prices, and photos anytime, so my listing always reflects reality.
- As a business owner, I want to set my live status (open/closed/busy) so customers have accurate expectations.
- As a business owner, I want to post a limited-time offer, so I can attract more customers.
- As a business owner, I want to know the status of my listing submission (pending/approved/rejected), so I know when I'm visible to customers.

### 7.3 Admin

- As an admin, I want to review pending listing submissions in a queue, so I can approve genuine businesses and reject spam or duplicates.
- As an admin, I want to edit or remove any listing that violates guidelines or contains false information.
- As an admin, I want to directly create a listing on behalf of a business that requests manual onboarding.
- As an admin, I want to moderate reported reviews, so the platform stays trustworthy.

---

## 8. Functional Requirements

Priority uses MoSCoW: **Must** have, **Should** have, **Could** have, **Won't** have this phase.

### 8.1 Business Onboarding & Profile Management

| ID | Requirement | Priority |
|---|---|---|
| FR-1.1 | Business owner can sign up and create a business account (name, category, contact, location). | Must |
| FR-1.2 | Business owner can create a listing with: name, description, address/map pin, hours of operation, contact details. | Must |
| FR-1.3 | Business owner can upload a menu with item names and prices. | Must |
| FR-1.4 | Business owner can upload photos of food and venue (multiple images). | Must |
| FR-1.5 | Business owner can set/update live status: Open, Closed, Busy. | Must |
| FR-1.6 | Business owner can create, edit, and expire a promotional offer post. | Must |
| FR-1.7 | Business owner can view the approval status of their listing (Pending / Approved / Rejected with reason). | Must |
| FR-1.8 | Business owner can edit an already-approved listing; edits may re-enter review queue if flagged as major changes. | Should |
| FR-1.9 | System sends a notification/email to the owner when listing status changes. | Should |

### 8.2 Admin & Moderation

| ID | Requirement | Priority |
|---|---|---|
| FR-2.1 | Admin can view a queue of pending listing submissions. | Must |
| FR-2.2 | Admin can approve or reject a submission, with a mandatory reason for rejection. | Must |
| FR-2.3 | Admin can directly create, edit, or deactivate any business listing. | Must |
| FR-2.4 | Admin can view and moderate flagged/reported reviews. | Must |
| FR-2.5 | Admin can search and filter all listings by status, category, and city. | Should |
| FR-2.6 | Admin actions are logged (audit trail) for accountability. | Should |

### 8.3 Search & Discovery (Consumer)

| ID | Requirement | Priority |
|---|---|---|
| FR-3.1 | User can browse and search listings without creating an account. | Must |
| FR-3.2 | User can search by keyword (business name, dish, cuisine). | Must |
| FR-3.3 | User can filter results by cuisine type, price range, distance, and veg/non-veg. | Must |
| FR-3.4 | User can view a listing's detail page: menu, prices, photos, hours, live status, offers, ratings. | Must |
| FR-3.5 | User can view results on a map as well as a list. | Should |
| FR-3.6 | User can sort results by distance, rating, or price. | Should |
| FR-3.7 | Search results reflect the business's current live status (open/closed/busy). | Must |

### 8.4 Accounts, Ratings & Reviews (Consumer)

| ID | Requirement | Priority |
|---|---|---|
| FR-4.1 | User can create an account / log in (required only to review or save). | Must |
| FR-4.2 | Logged-in user can submit a star rating and written review for a listing. | Must |
| FR-4.3 | Logged-in user can save a listing to a favorites/wishlist. | Should |
| FR-4.4 | User can report a review or listing as inaccurate, spam, or offensive. | Must |
| FR-4.5 | Average rating is displayed and recalculated as new reviews are added. | Must |

### 8.5 Notifications

| ID | Requirement | Priority |
|---|---|---|
| FR-5.1 | Business owner receives notification of listing approval/rejection. | Must |
| FR-5.2 | Business owner receives notification of a new review on their listing. | Could |
| FR-5.3 | User can optionally receive notification when a saved favorite posts a new offer. | Could |

---

## 9. Non-Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| NFR-1 | Platform must be available on both iOS/Android (native or cross-platform) and a responsive web app, sharing one backend and data source. | Must |
| NFR-2 | Search results should return within 2 seconds under normal load for a pilot-city user base. | Must |
| NFR-3 | System should support at least 500 concurrent users and 2,000 listings without degradation during pilot. | Should |
| NFR-4 | All user and business data must be stored securely; passwords hashed; HTTPS enforced end-to-end. | Must |
| NFR-5 | Photo uploads must be compressed/optimized for fast loading on mobile data connections. | Must |
| NFR-6 | Admin approval workflow should allow a decision to be made in under 2 minutes per submission (efficient UI). | Should |
| NFR-7 | App should be usable by non-technical business owners with minimal onboarding friction (no tutorial required for core tasks). | Must |
| NFR-8 | System should maintain 99.5% uptime post-launch. | Should |
| NFR-9 | Design must support adding new cities/categories later without a schema rebuild. | Should |
| NFR-10 | Application should comply with local data protection expectations for storing user reviews and business contact information. | Must |
| NFR-11 | All consumer-facing UI text must be available in English, Sinhala, and Tamil, with a persistent language switcher. | Must |
| NFR-12 | Business owners should be able to enter menu/description text in their preferred language; system should not force translation for MVP. | Should |

---

## 10. Information Architecture — Key Screens

### 10.1 Consumer App/Web

- Home / Search (location-aware, filter bar)
- Search Results (list + map toggle)
- Business Detail Page (menu, photos, hours, live status, offers, reviews)
- Login / Sign-up (triggered on review/save action)
- My Favorites
- Write a Review

### 10.2 Business Owner Portal

- Business Sign-up & Onboarding Form
- Listing Dashboard (status, edit menu/photos/hours)
- Live Status Toggle
- Offers/Promotions Manager
- Reviews Received (read-only for MVP)

### 10.3 Admin Panel

- Pending Submissions Queue
- Listing Management (search/edit/deactivate)
- Reported Content Queue
- Basic Analytics Dashboard (listings count, pending count, active users) — Should have

---

## 11. Key Data Entities (High-Level)

| Entity | Key Attributes |
|---|---|
| Business Listing | Name, category, description, address/geo-coordinates, hours, contact, status (pending/approved/rejected), live status, created/updated timestamps |
| Menu Item | Name, price, category/tag (e.g., veg/non-veg), photo, listing ID |
| Photo | Image file, listing ID, uploaded-by, timestamp |
| Offer/Promotion | Title, description, start/end date, listing ID |
| User Account | Name, contact/email, password hash, saved favorites, review history |
| Review | Rating (1–5), text, user ID, listing ID, timestamp, reported flag |
| Admin Action Log | Admin ID, action type, target listing/review, timestamp, reason |

---

## 12. Monetization Strategy — Open Question

Monetization is intentionally undecided for the MVP so the pilot can focus on proving the trust/freshness value proposition first. The data model and admin tooling should be built to support the following options later without rework:

- **Freemium:** free basic listing; paid tier for featured placement, extra photos, or promoted offers.
- **Commission-based:** transaction fee if in-app ordering/booking is introduced in a later phase.
- **Advertising:** sponsored placement in search results (kept clearly labeled to preserve user trust).

**Recommendation:** revisit this decision after the pilot city shows sustained business sign-ups and repeat consumer usage (see Section 13 KPIs), so pricing is informed by real adoption data rather than assumptions.

---

## 13. Success Metrics / KPIs

| Metric | MVP Target (first 3 months, pilot city) |
|---|---|
| Business listings created | ≥ 150 approved listings |
| Listing freshness | ≥ 60% of listings updated at least once in the last 30 days |
| Weekly active consumer users | ≥ 1,000 |
| Search-to-view conversion | ≥ 40% of searches result in a listing detail view |
| Reviews submitted | ≥ 300 total reviews |
| Admin approval turnaround | ≤ 24 hours average |
| User-reported inaccurate listings | < 5% of active listings |

---

## 13a. Competitive Landscape & Go-to-Market

### 13a.1 Competitive Landscape

No direct competitor — an owner-maintained, trust-verified, trilingual food discovery platform for this market — has been identified at this time. This is a favorable but time-limited window: it lowers the pressure to differentiate on features and raises the priority of moving quickly through the pilot, since the absence of a competitor today does not guarantee it stays that way. It is recommended that the team re-check the landscape immediately before pilot launch and again after Phase 1, since informal alternatives (Facebook groups, Google Maps/Business, word of mouth) remain the real competition to displace.

### 13a.2 Go-to-Market — Business Acquisition (Supply Side)

Business sign-up will be driven by two parallel tracks, since supply (approved, fresh listings) must exist before consumer demand can be tested:

- **In-person outreach:** the founding/admin team directly visits target businesses in the pilot city to explain the platform, assist with first-listing creation, and answer the "what's in it for me" question face to face — important for owners with low digital confidence.
- **Online/social campaign:** targeted social media and online outreach aimed at business owners (not just consumers) to drive self-serve sign-ups in parallel with in-person efforts.
- **Recommended sequencing:** use in-person outreach to seed the first 50–100 quality listings before public consumer launch (see Section 14 risk mitigation on chicken-and-egg supply), then layer the online campaign to sustain growth afterward.

### 13a.3 Go-to-Market — Consumer Adoption (Demand Side)

- Since the pilot targets both locals and travelers equally, early marketing should test messaging for both: "always know what's actually on the menu" for locals, and "never guess where to eat again" for travelers/visitors.
- Trilingual support should be highlighted in marketing as a trust signal, particularly for reaching audiences underserved by English-only alternatives.

---

## 14. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Business owners sign up but don't keep listings updated (same problem as Google/Facebook). | Send periodic reminders; display a "last updated" badge on listings; consider light gamification/recognition for active owners. |
| Low initial supply of listings makes the app unattractive to consumers (chicken-and-egg problem). | Admin team proactively onboards well-known local businesses in the pilot city before public launch. |
| Manual admin approval doesn't scale as submissions grow. | Track approval turnaround KPI; plan semi-automated checks (duplicate detection, required-field validation) for Phase 2. |
| Fake or manipulated reviews undermine trust. | Require login for reviews; allow reporting; admin moderation queue; consider one-review-per-user-per-listing rule. |
| Users default back to Google/Facebook out of habit. | Focus pilot marketing on the specific pain point (accuracy) and target high-intent groups (students, travelers, new residents). |

---

## 15. Release Plan / Roadmap

### Phase 1 — MVP Pilot (Single City, Food & Beverage Only)

Scope as defined in Section 5.1. Goal: prove that owner-maintained listings stay fresher than Google/Facebook and that users trust and return to the app.

### Phase 2 — Optimize & Expand Within City

- Introduce lightweight monetization based on pilot learnings (Section 12).
- Add semi-automated moderation checks to reduce admin load.
- Add map-based discovery improvements and sorting options.

### Phase 3 — Geographic & Category Expansion

- Expand to additional cities.
- Expand beyond food & beverage to other local business categories.
- Explore booking/ordering integrations if validated by demand.

---

## 16. Recommended Next Steps

With a development team already in place and a moderate budget confirmed, the main remaining risk is design/adoption validation, not resourcing. The recommended path is:

1. **UX Discovery & Wireframes (1–2 weeks):** Low-fidelity wireframes for the core flows — search/filter, business detail page, owner onboarding, admin approval queue — to validate usability before committing engineering time.
2. **Clickable Prototype Review:** Walk through the prototype with a handful of target users (students/travelers) and 3–5 candidate business owners to sanity-check the onboarding flow specifically, since owner adoption is the platform's biggest risk.
3. **Dev-Ready Specification:** Convert validated wireframes into detailed screen-by-screen specs and API contracts for engineering.
4. **Build MVP:** Prioritize Must-have requirements from Section 8; defer Should/Could items if timeline is tight.
5. **Pilot Launch:** Onboard an initial seed set of businesses manually (Section 14 mitigation) before public consumer launch.

This sequencing exists because the two biggest unknowns — will business owners bother to keep listings updated, and will users trust a new, unfamiliar app over Google/Facebook — are both validated more cheaply through design review and a small pilot than by building the full feature set first.

---

## 17. Open Questions for Stakeholders

- Which specific city/town will be the pilot location?
- Who will staff admin moderation during the pilot, and what is their expected daily capacity?
- What monetization model (Section 12) should be planned for post-pilot, even if not built into MVP?
- What is the target timeline for MVP delivery, given the dev team is already available and a moderate budget is confirmed?
- Should trilingual support extend to owner-submitted content (menus/descriptions) at launch, or is UI-only translation sufficient for Phase 1?

---

## 18. Appendix — Glossary

| Term | Definition |
|---|---|
| MVP | Minimum Viable Product — the smallest feature set needed to validate the core value proposition. |
| Listing | A business's profile page on the platform (menu, photos, hours, etc.). |
| Live Status | Owner-controlled indicator showing whether a business is currently Open, Closed, or Busy. |
| MoSCoW | Prioritization method: Must have, Should have, Could have, Won't have (this phase). |
| Pilot City | The single initial city/town chosen for the MVP launch. |
