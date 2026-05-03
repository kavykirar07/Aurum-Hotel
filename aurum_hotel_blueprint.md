# Aurum Hotel OS — Luxury Boutique Hotel Website & Management System
### System Design Blueprint · Production Architecture v1.0

---

## TABLE OF CONTENTS

1. Product Requirements Document (PRD)
2. Application Flow & UX Logic
3. Production-Grade Tech Stack
4. Backend Schema Design
5. Implementation Roadmap
6. Performance & Security Checklist
7. Coding Agent Prompts (4-Part Series)

---

# SECTION 01 — PRODUCT REQUIREMENTS DOCUMENT

## Core User Journeys

### Guest Journey
1. Arrives via referral / SEO / direct — immersive hero captures intent
2. Browses room categories with 360° gallery + dynamic pricing badge
3. Checks real-time availability via calendar widget (edge-cached)
4. Selects add-ons: spa, transfers, F&B experiences
5. Completes 3-step PCI-DSS secure checkout with tokenized payment
6. Accesses post-booking dashboard: itinerary, requests, profile
7. Check-in via mobile key; post-stay reviews and preferences saved

### Admin Journey
1. Dashboard: occupancy heatmap, RevPAR, ADR live metrics
2. Pricing engine: set seasonal rules, demand-based overrides, blackouts
3. Inventory management: room states, maintenance blocks, overbooking buffer
4. OTA channel management: sync rates to Booking.com, Expedia via CM API
5. Guest CRM: history, preferences, VIP flags, spend analytics
6. Reports: revenue by category, source attribution, forecast models

### Concierge Journey
1. Arrivals board: today's check-ins with guest preference cards
2. Room assignment: drag-and-drop planner with upgrade suggestions
3. Service requests: dining, transport, activities — real-time queue
4. Guest messaging: in-app chat, WhatsApp integration via 360dialog
5. Housekeeping coordination: room status updates, turndown requests
6. Incident logging: complaints, resolutions, escalation tracking

---

## Critical Feature Specifications

### Dynamic Pricing Engine
Rules-based + ML-assisted engine computing the optimal nightly rate per room category in real time.

| Property | Value |
|---|---|
| Base rate source | `room_categories.base_price` |
| Modifiers | seasonal / demand / LOS / loyalty |
| Demand signal | occupancy_% + search_volume |
| Refresh cadence | 15-min batch + on-demand edge fn |
| Cache layer | Redis HASH TTL=900s |

**Features:** Rate floors, ceiling caps, competitor parity monitoring, LOS discounts

**Edge Case:** When occupancy exceeds 85%, the engine switches to demand-surge mode — pricing is recomputed every 5 minutes using a Fibonacci multiplier schedule capped at the property's rate ceiling.

> **⚠️ CRITICAL IMPLEMENTATION NOTE — Multi-Night Seasonal Pricing:** The `computeNightlyRate()` function MUST calculate rates **per night**, then sum. A query of `WHERE valid_from <= checkIn AND valid_to >= checkOut` only returns a rule covering the *entire* stay range — it silently returns no modifier for multi-night stays that span two pricing periods (e.g., normal → peak). The correct approach: for each night in `[checkIn, checkOut)`, find the highest-priority active seasonal rule for that specific date, apply its modifier, and accumulate the nightly totals. Cache the per-night breakdown individually so partial-range cache hits are possible.

---

### Multi-step Reservation Funnel
3-step wizard with persistent state, back-navigation, and abandonment recovery.

| Step | Action |
|---|---|
| Step 1 | Dates + occupancy selection |
| Step 2 | Room selection + rate display |
| Step 3 | Add-ons + guest details |
| Step 4 | Review + tokenized payment |
| Hold mechanism | Soft-lock (15 min) via Redis |

**Features:** Email recovery, promo code engine, loyalty points display

**Edge Case:** On step transitions, validate room still available. If soft-lock expires mid-funnel, surface a non-blocking toast — do not reset the form. Re-acquire lock silently if room is still free.

---

### 360° Media Gallery System
Progressive, context-aware media delivery supporting 4K stills, virtual tours, and video walkthroughs.

| Property | Value |
|---|---|
| Hero delivery | Cloudflare Images + Polish |
| 360° engine | Pannellum.js / Three.js sphere |
| Video format | HLS adaptive via Cloudflare Stream |
| AVIF/WebP | Auto-negotiated by CDN edge |
| 4K stills | Lazy-loaded, priority hints LCP |
| LCP target | < 1.8s |

---

### Guest Preferences Management
Persistent preference graph per guest profile — drives personalization, upsell targeting, and concierge briefings.

| Property | Value |
|---|---|
| Storage | JSONB in guests table |
| Dietary flags | Enum array, ML-inferred |
| Room preferences | Floor, view, pillow type, etc. |
| Communication | Email / SMS / WhatsApp |
| GDPR controls | Consent ledger + export API |

---

# SECTION 02 — APPLICATION FLOW & UX LOGIC

## Primary Booking Flow

```
Landing Page → Room Discovery → Availability Check → Add-on Upsell → Secure Checkout → Post-booking Dashboard
```

### Stage 1 — Landing Page
**Goal:** Communicate brand, capture intent, reduce bounce.

| Property | Value |
|---|---|
| Hero | Full-bleed 4K video / WebP |
| Above-fold CTA | Inline availability widget |
| SEO signals | ISR page, JSON-LD schema |
| Personalization | Returning guest greeting (cookie) |

> **Edge Function:** Geo-localized currency + language on hero CTA

---

### Stage 2 — Room Discovery
**Goal:** Drive intent to a specific category with emotional aspiration.

| Property | Value |
|---|---|
| Filters | Guests, beds, view, amenities |
| Price display | "From $X/night" — dynamic |
| Availability hint | "Only 2 left" threshold badge |
| Gallery trigger | 360° modal on card click |

> **Pre-fetch:** availability on hover (100ms debounce)

---

### Stage 3 — Real-time Availability
**Goal:** Confirm room + rate with zero uncertainty. Highest-risk step for double-booking.

| Property | Value |
|---|---|
| Availability API | `GET /api/availability?room_id&dates` |
| Cache strategy | Redis read-through, 60s TTL |
| Soft lock | `Redis SETNX key=room:date, TTL=900` |
| Conflict resolution | DB advisory lock at commit |

> **CRITICAL:** Postgres `SELECT FOR UPDATE` on inventory row prevents race conditions during high-traffic peaks.

---

### Stage 4 — Add-on Upselling
**Goal:** Increase RevPAR by 18–35% through contextual ancillary offers.

| Property | Value |
|---|---|
| Offer engine | Rule-based + guest history |
| Categories | Spa, F&B, transport, experiences |
| Pricing model | Per-person / per-night / flat |
| Cart state | Zustand store + sessionStorage |

> **Bundle logic:** "Most popular pairing for this room type" increases attach rate by ~22%

---

### Stage 5 — Secure Checkout
**Goal:** Complete payment with zero friction and full PCI-DSS compliance.

| Property | Value |
|---|---|
| Payment processor | Stripe (tokenized, SCA-ready) |
| 3DS2 | Auto-triggered for EU cards |
| Form | Stripe Elements — no card data on server |
| Idempotency | UUID per checkout attempt |
| Post-payment | Atomic: booking + inventory + email |

> **CRITICAL:** Booking commit is a DB transaction: `INSERT booking + UPDATE inventory_log + PUBLISH confirmation event` — all or nothing.

---

### Stage 6 — Post-booking Dashboard
**Goal:** Reduce anxiety, drive ancillary revenue, capture preferences pre-arrival.

| Property | Value |
|---|---|
| Route | `/dashboard/bookings/[ref]` |
| Auth | Magic link + optional password |
| Actions | Modify dates, add services, cancel |
| Pre-arrival | Preference form (T-3 day email) |
| Mobile key | Wallet-pass at T-1 day via PassKit |

---

# SECTION 03 — PRODUCTION-GRADE TECH STACK

## Frontend

| Layer | Technology | Rationale |
|---|---|---|
| Framework | Next.js 15 (App Router) | RSC + streaming SSR, ISR for room pages, PPR for availability |
| Language | TypeScript 5 | Type safety across full stack via tRPC |
| Styling | Tailwind CSS v4 + shadcn/ui | Utility-first, zero-runtime, accessible components |
| State | Zustand + React Query v5 | Local cart state + server state via tRPC |
| API layer | tRPC + Zod | End-to-end type safety, input validation at router |
| Media | Three.js + Pannellum.js | WebGL 360° sphere rendering, flat panorama fallback |
| Animation | Framer Motion | Scroll-triggered reveals, micro-interactions |
| Payments | Stripe Elements v3 | PCI-DSS SAQ-A, 3DS2 ready, Apple/Google Pay |
| Video | HLS.js | Adaptive bitrate streaming for 4K tours |

## Backend & Infrastructure

| Layer | Technology | Rationale |
|---|---|---|
| Primary DB | PostgreSQL 16 (Supabase) | ACID transactions, advisory locks, RLS, JSONB |
| Cache / Locks | Redis (Upstash Serverless) | Availability cache, soft-lock manager, rate limiter |
| Edge Functions | Cloudflare Workers | Geo-IP pricing, A/B experiments, auth token validation |
| Task Queue | BullMQ (Redis-backed) | Async: emails, pre-arrival sequences, OTA sync |
| Email | Resend + React Email | Transactional emails, DKIM-signed, React templates |
| Auth | Supabase Auth | Magic link, JWT, RLS integration |
| Secrets | Doppler | Environment secret management, rotation policies |
| Observability | Sentry + OpenTelemetry + Grafana | Error tracking, distributed tracing, metrics |

## CDN & Asset Strategy

| Asset Type | Strategy |
|---|---|
| 4K Images | Cloudflare Images — AVIF → WebP → JPEG, on-the-fly resizing, immutable cache 1yr |
| Video (Tours) | Cloudflare Stream — HLS adaptive 360p→2160p, signed JWK URLs, 1hr expiry |
| Edge Pricing | Cloudflare Workers + KV — pricing rules stored in KV, computed at edge (<5ms p99) |
| Static Assets | Vercel CDN — JS/CSS bundles, long-lived cache headers, Brotli compression |

## Extended Infrastructure (Production Additions)

| Layer | Technology | Rationale |
|---|---|---|
| Full-text Search | Typesense (self-hosted) or Algolia | Room and amenity search with faceting, typo-tolerance, instant results |
| Job Monitoring | Bull Board (BullMQ UI) | Admin-authenticated dashboard for queue depths, failed jobs, retry management |
| Feature Flags | Vercel Edge Config or LaunchDarkly | Safe progressive rollouts, kill switches, A/B variant assignment |
| A/B Testing | GrowthBook (open-source) | Pricing display experiments, funnel copy tests, statistical significance tracking |
| DB Backups | Supabase PITR + pg_dump → S3 | Belt-and-suspenders: Supabase PITR (5-min RPO) + nightly full dumps to S3 Glacier |
| CDN Cache Purge | Cloudflare Cache API (programmatic) | Explicit cache purge calls on every pricing rule save and inventory update |
| Media Upload Pipeline | Cloudflare Images Direct Upload + ClamAV | Admin uploads → virus scan → Cloudflare transform → `media_assets` table insert |
| Analytics | PostHog (self-hosted or cloud) | Guest funnel analytics, drop-off tracking, session replay — GDPR-compliant |

---

# SECTION 04 — BACKEND SCHEMA DESIGN

## Schema: rooms

```sql
CREATE TABLE rooms (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id  UUID NOT NULL REFERENCES room_categories(id),
  room_number  VARCHAR(10) UNIQUE NOT NULL,
  floor        SMALLINT NOT NULL,
  status       room_status_enum NOT NULL DEFAULT 'available',
  features     TEXT[],                    -- e.g. {ocean_view, balcony}
  metadata     JSONB,                     -- smart-lock id, IoT refs
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- room_status_enum: available | occupied | maintenance | out_of_order | blocked
```

## Schema: room_categories

```sql
CREATE TABLE room_categories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          VARCHAR(60) UNIQUE NOT NULL,
  name          VARCHAR(120) NOT NULL,
  description   TEXT,
  base_price    NUMERIC(10,2) NOT NULL CHECK (base_price > 0),
  max_occupancy SMALLINT NOT NULL,
  size_sqm      NUMERIC(6,1),
  amenities     JSONB,   -- structured feature list
  media         JSONB    -- Cloudflare image/video IDs array
);
```

## Schema: guests

```sql
CREATE TABLE guests (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email              CITEXT UNIQUE NOT NULL,
  first_name         VARCHAR(80) NOT NULL,
  last_name          VARCHAR(80) NOT NULL,
  phone              VARCHAR(20),           -- E.164 format
  nationality        CHAR(2),               -- ISO 3166-1
  loyalty_tier       loyalty_tier_enum NOT NULL DEFAULT 'standard',
  loyalty_points     INTEGER DEFAULT 0,
  preferences        JSONB,                 -- dietary, room, comms preferences
  gdpr_consent       JSONB,                 -- consent ledger + timestamps
  stripe_customer_id VARCHAR(40) UNIQUE,
  created_at         TIMESTAMPTZ DEFAULT now()
);

-- loyalty_tier_enum: standard | silver | gold | platinum | black
```

## Schema: bookings

```sql
CREATE TABLE bookings (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference             VARCHAR(12) UNIQUE NOT NULL, -- human-readable e.g. AUR-X4K9P2
  guest_id              UUID NOT NULL REFERENCES guests(id),
  room_id               UUID NOT NULL REFERENCES rooms(id),
  check_in              DATE NOT NULL,
  check_out             DATE NOT NULL CHECK (check_out > check_in),
  adults                SMALLINT DEFAULT 1,
  children              SMALLINT DEFAULT 0,
  status                booking_status_enum NOT NULL,
  total_amount          NUMERIC(12,2) NOT NULL,
  currency              CHAR(3) NOT NULL,  -- ISO 4217
  rate_snapshot         JSONB NOT NULL,    -- pricing at time of booking
  stripe_payment_intent VARCHAR(40) UNIQUE,
  source                booking_source_enum NOT NULL DEFAULT 'direct',
  special_requests      TEXT,
  created_at            TIMESTAMPTZ DEFAULT now(),

  -- CRITICAL: Prevents double-booking at the database engine level
  CONSTRAINT no_double_booking EXCLUDE USING gist (
    room_id WITH =,
    daterange(check_in, check_out, '[)') WITH &&
  ) WHERE (status NOT IN ('cancelled', 'no_show'))
);

-- booking_status_enum: pending | confirmed | checked_in | checked_out | cancelled | no_show
-- booking_source_enum: direct | ota | gds | phone | walk_in
```

## Schema: seasonal_pricing

```sql
CREATE TABLE seasonal_pricing (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id     UUID NOT NULL REFERENCES room_categories(id),
  name            VARCHAR(80) NOT NULL,     -- e.g. "Summer Peak 2025"
  valid_from      DATE NOT NULL,
  valid_to        DATE NOT NULL CHECK (valid_to > valid_from),
  price_modifier  NUMERIC(5,4) NOT NULL,   -- e.g. 1.35 = +35%
  min_los         SMALLINT DEFAULT 1,       -- minimum length of stay
  priority        SMALLINT DEFAULT 0,       -- higher value wins on rule overlap
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Overlap resolution: highest priority rule wins per category+date
-- Cached in Cloudflare KV, refreshed on every admin save
```

## Schema: inventory_log

```sql
CREATE TABLE inventory_log (
  id             BIGSERIAL PRIMARY KEY,
  room_id        UUID NOT NULL REFERENCES rooms(id),
  booking_id     UUID REFERENCES bookings(id),  -- nullable for non-booking events
  event_type     inv_event_enum NOT NULL,
  status_before  room_status_enum,
  status_after   room_status_enum,
  actor_id       UUID,                           -- guest_id or staff_id
  actor_type     VARCHAR(20),                    -- guest | staff | system
  notes          TEXT,
  occurred_at    TIMESTAMPTZ DEFAULT now()
);

-- inv_event_enum: booked | cancelled | checked_in | checked_out | blocked | maintenance | ota_sync
-- APPEND-ONLY audit ledger. Never updated or deleted.
-- Powers occupancy reports and conflict investigation.
```

---

## Schema: add_ons

```sql
CREATE TABLE add_ons (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          VARCHAR(60) UNIQUE NOT NULL,
  name          VARCHAR(120) NOT NULL,
  description   TEXT,
  category      addon_category_enum NOT NULL,
  pricing_model addon_pricing_enum NOT NULL,   -- per_person | per_night | flat
  unit_price    NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  max_qty       SMALLINT DEFAULT 1,
  is_active     BOOLEAN DEFAULT true,
  media         JSONB,                          -- Cloudflare image IDs array
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- addon_category_enum: spa | fnb | transport | experience | room_enhancement
-- addon_pricing_enum: per_person | per_night | flat
```

## Schema: booking_add_ons

```sql
CREATE TABLE booking_add_ons (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  addon_id    UUID NOT NULL REFERENCES add_ons(id),
  quantity    SMALLINT NOT NULL DEFAULT 1,
  unit_price  NUMERIC(10,2) NOT NULL,    -- price snapshot at time of purchase
  total_price NUMERIC(10,2) NOT NULL,    -- quantity * unit_price
  status      addon_status_enum NOT NULL DEFAULT 'confirmed',
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- addon_status_enum: confirmed | cancelled | fulfilled | pending
```

## Schema: promo_codes

```sql
CREATE TABLE promo_codes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code             VARCHAR(30) UNIQUE NOT NULL,
  description      TEXT,
  discount_type    promo_type_enum NOT NULL,    -- percentage | flat | los
  discount_value   NUMERIC(10,4) NOT NULL,      -- 0.15 = 15%, 50.00 = $50 flat
  min_nights       SMALLINT DEFAULT 1,
  min_order_value  NUMERIC(10,2),               -- NULL = no minimum
  max_uses         INTEGER,                     -- NULL = unlimited
  uses_count       INTEGER DEFAULT 0,
  valid_from       TIMESTAMPTZ NOT NULL,
  valid_to         TIMESTAMPTZ NOT NULL,
  is_active        BOOLEAN DEFAULT true,
  applicable_categories UUID[],                -- NULL = all categories
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- promo_type_enum: percentage | flat | los
```

## Schema: promo_redemptions

```sql
CREATE TABLE promo_redemptions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_id          UUID NOT NULL REFERENCES promo_codes(id),
  booking_id        UUID NOT NULL REFERENCES bookings(id),
  guest_id          UUID NOT NULL REFERENCES guests(id),
  discount_applied  NUMERIC(10,2) NOT NULL,
  redeemed_at       TIMESTAMPTZ DEFAULT now(),

  UNIQUE (promo_id, booking_id)   -- one promo per booking
);
```

## Schema: staff

```sql
CREATE TABLE staff (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id  UUID UNIQUE NOT NULL,     -- Supabase auth.users FK
  property_id   UUID,                     -- NULL = all properties (Phase 4 multi-property)
  email         CITEXT UNIQUE NOT NULL,
  first_name    VARCHAR(80) NOT NULL,
  last_name     VARCHAR(80) NOT NULL,
  role_id       UUID NOT NULL REFERENCES staff_roles(id),
  is_active     BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now()
);
```

## Schema: staff_roles

```sql
CREATE TABLE staff_roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(60) UNIQUE NOT NULL,   -- owner | revenue_manager | front_desk | concierge | housekeeping
  permissions JSONB NOT NULL,                -- structured permission matrix (see Section 08)
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- RBAC Permission matrix stored in JSONB:
-- { "bookings": ["read","write","cancel"], "pricing": ["read"], "reports": ["read","export"] }
-- See Section 08 for full permission matrix definition.
```

## Schema: webhook_events

```sql
CREATE TABLE webhook_events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source           webhook_source_enum NOT NULL,
  event_type       VARCHAR(80) NOT NULL,
  payload          JSONB NOT NULL,
  processed        BOOLEAN DEFAULT false,
  processed_at     TIMESTAMPTZ,
  error            TEXT,
  idempotency_key  VARCHAR(120) UNIQUE NOT NULL,  -- source + event_id composite
  received_at      TIMESTAMPTZ DEFAULT now()
);

-- webhook_source_enum: stripe | booking_com | expedia | siteminder | internal
-- CRITICAL: Write row BEFORE processing. Set processed=true ONLY after successful DB commit.
-- This table IS the idempotency ledger — prevents duplicate processing on provider retries.
```

## Schema: ota_bookings

```sql
CREATE TABLE ota_bookings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id      UUID REFERENCES bookings(id),  -- NULL if mapping failed or pending
  ota_source      booking_source_enum NOT NULL,
  ota_reference   VARCHAR(60) NOT NULL,           -- OTA's own booking reference
  raw_payload     JSONB NOT NULL,                 -- full inbound webhook body
  channel_rate    NUMERIC(10,2),                  -- gross rate OTA charged guest
  commission_pct  NUMERIC(5,4),                   -- OTA commission rate
  net_rate        NUMERIC(10,2),                  -- channel_rate * (1 - commission_pct)
  mapping_status  VARCHAR(20) DEFAULT 'pending',  -- pending | mapped | failed | manual
  received_at     TIMESTAMPTZ DEFAULT now()
);

-- UNIQUE (ota_source, ota_reference) recommended to prevent duplicate OTA ingestion.
```

## Schema: media_assets

```sql
CREATE TABLE media_assets (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type    VARCHAR(30) NOT NULL,         -- room_category | room | add_on | property
  entity_id      UUID NOT NULL,
  cloudflare_id  VARCHAR(80) NOT NULL,         -- Cloudflare Images image/video ID
  asset_type     media_type_enum NOT NULL,
  alt_text       VARCHAR(255),                 -- WCAG 2.2 AA: mandatory for non-decorative images
  sort_order     SMALLINT DEFAULT 0,
  is_hero        BOOLEAN DEFAULT false,
  width_px       INTEGER,
  height_px      INTEGER,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- media_type_enum: image | video_hls | panorama_360
-- Replaces the JSONB media fields in room_categories — normalised for admin management.
```

## Schema: email_log

```sql
CREATE TABLE email_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id      UUID REFERENCES guests(id),
  booking_id    UUID REFERENCES bookings(id),
  template      VARCHAR(60) NOT NULL,          -- e.g. 'booking_confirmation', 'pre_arrival_t3'
  to_email      CITEXT NOT NULL,
  subject       VARCHAR(255) NOT NULL,
  resend_id     VARCHAR(60),                   -- Resend message ID for delivery tracking
  status        email_status_enum NOT NULL DEFAULT 'sent',
  opened_at     TIMESTAMPTZ,                   -- populated via Resend webhook
  clicked_at    TIMESTAMPTZ,                   -- populated via Resend webhook
  failed_reason TEXT,
  sent_at       TIMESTAMPTZ DEFAULT now()
);

-- email_status_enum: queued | sent | delivered | opened | clicked | bounced | failed
```

## Schema: tax_rates

```sql
CREATE TABLE tax_rates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction VARCHAR(100) NOT NULL,    -- e.g. 'GB', 'US-NY', 'EU-FR'
  tax_type     VARCHAR(60) NOT NULL,     -- VAT | occupancy_tax | city_tax | GST | tourism_levy
  rate         NUMERIC(6,4) NOT NULL,    -- e.g. 0.2000 = 20% VAT
  applies_to   VARCHAR(30) DEFAULT 'all', -- room_rate | add_ons | all
  valid_from   DATE NOT NULL,
  valid_to     DATE,                     -- NULL = currently active
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- CRITICAL: Add these columns to the bookings table:
--   tax_amount       NUMERIC(12,2) NOT NULL DEFAULT 0
--   tax_breakdown    JSONB NOT NULL DEFAULT '{}'
-- Tax MUST be computed and stored at booking commit time.
-- Never recompute post-booking — tax rates change, historical amounts must be immutable.
```

## Schema: rate_parity_alerts

```sql
CREATE TABLE rate_parity_alerts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id   UUID NOT NULL REFERENCES room_categories(id),
  ota_source    VARCHAR(40) NOT NULL,
  check_date    DATE NOT NULL,
  direct_rate   NUMERIC(10,2) NOT NULL,
  ota_rate      NUMERIC(10,2) NOT NULL,
  rate_delta    NUMERIC(10,2) NOT NULL,    -- ota_rate - direct_rate (negative = OTA cheaper than direct)
  resolved      BOOLEAN DEFAULT false,
  resolved_at   TIMESTAMPTZ,
  detected_at   TIMESTAMPTZ DEFAULT now()
);

-- Alert triggered when ota_rate < direct_rate (OTA undercutting your direct booking channel).
```

---

# SECTION 05 — IMPLEMENTATION ROADMAP

## Phase 1 — MVP (Weeks 1–8)
**Goal:** Launchable booking system with core funnel, manual pricing, and basic admin. Revenue-generating from day one.

### Frontend
- Next.js 15 project scaffold with Tailwind + TypeScript
- Landing page with static hero, room category grid
- Basic availability date picker (client-side validation)
- 3-step booking funnel (no add-ons yet)
- Stripe Elements checkout with confirmation page
- Post-booking confirmation email via Resend

### Backend
- PostgreSQL schema: rooms, room_categories, guests, bookings
- tRPC API: availability check, create booking, get booking
- Manual pricing only — admin sets base rate per category
- Supabase Auth: magic link for guest dashboard
- Booking reference generation (8-char alphanumeric)
- Basic inventory_log writes on booking events

### Infrastructure
- Vercel deployment with preview environments
- Supabase project (Postgres + Auth)
- Cloudflare for DNS + basic CDN
- Upstash Redis for soft-lock mechanism
- Environment secrets via Vercel env vars
- Basic Sentry error tracking

### Admin (Temporary)
- Supabase Studio as temporary admin (tables only)
- Manual room status updates via table editor
- Booking list view with status filters

---

## Phase 2 — Core Feature Parity (Weeks 9–16)
**Goal:** Full pricing engine, media system, guest preferences, and operational admin panel. Hotel can go fully live.

### Pricing Engine
- Seasonal pricing rules table + admin UI
- Dynamic rate computation API with Redis caching (15-min TTL)
- Cloudflare Worker for edge-localized pricing display
- "Only X left" availability scarcity badges
- Promo code system with percentage/flat/LOS discounts

### Media System
- Cloudflare Images integration — auto WebP/AVIF conversion
- 360° room gallery with Pannellum.js viewer
- HLS video via Cloudflare Stream for property tours
- Image optimization pipeline: upload → transform → distribute
- Lazy loading with LCP priority hints on hero images

### Guest Preferences & CRM
- Guest preferences JSONB schema + capture UI in booking flow
- Pre-arrival email sequence (T-7, T-3, T-1 days) via BullMQ
- Returning guest recognition via email lookup
- Loyalty points tracking (earn on confirmed bookings)
- GDPR consent capture + data export endpoint

### Admin Panel
- Custom Next.js admin app (separate route group `/admin`)
- Booking management: view, modify, cancel, manual override
- Room status management + maintenance scheduling
- Pricing calendar with visual override interface
- Occupancy dashboard: heatmap, RevPAR, ADR metrics

---

## Phase 3 — Advanced Features (Weeks 17–22)
**Goal:** Add-on upselling, concierge tools, OTA sync, mobile key, and advanced analytics.

### Upsell Engine
- Add-on catalogue: spa, F&B, transport, experiences
- Multi-step funnel integration (step 3: add-ons)
- Bundle recommendation logic (rule-based by room type)
- Post-booking upsell dashboard widget
- Pricing models: per-person, per-night, flat fee

### Concierge Dashboard
- Arrivals board with guest preference cards
- Service request queue with real-time updates (Supabase Realtime)
- Room assignment planner with upgrade recommendations
- Guest messaging: WhatsApp via 360dialog API
- Housekeeping status integration (room state machine)

### OTA & Distribution
- Channel manager API integration (SiteMinder or Cloudbeds)
- Rate + availability sync to Booking.com / Expedia
- OTA booking ingest webhook → inventory_log event
- Rate parity monitoring: flag if OTA undercuts direct rate

### Mobile & Analytics
- Apple/Google Wallet pass for mobile check-in (PassKit)
- Advanced reporting: source attribution, LTV by loyalty tier
- Occupancy forecast model: 30/60/90 day projections
- A/B testing framework for pricing display variants

---

## Phase 4 — Scale & Optimization (Ongoing)
**Goal:** Infrastructure hardening, ML-assisted pricing, multi-property support, and zero-downtime operations.

### Performance & Resilience
- Read replicas for all reporting queries (Supabase read replica)
- Connection pooling via PgBouncer (transaction mode)
- Redis cluster with persistence (RDB + AOF) for lock durability
- Blue-green deployment strategy via Vercel + feature flags
- Chaos engineering: quarterly failure injection tests

### ML & Personalization
- Demand forecasting model (XGBoost) for pricing automation
- Personalized upsell ranking per guest segment
- Search result personalization by historical booking patterns
- Revenue manager alert system: yield optimization recommendations

### Multi-property
- Property abstraction layer (add `property_id` FK to all tables)
- Tenant-aware RLS policies per property
- Shared guest CRM across properties with property-specific prefs
- Consolidated reporting dashboard across portfolio

### Compliance & Operations
- SOC 2 Type II audit readiness
- Automated GDPR right-to-erasure workflow
- Disaster recovery: RTO < 1hr, RPO < 5min via Supabase PITR
- On-call runbook with automated remediation playbooks

---

# SECTION 06 — PERFORMANCE & SECURITY CHECKLIST

## PCI-DSS Compliance

| Priority | Item | Detail |
|---|---|---|
| CRITICAL | SAQ-A scope reduction | All card data handled exclusively by Stripe Elements iframe. Server never touches raw PANs. |
| CRITICAL | TLS 1.3 enforced | HSTS with 1yr max-age. TLS 1.0/1.1 disabled at Cloudflare WAF layer. |
| CRITICAL | Stripe webhook signature | All webhook events verified with `stripe.webhooks.constructEvent()` before processing. |
| HIGH | Idempotency keys | Every Stripe charge call uses UUID idempotency key to prevent duplicate billing on retries. |
| HIGH | 3DS2 compliance | Strong Customer Authentication auto-triggered for EEA cards via Stripe Radar. |
| MEDIUM | Quarterly pen tests | OWASP Top 10 scope. Remediation SLA: critical 24hr, high 7d. |

## Concurrency & Double-booking Prevention

| Priority | Item | Detail |
|---|---|---|
| CRITICAL | Postgres EXCLUDE constraint | Daterange exclusion constraint is the final defensive layer — enforced at DB engine level regardless of application logic. |
| CRITICAL | SELECT FOR UPDATE | Inventory row locked during booking transaction. No optimistic concurrency for this critical path. |
| CRITICAL | Redis soft-lock TTL | 15-minute SETNX lock per room+date at funnel entry. Prevents parallel checkouts on same room. |
| HIGH | Idempotent booking API | `POST /bookings` is idempotent via booking reference UUID. Duplicate submissions return the existing booking. |
| HIGH | Queue serialization | BullMQ FIFO queue for booking confirmations. Prevents thundering-herd on confirmation emails during peak. |

## Performance Targets

| Metric | Target |
|---|---|
| LCP (room pages) | < 1.8s |
| INP | < 150ms |
| CLS | < 0.05 |
| TTFB (ISR pages) | < 80ms |
| Availability API p99 | < 120ms |
| Booking commit p99 | < 800ms |
| Edge pricing fn p99 | < 5ms |

**Strategy:** ISR for room/category pages (`revalidate: 3600`). PPR for availability widget. Edge caching for pricing. No SSR on marketing pages.

## Application Security

| Priority | Item | Detail |
|---|---|---|
| CRITICAL | Row-Level Security | Supabase RLS policies: guests can only read their own bookings. No bypass path in application layer. |
| CRITICAL | Rate limiting | Upstash Redis rate limiter: `/api/availability` (100 req/min/IP), `/api/bookings` (10 req/min/IP). |
| HIGH | CSRF protection | Next.js server actions use origin verification. Stateless JWT (15min) + refresh token rotation. |
| HIGH | Input validation | All API inputs validated with Zod at tRPC router layer. Parameterized queries only — no raw SQL string interpolation. |
| MEDIUM | Secrets management | Doppler for environment secrets. No secrets in git history. 90-day rotation policy for API keys. |

## Observability Stack

| Tool | Purpose |
|---|---|
| Sentry | Error tracking with source maps |
| OpenTelemetry → Grafana Tempo | Distributed tracing |
| Prometheus + Grafana Cloud | Infrastructure metrics |
| Axiom | Structured JSON log aggregation |
| Better Uptime | Uptime monitoring (30s checks) |
| pg_stat_statements | Slow query detection + alerts |
| PagerDuty | On-call alerting and rotation |

## Extended Security Layers (Production Additions)

| Priority | Item | Detail |
|---|---|---|
| CRITICAL | Bot protection | Cloudflare Turnstile on booking funnel — invisible challenge, no CAPTCHA friction. Blocks scraping and credential stuffing without hurting conversion. |
| CRITICAL | Brute-force auth lockout | Account lockout after 5 failed magic-link requests per email per hour. Implemented via Upstash rate limiter on `/api/auth/*`. |
| HIGH | Dependency scanning | Dependabot (GitHub) + Snyk in CI pipeline — automated PRs for vulnerable dependency upgrades with CVSS severity gating. |
| HIGH | SAST (Static Analysis) | Semgrep in CI — custom rules for SQL injection patterns, hardcoded secrets, unsafe `eval`, and tRPC input bypass. |
| HIGH | Secret scanning | GitHub secret scanning + Gitleaks pre-commit hook — blocks commits containing API keys, connection strings, or private keys. |
| HIGH | CSP violation reporting | `Content-Security-Policy: report-uri /api/csp-report` — collects XSS attempts and injection probes into a structured log. |
| MEDIUM | Audit log admin UI | `/admin/audit` — paginated view of `inventory_log` filtered by actor, event type, and date range. Essential for SOC 2 Type II compliance. |
| MEDIUM | Subresource Integrity | SRI hashes on any third-party scripts loaded outside of Vercel CDN. Prevents supply-chain injection attacks. |

---

# SECTION 07 — CODING AGENT PROMPTS (4-PART SERIES)

> These prompts are engineered for use with Claude, GPT-4o, or any frontier coding agent. Each part is self-contained and builds on the previous. Feed them sequentially to a single agent session for best results.

---

## PROMPT PART 1 OF 4 — Foundation & Core Booking Engine

```
You are a Senior Full-Stack Engineer specializing in Next.js 15, TypeScript, 
and PostgreSQL. You write production-ready code — no shortcuts, no placeholders, 
no "TODO" comments. Every function is typed, every edge case is handled.

## PROJECT CONTEXT
Build the foundation for "Aurum Hotel OS" — a luxury boutique hotel booking 
system. This is Part 1 of 4. You are building the core data layer and booking 
engine.

## TECH STACK
- Next.js 15 with App Router (RSC-first, no "use client" unless required)
- TypeScript 5 (strict mode, no `any`)
- PostgreSQL 16 via Supabase (connection via @supabase/ssr)
- Redis via Upstash (@upstash/redis) for soft-locks and availability cache
- tRPC v11 + Zod for type-safe API layer
- Stripe for payments (@stripe/stripe-js + stripe Node SDK)

## DELIVERABLES — Build exactly these, nothing more:

### 1. Database Schema (SQL migration file)
Create a complete SQL migration for these tables:
- `room_categories` (id, slug, name, description, base_price, max_occupancy, 
  size_sqm, amenities JSONB, media JSONB)
- `rooms` (id, category_id FK, room_number UNIQUE, floor, status ENUM, 
  features TEXT[], metadata JSONB)
- `guests` (id, email CITEXT UNIQUE, first_name, last_name, phone, nationality, 
  loyalty_tier ENUM, loyalty_points, preferences JSONB, gdpr_consent JSONB, 
  stripe_customer_id)
- `bookings` (id, reference UNIQUE, guest_id FK, room_id FK, check_in DATE, 
  check_out DATE, adults, children, status ENUM, total_amount, currency, 
  rate_snapshot JSONB, stripe_payment_intent UNIQUE, source ENUM, 
  special_requests, created_at)
- `seasonal_pricing` (id, category_id FK, name, valid_from, valid_to, 
  price_modifier NUMERIC, min_los, priority, is_active)
- `inventory_log` (id BIGSERIAL, room_id FK, booking_id FK nullable, event_type 
  ENUM, status_before, status_after, actor_id, actor_type, notes, occurred_at)

CRITICAL CONSTRAINT: Add this exclusion constraint to bookings to prevent 
double-booking at DB level:
EXCLUDE USING gist (room_id WITH =, daterange(check_in, check_out, '[)') WITH &&) 
WHERE (status NOT IN ('cancelled', 'no_show'))

### 2. tRPC Router: availability.ts
Route: `availability.check`
Input: `{ room_id: string, check_in: string, check_out: string }`
Logic:
- Check Redis cache first (key: `avail:{room_id}:{check_in}:{check_out}`, TTL 60s)
- On cache miss, query Postgres: check bookings exclusion for date range
- Return: `{ available: boolean, price: number, currency: string }`
- On available: acquire Redis soft-lock (SETNX `lock:{room_id}:{check_in}:{check_out}`, 
  TTL 900s)

### 3. tRPC Router: bookings.ts
Route: `bookings.create`
Input: Full Zod schema — all booking fields + stripe_payment_intent
Logic (this must be an atomic transaction):
  1. Verify Redis soft-lock exists for room+dates
  2. BEGIN TRANSACTION
  3. SELECT room FROM rooms WHERE id = room_id FOR UPDATE
  4. Verify no conflicting booking exists (double-check even with exclusion)
  5. INSERT into bookings
  6. INSERT into inventory_log (event_type: 'booked')
  7. UPDATE room status if applicable
  8. COMMIT
  9. Release Redis soft-lock
  10. Trigger confirmation email job (BullMQ or direct Resend call)
Handle: If transaction fails, return structured error. Never leak DB errors to client.

### 4. Pricing Engine: lib/pricing.ts
Function: `computeNightlyRate(categoryId, checkIn, checkOut, guestId?)`
Logic:
- Fetch base_price from room_categories
- Query seasonal_pricing where valid_from <= checkIn AND valid_to >= checkOut 
  AND is_active = true, ORDER BY priority DESC LIMIT 1
- Apply price_modifier
- If occupancy > 85% for that category on those dates: apply 1.1x demand 
  multiplier (Fibonacci schedule, max 1.5x)
- If guestId provided and loyalty_tier = 'gold'/'platinum'/'black': apply 
  loyalty discount (5% / 10% / 15%)
- Cache result in Redis (key: `price:{categoryId}:{checkIn}:{checkOut}`, TTL 900s)
- Return: `{ nightly_rate, total, breakdown: { base, seasonal_modifier, 
  demand_modifier, loyalty_discount } }`

## CONSTRAINTS
- All monetary values: NEVER use floats. Use `Decimal.js` for calculations, 
  store as NUMERIC(12,2) in DB
- All dates: Use UTC. Never store local time in DB
- Error handling: Use a Result type pattern — never throw from business logic 
  functions, return `{ success: boolean, data?, error? }`
- Logging: Every booking transaction must log to `inventory_log` — no exceptions
- The soft-lock and DB exclusion constraint are BOTH required — defense in depth

## OUTPUT FORMAT
Provide complete, runnable files. No partial code. No omissions. File structure:
- `supabase/migrations/001_initial_schema.sql`
- `src/server/routers/availability.ts`
- `src/server/routers/bookings.ts`
- `src/lib/pricing.ts`
- `src/lib/redis.ts` (Upstash client + soft-lock helpers)
- `src/types/booking.ts` (all shared types and Zod schemas)
```

---

## PROMPT PART 2 OF 4 — Frontend Booking Funnel & Room Discovery

```
You are a Senior Frontend Engineer specializing in Next.js 15 App Router, 
React Server Components, and luxury UI/UX. You write pixel-perfect, accessible, 
performant code. This is Part 2 of 4 of the Aurum Hotel OS project.

Assume Part 1 is complete: tRPC routers for availability and bookings exist, 
the Zod schemas are in `src/types/booking.ts`, and the pricing engine is in 
`src/lib/pricing.ts`.

## TECH STACK
- Next.js 15 App Router (RSC + Server Actions)
- Tailwind CSS v4
- shadcn/ui for base components
- Zustand for cart/funnel state
- Framer Motion for transitions
- React Hook Form + Zod for form validation
- Stripe Elements (@stripe/react-stripe-js) for payment
- Pannellum.js for 360° room gallery

## DESIGN SYSTEM
Apply these constraints consistently:
- Color palette: Deep charcoal (#1a1a1a), warm white (#faf9f7), gold accent (#C9A84C)
- Typography: Display = Cormorant Garamond (serif), Body = Inter or DM Sans
- Spacing: 8px base grid, generous whitespace
- Images: Always use next/image with priority={true} for LCP candidates
- Animations: Subtle, 300ms ease-out, respect prefers-reduced-motion

## DELIVERABLES

### 1. Landing Page: `app/page.tsx` (Server Component)
- Full-bleed hero section: video background (Cloudflare Stream HLS) with 
  autoplay muted loop, fallback to WebP poster
- Inline availability widget: date range picker + guest count + CTA button
  - Widget state managed by a thin "use client" wrapper only
  - On submit: router.push('/rooms?checkIn=X&checkOut=Y&guests=N')
- Room category grid: 3-column, ISR data from Supabase, each card shows:
  - Hero image (next/image, sizes prop for responsive srcset)
  - Category name, size, "From $X/night" (dynamic — call pricing engine)
  - "Book Now" + "View Gallery" CTA buttons
  - "Only 2 left" badge when availability < 3 rooms
- Testimonials section (static)
- JSON-LD schema for Hotel and LodgingBusiness (SEO)
- Metadata: og:image, canonical, hreflang (en, fr, de)

### 2. Room Discovery: `app/rooms/page.tsx` (Server Component)
- Reads searchParams for checkIn, checkOut, guests
- Filter sidebar: amenities checkboxes, floor preference, view type, price range
- Room cards grid with:
  - 360° gallery modal trigger (Pannellum.js loaded dynamically)
  - Real-time availability check on card hover (100ms debounce, optimistic UI)
  - Dynamic pricing display with breakdown tooltip on hover
  - Smooth skeleton loaders during availability fetch

### 3. Booking Funnel: `app/book/[roomId]/page.tsx`
Multi-step wizard — 4 steps. State persisted in Zustand + sessionStorage 
(for page refresh recovery).

Step 1 — Date Confirmation + Guest Details
- Show selected dates, room, dynamic price breakdown
- Guest form: first name, last name, email, phone, special requests
- Email field triggers returning guest lookup (debounced, 300ms)
- If returning guest found: auto-populate preferences, show "Welcome back" toast

Step 2 — Add-ons Upsell
- Cards: Spa package, Airport transfer, Welcome champagne, Late checkout
- Pricing: per-person / per-night / flat (render correct variant)
- "Most popular pairing" highlight badge on 1-2 items
- Running total updates in real time as add-ons are toggled

Step 3 — Review & Payment
- Full booking summary: room, dates, guests, add-ons, loyalty discount if any
- Stripe Elements card form (no card data ever hits your server)
- "Pay Securely" button triggers server action:
  1. Create Stripe PaymentIntent on server
  2. Confirm payment client-side via Stripe.js
  3. On success: call `bookings.create` tRPC mutation
  4. On failure: display Stripe error message, do NOT reset form

Step 4 — Confirmation
- Booking reference (large, copyable)
- Summary of booking
- "Manage Booking" link → `/dashboard/bookings/[ref]`
- Share to calendar button (ICS file generation)

### 4. Funnel State: `src/store/booking-store.ts`
Zustand store with:
- selectedRoom, checkIn, checkOut, adults, children
- guestDetails (typed), addOns (array), promoCode
- currentStep (1-4)
- Actions: setRoom, setDates, setGuest, toggleAddOn, nextStep, prevStep, reset
- Persistence: sync to sessionStorage on every change

## CRITICAL REQUIREMENTS
- The booking funnel must be fully keyboard-navigable (WCAG 2.2 AA)
- Every image must have a meaningful alt attribute
- Form errors must be announced to screen readers (aria-live="polite")
- The Stripe Elements form must render inside a proper <form> element 
  (even in React, not div-based)
- Soft-lock timer: show a "Your room is held for X:XX" countdown in funnel 
  header once lock is acquired. On expiry, show modal: "Your hold has expired. 
  Checking availability..." — re-attempt silently, only show error if room 
  is now unavailable.
- Mobile-first: test at 375px viewport. The funnel steps must be swipeable 
  on mobile (Framer Motion drag gesture or swipe detection).

## OUTPUT FORMAT
Complete files, no omissions:
- `app/page.tsx`
- `app/rooms/page.tsx`
- `app/rooms/[roomId]/page.tsx` (room detail page)
- `app/book/[roomId]/page.tsx` + step components in `app/book/[roomId]/_components/`
- `src/store/booking-store.ts`
- `src/components/ui/room-card.tsx`
- `src/components/ui/availability-widget.tsx`
- `src/components/ui/gallery-modal.tsx` (360° viewer wrapper)
```

---

## PROMPT PART 3 OF 4 — Admin Panel & Concierge Dashboard

```
You are a Senior Full-Stack Engineer building an internal operations dashboard 
for "Aurum Hotel OS". This is Part 3 of 4. You are building the admin panel 
and concierge interface.

Assume Parts 1 and 2 are complete. The tRPC routers, DB schema, and guest-facing 
funnel all exist. You are now building the hotel operations layer.

## TECH STACK (same as Parts 1-2, plus:)
- Supabase Realtime for live concierge updates
- Recharts for occupancy and revenue charts
- @dnd-kit for drag-and-drop room assignment
- date-fns for all date manipulations
- Tanstack Table v8 for data grids

## ROUTE STRUCTURE
All admin routes under `/admin` (separate layout with auth guard).
All concierge routes under `/concierge` (separate layout, different permissions).

## DELIVERABLES

### 1. Admin: Revenue Dashboard `app/admin/page.tsx`
Server Component, data fetched via Supabase directly (bypasses tRPC for 
internal admin queries).

Metrics displayed (all real data, no mocks):
- Today's occupancy rate (%)
- MTD Revenue vs prior month (with % delta)
- ADR (Average Daily Rate) for current month
- RevPAR (Revenue Per Available Room)
- Bookings today: new, modified, cancelled

Charts:
- 30-day occupancy heatmap (calendar view, color-coded by %)
- Revenue by source (pie/donut: direct, OTA, GDS, phone)
- Booking lead time distribution (bar chart)

All data must come from real SQL aggregation queries on the `bookings` + 
`inventory_log` tables. Write the queries — do not fake data.

### 2. Admin: Pricing Calendar `app/admin/pricing/page.tsx`
- Calendar grid: 90-day view, one row per room_category
- Each cell: current computed rate for that date (call pricing engine)
- Click a cell: modal to add/edit seasonal_pricing rule for that category+date
- Bulk select: drag across cells to apply same pricing rule to a range
- Show applied rule name as tooltip on cell hover
- "Save" triggers: INSERT/UPDATE seasonal_pricing + invalidate Redis price cache 
  for affected keys

### 3. Admin: Booking Management `app/admin/bookings/page.tsx`
- Tanstack Table with server-side pagination (50 rows/page)
- Columns: Reference, Guest, Room, Dates, Status, Amount, Source, Actions
- Filters: date range, status, source, room category
- Row actions: View Details, Modify Dates, Upgrade Room, Cancel (with refund logic)
- Cancel flow: 
  - If check_in > 7 days: full refund via Stripe
  - If check_in 1-7 days: 50% refund
  - If check_in < 24hrs: no refund
  - All cancellations: UPDATE booking status, INSERT inventory_log, 
    trigger cancellation email

### 4. Concierge: Arrivals Board `app/concierge/page.tsx`
Real-time board using Supabase Realtime subscriptions.

- Today's arrivals: card per booking, sorted by ETA (if provided)
- Each card shows: Guest name + loyalty tier badge, room number, 
  special requests, preference summary from guests.preferences JSONB
- Room assignment: drag card to a room slot (dnd-kit)
  - On drop: PATCH room assignment, INSERT inventory_log (event: 'checked_in')
  - Optimistic update — revert on API error
- Filter bar: All | VIP Only | Unassigned | Special Requests

### 5. Concierge: Service Request Queue `app/concierge/requests/page.tsx`
- Real-time queue via Supabase Realtime (subscribe to `service_requests` table)
- Each request: Guest name, room, request type, time received, status
- Status flow: pending → in_progress → completed → escalated
- One-click status updates (optimistic UI)
- Escalation: marks as high-priority, sends push notification to manager
- New table needed: `service_requests` — add to SQL migration:
  (id, booking_id FK, guest_id FK, type ENUM, description, status ENUM, 
   priority, assigned_to UUID, created_at, resolved_at)

## CRITICAL REQUIREMENTS
- ALL admin and concierge routes must be protected by Supabase RLS + 
  server-side auth check. If not authenticated or wrong role: redirect to /login
- Never expose raw guest PII (passport numbers, full card details) in any view
- The revenue dashboard queries must use Postgres window functions for 
  prior-period comparison — do not fetch all rows and compute in JS
- Realtime subscriptions must clean up on component unmount 
  (useEffect return cleanup)
- All data mutations must write to inventory_log for audit trail

## OUTPUT FORMAT
Complete files:
- `app/admin/layout.tsx` (auth guard)
- `app/admin/page.tsx` (revenue dashboard)
- `app/admin/pricing/page.tsx`
- `app/admin/bookings/page.tsx`
- `app/concierge/layout.tsx`
- `app/concierge/page.tsx` (arrivals board)
- `app/concierge/requests/page.tsx`
- `src/server/routers/admin.ts` (admin-only tRPC procedures)
- `supabase/migrations/002_service_requests.sql`
```

---

## PROMPT PART 4 OF 4 — Performance, Security & Production Hardening

```
You are a Senior DevOps / Platform Engineer finalizing "Aurum Hotel OS" for 
production. This is Part 4 of 4 — the hardening phase. The application is 
feature-complete. You are making it production-grade.

Assume Parts 1-3 are complete. All routes, APIs, and dashboards exist. 
You are adding the infrastructure, security, observability, and performance 
layers.

## TECH STACK (additions)
- Cloudflare Workers (Wrangler CLI) for edge functions
- Upstash Redis + Ratelimit SDK for rate limiting
- Sentry SDK (Next.js SDK) for error tracking
- OpenTelemetry for distributed tracing
- BullMQ for background job queues
- Resend + React Email for transactional email templates

## DELIVERABLES

### 1. Cloudflare Worker: Edge Pricing `workers/pricing-edge.ts`
Purpose: Serve localized pricing at <5ms without hitting origin.
- Read pricing rules from Cloudflare KV (key: `pricing:{categoryId}`)
- Read geo-IP country from `request.cf.country`
- Apply currency conversion (rates stored in KV, updated hourly)
- Return: `{ rate: number, currency: string, formatted: string }`
- Cache response in CF Cache API with `s-maxage=900`
- On KV miss: fetch from origin API, write to KV, return result
- Deploy config in `wrangler.toml`

### 2. Rate Limiting Middleware `src/middleware.ts`
Use Upstash Ratelimit with sliding window algorithm.

Rules:
- `/api/availability`: 100 requests per minute per IP
- `/api/bookings` (POST): 10 requests per minute per IP  
- `/api/auth/*`: 20 requests per minute per IP
- Admin routes: 500 requests per minute per authenticated user
- On rate limit exceeded: return 429 with `Retry-After` header
- Exempt: Cloudflare health checks (CF-Worker header)

Also in middleware:
- Verify Supabase session for protected routes
- Set security headers: CSP, X-Frame-Options, X-Content-Type-Options, 
  Referrer-Policy, Permissions-Policy
- Redirect HTTP to HTTPS (should be handled by CF but add as fallback)

### 3. Background Jobs: `src/jobs/`
Using BullMQ with Upstash Redis as broker.

Implement these queues and processors:

`booking-confirmation.queue.ts`:
- Triggered after successful booking commit
- Job data: { bookingId, guestEmail, guestName, bookingRef, checkIn, checkOut }
- Processor: fetch full booking + add-ons from DB, render React Email template, 
  send via Resend
- Retry: 3 attempts, exponential backoff (1min, 5min, 15min)
- On permanent failure: log to Sentry + mark booking with email_failed flag

`pre-arrival.queue.ts`:
- Scheduled job: runs daily at 8am UTC
- Finds bookings where check_in IN (7 days, 3 days, 1 day from now) 
  AND pre_arrival_email_sent = false for that interval
- Sends personalized pre-arrival email with:
  - Booking summary
  - Preference confirmation form link
  - Upsell widget (available add-ons for their dates)
  - Mobile check-in instructions
- BullMQ repeatable job with cron: `0 8 * * *`

`post-stay.queue.ts`:
- Triggered 24hrs after check_out
- Sends review request email + loyalty points statement
- Updates guest.loyalty_points (earn 1pt per $1 spent on confirmed stays)

### 4. Email Templates: `src/emails/`
Using React Email. Build these templates (real HTML email, not plain text):

`booking-confirmation.tsx`: 
- Aurum branding (gold header, clean typography)
- Booking reference (large, prominent)
- Stay summary table: room, dates, guests, add-ons, total
- CTA: "Manage Booking" button → /dashboard/bookings/[ref]
- Footer: cancellation policy summary

`pre-arrival.tsx`:
- Personalized greeting with guest first name
- Countdown: "X days until your arrival"
- Preference confirmation section
- Add-on upsell cards (max 3, rule-based selection)
- Mobile check-in CTA (PassKit link)

### 5. Observability: `src/lib/observability.ts`
- Sentry initialization for Next.js (both client and server)
  - Capture unhandled exceptions
  - Performance monitoring: tracesSampleRate = 0.1 (10% in production)
  - Before send: scrub PII (email, phone, card last4) from breadcrumbs
- OpenTelemetry setup:
  - Trace all tRPC procedure calls (middleware)
  - Trace all DB queries (Supabase client wrapper)
  - Trace all Redis operations
  - Export to Grafana Tempo via OTLP endpoint
- Custom metrics (increment on each event):
  - `booking.created`, `booking.cancelled`, `booking.checked_in`
  - `availability.cache_hit`, `availability.cache_miss`
  - `pricing.computed`, `pricing.surge_applied`

### 6. Security Hardening

`src/lib/stripe-webhook.ts`:
- Full webhook handler for: payment_intent.succeeded, 
  payment_intent.payment_failed, charge.dispute.created
- Signature verification FIRST before any processing
- Idempotency: store processed webhook IDs in Redis (SET NX, TTL 24h)
  to prevent double-processing on Stripe retries
- On payment_intent.succeeded: confirm booking status = 'confirmed'
- On payment_failed: release soft-lock, send failure email, mark booking 'pending'
- On dispute: flag booking, alert admin via Slack webhook

`src/lib/sanitization.ts`:
- Input sanitization functions using DOMPurify (server-side with jsdom)
- Sanitize: special_requests, guest notes, any free-text field
- Validate: email (RFC 5322), phone (E.164 via libphonenumber-js), 
  dates (no past check_in, max 365 days in future)

### 7. CI/CD Pipeline: `.github/workflows/production.yml`
GitHub Actions workflow:
- Trigger: push to `main` branch
- Jobs (run in parallel where possible):
  1. `lint-typecheck`: eslint + tsc --noEmit
  2. `test`: vitest unit tests + integration tests (test DB)
  3. `e2e`: Playwright tests (critical paths: full booking funnel, admin login)
  4. `deploy` (depends on all above passing):
     - Run Supabase migrations: `supabase db push`
     - Deploy to Vercel: `vercel --prod`
     - Deploy CF Worker: `wrangler deploy`
     - Purge Cloudflare cache for pricing KV
  5. `notify`: Slack notification on success/failure with deploy summary

## PRODUCTION CHECKLIST (validate each in code/config)
- [ ] All environment variables documented in `.env.example` with comments
- [ ] `next.config.ts`: security headers, image domains whitelist, bundle analyzer
- [ ] `Sentry.init` with environment-specific DSNs
- [ ] Redis connection uses TLS (rediss://) in production
- [ ] Supabase connection uses connection pooler URL in production
- [ ] All cron jobs have dead-letter queues configured in BullMQ
- [ ] Stripe webhook endpoint registered in Stripe Dashboard (document the URL)
- [ ] Cloudflare WAF rules: block known bad bots, geographic restrictions if needed

## OUTPUT FORMAT
Complete files — every file runnable as-is:
- `workers/pricing-edge.ts` + `wrangler.toml`
- `src/middleware.ts`
- `src/jobs/booking-confirmation.queue.ts`
- `src/jobs/pre-arrival.queue.ts`
- `src/jobs/post-stay.queue.ts`
- `src/emails/booking-confirmation.tsx`
- `src/emails/pre-arrival.tsx`
- `src/lib/observability.ts`
- `src/lib/stripe-webhook.ts`
- `src/lib/sanitization.ts`
- `.github/workflows/production.yml`
- `.env.example` (all variables, commented)
- `next.config.ts` (final production config)
```

---

# SECTION 08 — RBAC PERMISSION MATRIX

## Role Definitions

| Role | Scope | Description |
|---|---|---|
| `owner` | All | Full access to all resources and settings |
| `revenue_manager` | Pricing, Reports | Manages pricing rules, views all revenue reports |
| `front_desk` | Bookings, Guests | Check-in/out, booking modifications, guest CRM read |
| `concierge` | Concierge, Requests | Arrivals board, service requests, guest messaging |
| `housekeeping` | Rooms | Room status updates, maintenance flags only |
| `maintenance` | Rooms | Maintenance block/unblock only |

## Permission Matrix

| Resource | owner | revenue_manager | front_desk | concierge | housekeeping | maintenance |
|---|---|---|---|---|---|---|
| `bookings.read` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `bookings.write` | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| `bookings.cancel` | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| `pricing.read` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `pricing.write` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `guests.read` | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |
| `guests.write` | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| `rooms.status` | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| `rooms.maintenance` | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `reports.read` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `reports.export` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `concierge.requests` | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |
| `admin.staff` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `admin.audit_log` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

> **RLS Implementation:** Each Supabase RLS policy checks `auth.uid()` against the `staff` table to resolve `role_id → permissions JSONB`. Guest-facing APIs use a separate RLS path checking `guests.id` only.

---

# SECTION 09 — COMPLETE API CONTRACT REGISTRY

## Guest-Facing tRPC Procedures

| Procedure | Input | Output | Notes |
|---|---|---|---|
| `availability.check` | `room_id, check_in, check_out` | `{ available, price, currency, breakdown }` | Redis cache → DB fallback |
| `rooms.list` | `{ filters, check_in, check_out, guests }` | `Room[]` | ISR-backed, filter server-side |
| `rooms.getById` | `room_id` | `Room + media_assets[]` | Static at build, ISR 1hr |
| `addOns.list` | `{ category_id, check_in, check_out }` | `AddOn[]` | Filtered by date/category rules |
| `promos.validate` | `{ code, booking_total, nights, category_id }` | `{ valid, discount_amount, message }` | Atomic: check + reserve usage slot |
| `bookings.create` | Full booking schema + payment_intent_id | `{ booking_id, reference }` | Atomic DB transaction |
| `bookings.getByRef` | `reference` + magic link token | `Booking + add_ons + guest` | Auth-gated: guest token only |
| `bookings.modify` | `booking_id, new_check_in, new_check_out` | `{ new_total, charge_delta }` | Re-prices, charges/refunds delta |
| `bookings.cancel` | `booking_id` | `{ refund_amount, status }` | Applies cancellation policy tiers |
| `guests.updatePreferences` | `{ dietary, room_prefs, comms_channel }` | `{ success }` | Merges into JSONB, does not overwrite |
| `guests.gdprExport` | Auth token | Signed S3 URL | Async: generates JSON export, emails link |

## Admin-Only tRPC Procedures

| Procedure | Auth | Notes |
|---|---|---|
| `admin.dashboard` | `revenue_manager+` | Real SQL aggregations via Postgres window functions |
| `admin.exportReport` | `revenue_manager+` | CSV/XLSX revenue export with date range |
| `admin.pricingRules.upsert` | `revenue_manager+` | Saves seasonal_pricing + invalidates Redis + KV |
| `admin.bookings.override` | `owner` | Force-modify any booking field with audit log entry |
| `admin.staff.create` | `owner` | Creates staff + Supabase auth invite |
| `admin.audit.list` | `owner, revenue_manager` | Paginated inventory_log view |
| `admin.rateParity.list` | `revenue_manager+` | Unresolved rate_parity_alerts |

## Webhook Endpoints (REST, not tRPC)

| Endpoint | Source | Auth | Notes |
|---|---|---|---|
| `POST /api/webhooks/stripe` | Stripe | Signature header | Verify FIRST; write webhook_events; process |
| `POST /api/webhooks/ota` | SiteMinder/Cloudbeds | HMAC secret | Ingest into ota_bookings; map to bookings |
| `POST /api/webhooks/resend` | Resend | Signing secret | Update email_log status (opened, clicked, bounced) |
| `POST /api/csp-report` | Browser | None (public) | Log CSP violations for security monitoring |

---

# SECTION 10 — FRONTEND ARCHITECTURE COMPLETENESS

## Component Architecture Additions

| Component | Purpose | Implementation |
|---|---|---|
| `<ErrorBoundary>` | Catch render errors in booking funnel | React Error Boundary + Sentry `captureException` |
| `<SkeletonCard>` | Standardised loading state | CSS animation, matches room card layout exactly |
| `<Toast>` system | Non-blocking user feedback | Sonner — accessible, queue-aware, SSR-safe |
| `<CookieBanner>` | GDPR consent before analytics | Blocks PostHog until explicit consent; stores in cookie |
| `<MaintenancePage>` | Graceful downtime UX | Static export, served at edge via CF Worker |
| `<PrintLayout>` | Booking confirmation print view | `@media print` CSS, removes nav/footer |

## Missing Pages

| Route | Type | Purpose |
|---|---|---|
| `/404` | Static | Branded not-found page with search + homepage CTA |
| `/500` | Static | Branded error page with support contact |
| `/privacy` | ISR | Privacy policy, cookie policy, GDPR rights |
| `/terms` | ISR | Booking terms, cancellation policy, force majeure |
| `/accessibility` | Static | WCAG 2.2 AA compliance statement |
| `/sitemap.xml` | Dynamic | Auto-generated from room/category slugs |
| `/robots.txt` | Static | Block `/admin`, `/concierge`, `/dashboard` from crawlers |

## SEO Additions

```typescript
// Canonical URL on every filtered page to prevent duplicate content
export const metadata = {
  alternates: {
    canonical: `https://aurumhotel.com/rooms`,  // strip query params
    languages: { 'en': '/rooms', 'fr': '/fr/rooms', 'de': '/de/rooms' }
  }
}
```

## Accessibility (WCAG 2.2 AA) Specification

| Requirement | Implementation |
|---|---|
| Colour contrast ≥ 4.5:1 (text) | Gold `#C9A84C` on white `#FAFAF8` = **3.1:1** — FAILS at small sizes. Use `#A67C20` (darker gold) for body text on light backgrounds. |
| Focus management on modal open | `dialog` element with `autofocus` on first interactive element; return focus to trigger on close |
| Pannellum.js 360° gallery | Add keyboard arrow-key navigation + `aria-label="360 degree room view"` wrapper |
| Screen reader testing matrix | NVDA + Chrome (Windows), VoiceOver + Safari (macOS/iOS), TalkBack (Android) |
| Skip link | `<a href="#main-content" className="sr-only focus:not-sr-only">Skip to main content</a>` |
| Soft-lock expiry modal | `role="alertdialog"` with `aria-live="assertive"` — screen readers must announce immediately |

---

# SECTION 11 — TAX, LEGAL & COMPLIANCE LAYER

## Tax Handling Architecture

Tax is computed at booking commit time and stored immutably. It is **never recomputed** post-booking because rates change.

```
computeBookingTax(jurisdictionCode, roomTotal, addOnsTotal, nights)
  → query tax_rates WHERE jurisdiction = code AND is_active = true
  → for each applicable tax_type: compute amount
  → return { tax_amount: total, tax_breakdown: { VAT: x, city_tax: y, ... } }
```

| Tax Type | Example Jurisdictions | Applied To |
|---|---|---|
| VAT / GST | GB (20%), EU (varies), AU (10%) | room_rate + add_ons |
| Occupancy Tax | US states (varies 5–15%) | room_rate only |
| City / Tourism Tax | Amsterdam €3/night, Paris 5% | room_rate only |
| Tourism Levy | Some Caribbean / Asia markets | room_rate only |

> **CRITICAL:** The `bookings` table must have `tax_amount NUMERIC(12,2)` and `tax_breakdown JSONB` columns added in migration `001`. The `total_amount` field must equal `room_subtotal + addons_subtotal + tax_amount`.

## VAT Invoice Generation

- Every confirmed booking generates a VAT-compliant PDF invoice via React PDF (`@react-pdf/renderer`).
- Invoice contains: property VAT registration number, guest billing address, itemised charges, tax line per type, total in booking currency.
- Stored in S3 / Cloudflare R2 with a signed URL in the guest dashboard.
- Required for business travelers in EU/UK for expense claims.

## Legal Pages Content Requirements

| Page | Required Sections |
|---|---|
| Privacy Policy | Data collected, retention periods, third-party processors (Stripe, Cloudflare, Supabase), GDPR rights (access, erasure, portability), cookie categories, DPO contact |
| Terms of Service | Booking conditions, cancellation/refund policy, force majeure, liability limits, governing law |
| Accessibility Statement | WCAG 2.2 AA target, known limitations, feedback channel, last audit date |
| Cookie Policy | Strictly necessary vs. analytics vs. marketing, opt-out mechanism, Resend tracking pixel disclosure |

## Data Residency

| Service | Region | GDPR Implication |
|---|---|---|
| Supabase (Postgres) | EU (Frankfurt) `eu-central-1` | Required for EU guest data under GDPR Article 44 |
| Upstash Redis | EU region | Session/lock data stays in EU |
| Cloudflare | Global edge | Standard Cloudflare DPA covers EU compliance |
| Resend | EU endpoints | GDPR-compliant if EU data center selected |
| Sentry | EU-hosted DSN | Required: `sentry.io/for/eu` endpoint |

---

# SECTION 12 — TEST STRATEGY & QUALITY GATES

## Coverage Targets

| Layer | Tool | Target Coverage | Critical Paths |
|---|---|---|---|
| Unit (business logic) | Vitest | ≥ 80% | `computeNightlyRate`, promo validation, refund policy calc |
| Integration (API + DB) | Vitest + test DB | ≥ 70% | `availability.check`, `bookings.create` transaction |
| E2E (user flows) | Playwright | 100% of critical paths | Full booking funnel, admin login, cancellation flow |
| Load testing | k6 | Booking p99 < 800ms at 500 VU | Concurrent checkout simulation |
| Accessibility | axe-core + Playwright | 0 critical violations | All pages in booking funnel |

## Critical Unit Tests

```
computeNightlyRate()
  ✓ Single-night rate: no seasonal modifier
  ✓ Multi-night: stay spans two pricing periods → correct per-night sum
  ✓ Occupancy > 85%: Fibonacci surge applied, capped at 1.5x
  ✓ Loyalty tier gold: 5% discount applied after demand modifier
  ✓ Monetary output uses Decimal.js, not float

bookings.create (integration)
  ✓ Happy path: atomic commit → booking + inventory_log + email job queued
  ✓ Concurrent checkout: second request blocked by DB EXCLUDE constraint
  ✓ Redis soft-lock expired: booking rejected with LOCK_EXPIRED error
  ✓ Stripe payment_intent mismatch: transaction rolled back cleanly
  ✓ DB failure mid-transaction: inventory_log NOT partially written

promos.validate
  ✓ Valid code: correct discount computed
  ✓ Expired code: rejected with PROMO_EXPIRED
  ✓ Max uses reached: rejected with PROMO_EXHAUSTED
  ✓ Min order not met: rejected with PROMO_MIN_ORDER
```

## Load Test Plan (k6)

```javascript
// Target: 500 concurrent users hitting availability check + booking funnel
export const options = {
  stages: [
    { duration: '2m', target: 100 },   // ramp up
    { duration: '5m', target: 500 },   // sustained peak
    { duration: '2m', target: 0 },     // ramp down
  ],
  thresholds: {
    'http_req_duration{url:/api/availability}': ['p99<120'],
    'http_req_duration{url:/api/bookings}':     ['p99<800'],
    'http_req_failed': ['rate<0.01'],           // <1% error rate
  },
};
```

## CI Quality Gates (must ALL pass before deploy)

```yaml
gates:
  - lint-typecheck:    eslint --max-warnings 0 && tsc --noEmit
  - unit-tests:        vitest run --coverage --reporter=verbose
  - coverage-check:    coverage >= 80% lines (fail build if below)
  - integration-tests: vitest run --config vitest.integration.ts
  - e2e-tests:         playwright test --project=chromium,firefox,webkit
  - accessibility:     playwright test --grep @a11y
  - sast:              semgrep --config=auto src/
  - secret-scan:       gitleaks detect --source .
  - load-test:         k6 run --quiet tests/load/booking-funnel.js (staging only)
```

---

# SECTION 13 — INTERNATIONALISATION & LOCALISATION

## i18n Architecture

| Layer | Technology | Rationale |
|---|---|---|
| i18n framework | `next-intl` | Native Next.js 15 App Router support, RSC-compatible, no client bundle overhead |
| Translation storage | JSON files in `/messages/{locale}.json` | Simple, git-trackable, no CMS dependency for Phase 1 |
| Currency formatting | `Intl.NumberFormat` (browser native) | Zero dependency, correct locale-aware decimal/thousands separators |
| Date formatting | `date-fns` + locale imports | Already in tech stack (Phase 3); consistent with admin panel |
| Routing | `/[locale]/...` path prefix | `en` (default), `fr`, `de`, `ar` — locale in URL for SEO |

## Supported Locales — Phase 2

| Locale | Language | Currency | Date Format | RTL |
|---|---|---|---|---|
| `en` | English | USD / GBP (geo) | MM/DD/YYYY | No |
| `fr` | French | EUR | DD/MM/YYYY | No |
| `de` | German | EUR | DD.MM.YYYY | No |
| `ar` | Arabic | AED / SAR (geo) | DD/MM/YYYY | **Yes** |

> **RTL Support:** Add `dir="rtl"` to `<html>` for Arabic locale. Use CSS logical properties (`margin-inline-start` instead of `margin-left`) throughout. Tailwind supports RTL via `rtl:` variant.

## Translation Namespace Structure

```
/messages/
  en.json   → { "booking": { "cta": "Book Now", ... }, "nav": {...}, "errors": {...} }
  fr.json   → { "booking": { "cta": "Réserver", ... }, ... }
  de.json   → { "booking": { "cta": "Jetzt buchen", ... }, ... }
  ar.json   → { "booking": { "cta": "احجز الآن", ... }, ... }
```

## Geo-IP Locale Detection (Cloudflare Worker)

```typescript
// workers/locale-edge.ts — runs before Next.js middleware
const countryToLocale: Record<string, string> = {
  FR: 'fr', DE: 'de', AT: 'de', CH: 'de',
  AE: 'ar', SA: 'ar', QA: 'ar', KW: 'ar',
};
const locale = countryToLocale[request.cf?.country ?? ''] ?? 'en';
// Set Accept-Language header → next-intl picks it up in middleware
```

---

## PROMPT PART 5 OF 5 — Production Additions Implementation

```
You are a Senior Full-Stack Engineer completing the final production layer of
"Aurum Hotel OS". This is Part 5 of 5. Parts 1–4 are complete. You are now
implementing all production additions identified in Sections 08–13.

## DELIVERABLES — Build exactly these:

### 1. Database Migration: `supabase/migrations/003_production_additions.sql`
- All new tables: add_ons, booking_add_ons, promo_codes, promo_redemptions,
  staff, staff_roles, webhook_events, ota_bookings, media_assets, email_log,
  tax_rates, rate_parity_alerts
- ALTER TABLE bookings ADD COLUMN tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN tax_breakdown JSONB NOT NULL DEFAULT '{}'
- All new ENUMs: addon_category_enum, addon_pricing_enum, addon_status_enum,
  promo_type_enum, webhook_source_enum, media_type_enum, email_status_enum
- Seed data: 5 staff_roles with correct permissions JSONB
- Indexes: media_assets(entity_type, entity_id), email_log(booking_id),
  webhook_events(idempotency_key), ota_bookings(ota_source, ota_reference)

### 2. Tax Engine: `src/lib/tax.ts`
- `computeBookingTax(jurisdictionCode, roomTotal, addOnsTotal, nights)`
- Queries tax_rates table for active rules matching jurisdiction
- Returns { tax_amount: Decimal, tax_breakdown: Record<string, Decimal> }
- Uses Decimal.js only — never floats
- Integrates into bookings.create atomic transaction (before INSERT)

### 3. Promo Engine: `src/server/routers/promos.ts`
- `promos.validate` procedure: check code validity, expiry, usage limits,
  min_order, min_nights, applicable_categories
- Returns { valid: boolean, discount_amount: Decimal, error_code?: string }
- Error codes: PROMO_EXPIRED | PROMO_EXHAUSTED | PROMO_MIN_ORDER |
  PROMO_MIN_NIGHTS | PROMO_INVALID | PROMO_CATEGORY_MISMATCH
- Atomically increments uses_count with SELECT ... FOR UPDATE to prevent
  race conditions on popular promo codes

### 4. RBAC Middleware: `src/lib/rbac.ts`
- `requirePermission(permission: string)` — tRPC middleware factory
- Resolves staff.role_id → staff_roles.permissions JSONB
- Throws TRPCError({ code: 'FORBIDDEN' }) if permission not in role
- Caches resolved permissions in Redis per staff session (TTL: 15min)
- Usage: `protectedProcedure.use(requirePermission('pricing.write'))`

### 5. i18n Setup: `src/i18n/` directory
- `request.ts` — next-intl locale resolution from URL + CF geo header
- `routing.ts` — defineRouting({ locales: ['en','fr','de','ar'], defaultLocale: 'en' })
- `messages/en.json` — complete English translations for all UI strings
- `messages/fr.json`, `messages/de.json`, `messages/ar.json` — base translations
- Middleware integration: add locale detection to `src/middleware.ts`

### 6. VAT Invoice Generator: `src/lib/invoice.ts`
- Uses @react-pdf/renderer
- `generateInvoice(booking, guest, addOns, taxBreakdown)` → Buffer (PDF)
- Template: Aurum branding, property VAT number, itemised charges, tax lines
- Upload to Cloudflare R2, return signed URL (1yr expiry)
- Triggered in booking-confirmation BullMQ job after email send

### 7. Webhook Idempotency: update `src/lib/stripe-webhook.ts`
- Before any processing: INSERT into webhook_events (idempotency_key = stripe_event_id)
- ON CONFLICT (idempotency_key) DO NOTHING → return 200 immediately
- After successful processing: UPDATE webhook_events SET processed=true

### 8. Frontend Additions:
- `src/components/ui/error-boundary.tsx` — React Error Boundary with Sentry
- `src/components/ui/skeleton.tsx` — SkeletonCard matching RoomCard layout
- `src/components/ui/cookie-banner.tsx` — GDPR consent, blocks PostHog init
- `app/[locale]/layout.tsx` — locale-aware root layout with next-intl provider
- `app/not-found.tsx` — branded 404 page
- `app/error.tsx` — branded 500/error page
- `app/sitemap.ts` — dynamic sitemap from room_categories slugs
- `app/robots.ts` — blocks /admin, /concierge, /dashboard from crawlers

## CONSTRAINTS
- All new DB queries: parameterized only, no string interpolation
- Tax and promo amounts: Decimal.js only — never floats
- RBAC: every admin tRPC procedure MUST use requirePermission middleware
- i18n: all user-visible strings via next-intl t() — no hardcoded English
- Invoice PDF: must include property VAT registration number field
- Webhook idempotency: write webhook_events row BEFORE processing, ALWAYS

## OUTPUT FORMAT
Complete files:
- `supabase/migrations/003_production_additions.sql`
- `src/lib/tax.ts`
- `src/server/routers/promos.ts`
- `src/lib/rbac.ts`
- `src/i18n/request.ts`, `src/i18n/routing.ts`
- `src/i18n/messages/en.json` (complete), `fr.json`, `de.json`, `ar.json` (base)
- `src/lib/invoice.ts`
- `src/lib/stripe-webhook.ts` (updated with idempotency)
- `src/components/ui/error-boundary.tsx`
- `src/components/ui/skeleton.tsx`
- `src/components/ui/cookie-banner.tsx`
- `app/[locale]/layout.tsx`
- `app/not-found.tsx`
- `app/error.tsx`
- `app/sitemap.ts`
- `app/robots.ts`
```

---

*End of Aurum Hotel OS Blueprint — System Design v1.0 (Production Edition)*
*Sections 01–13 · Prompt Series Parts 1–5*
*Prepared for Senior Engineering & Product Teams*
*Classification: Internal — Confidential*
