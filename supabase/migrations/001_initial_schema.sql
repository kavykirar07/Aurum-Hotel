-- ============================================================
-- Aurum Hotel OS — Migration 001: Initial Schema
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist";
CREATE EXTENSION IF NOT EXISTS "citext";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE room_status_enum AS ENUM (
  'available', 'occupied', 'maintenance', 'out_of_order', 'blocked'
);

CREATE TYPE loyalty_tier_enum AS ENUM (
  'standard', 'silver', 'gold', 'platinum', 'black'
);

CREATE TYPE booking_status_enum AS ENUM (
  'pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'
);

CREATE TYPE booking_source_enum AS ENUM (
  'direct', 'ota', 'gds', 'phone', 'walk_in'
);

CREATE TYPE inv_event_enum AS ENUM (
  'booked', 'cancelled', 'checked_in', 'checked_out',
  'blocked', 'maintenance', 'ota_sync'
);

-- ============================================================
-- TABLE: room_categories
-- ============================================================

CREATE TABLE room_categories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          VARCHAR(60)  UNIQUE NOT NULL,
  name          VARCHAR(120) NOT NULL,
  description   TEXT,
  base_price    NUMERIC(10,2) NOT NULL CHECK (base_price > 0),
  max_occupancy SMALLINT NOT NULL CHECK (max_occupancy > 0),
  size_sqm      NUMERIC(6,1),
  amenities     JSONB,
  media         JSONB,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_room_categories_slug ON room_categories(slug);

-- ============================================================
-- TABLE: rooms
-- ============================================================

CREATE TABLE rooms (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id  UUID NOT NULL REFERENCES room_categories(id) ON DELETE RESTRICT,
  room_number  VARCHAR(10) UNIQUE NOT NULL,
  floor        SMALLINT NOT NULL,
  status       room_status_enum NOT NULL DEFAULT 'available',
  features     TEXT[],
  metadata     JSONB,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_rooms_category_id ON rooms(category_id);
CREATE INDEX idx_rooms_status      ON rooms(status);

-- ============================================================
-- TABLE: guests
-- ============================================================

CREATE TABLE guests (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email              CITEXT UNIQUE NOT NULL,
  first_name         VARCHAR(80) NOT NULL,
  last_name          VARCHAR(80) NOT NULL,
  phone              VARCHAR(20),
  nationality        CHAR(2),
  loyalty_tier       loyalty_tier_enum NOT NULL DEFAULT 'standard',
  loyalty_points     INTEGER NOT NULL DEFAULT 0,
  preferences        JSONB,
  gdpr_consent       JSONB,
  stripe_customer_id VARCHAR(40) UNIQUE,
  created_at         TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_guests_email ON guests(email);

-- ============================================================
-- TABLE: bookings
-- ============================================================

CREATE TABLE bookings (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference             VARCHAR(12) UNIQUE NOT NULL,
  guest_id              UUID NOT NULL REFERENCES guests(id) ON DELETE RESTRICT,
  room_id               UUID NOT NULL REFERENCES rooms(id)  ON DELETE RESTRICT,
  check_in              DATE NOT NULL,
  check_out             DATE NOT NULL CHECK (check_out > check_in),
  adults                SMALLINT NOT NULL DEFAULT 1 CHECK (adults > 0),
  children              SMALLINT NOT NULL DEFAULT 0 CHECK (children >= 0),
  status                booking_status_enum NOT NULL DEFAULT 'pending',
  total_amount          NUMERIC(12,2) NOT NULL,
  tax_amount            NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_breakdown         JSONB NOT NULL DEFAULT '{}',
  currency              CHAR(3)  NOT NULL DEFAULT 'USD',
  rate_snapshot         JSONB NOT NULL,
  stripe_payment_intent VARCHAR(40) UNIQUE,
  source                booking_source_enum NOT NULL DEFAULT 'direct',
  special_requests      TEXT,
  created_at            TIMESTAMPTZ DEFAULT now(),

  -- CRITICAL: DB-engine-level double-booking prevention
  CONSTRAINT no_double_booking EXCLUDE USING gist (
    room_id WITH =,
    daterange(check_in, check_out, '[)') WITH &&
  ) WHERE (status NOT IN ('cancelled', 'no_show'))
);

CREATE INDEX idx_bookings_guest_id   ON bookings(guest_id);
CREATE INDEX idx_bookings_room_id    ON bookings(room_id);
CREATE INDEX idx_bookings_status     ON bookings(status);
CREATE INDEX idx_bookings_check_in   ON bookings(check_in);
CREATE INDEX idx_bookings_reference  ON bookings(reference);
CREATE INDEX idx_bookings_dates_gist ON bookings USING gist (
  room_id,
  daterange(check_in, check_out, '[)')
) WHERE (status NOT IN ('cancelled', 'no_show'));

-- ============================================================
-- TABLE: seasonal_pricing
-- ============================================================

CREATE TABLE seasonal_pricing (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id    UUID NOT NULL REFERENCES room_categories(id) ON DELETE CASCADE,
  name           VARCHAR(80) NOT NULL,
  valid_from     DATE NOT NULL,
  valid_to       DATE NOT NULL CHECK (valid_to > valid_from),
  price_modifier NUMERIC(5,4) NOT NULL CHECK (price_modifier > 0),
  min_los        SMALLINT NOT NULL DEFAULT 1 CHECK (min_los > 0),
  priority       SMALLINT NOT NULL DEFAULT 0,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_seasonal_pricing_category ON seasonal_pricing(category_id);
CREATE INDEX idx_seasonal_pricing_dates    ON seasonal_pricing(valid_from, valid_to)
  WHERE is_active = true;

-- ============================================================
-- TABLE: inventory_log  (append-only audit ledger)
-- ============================================================

CREATE TABLE inventory_log (
  id             BIGSERIAL PRIMARY KEY,
  room_id        UUID NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
  booking_id     UUID REFERENCES bookings(id) ON DELETE SET NULL,
  event_type     inv_event_enum NOT NULL,
  status_before  room_status_enum,
  status_after   room_status_enum,
  actor_id       UUID,
  actor_type     VARCHAR(20),
  notes          TEXT,
  occurred_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_inventory_log_room_id    ON inventory_log(room_id);
CREATE INDEX idx_inventory_log_booking_id ON inventory_log(booking_id);
CREATE INDEX idx_inventory_log_event_type ON inventory_log(event_type);
CREATE INDEX idx_inventory_log_occurred   ON inventory_log(occurred_at DESC);

-- ============================================================
-- Row Level Security (guests see their own data only)
-- ============================================================

ALTER TABLE guests   ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Guest can read their own profile
CREATE POLICY guests_select_own
  ON guests FOR SELECT
  USING (auth.uid()::text = id::text);

-- Guest can update their own profile
CREATE POLICY guests_update_own
  ON guests FOR UPDATE
  USING (auth.uid()::text = id::text);

-- Guest can read their own bookings
CREATE POLICY bookings_select_own
  ON bookings FOR SELECT
  USING (
    guest_id = (
      SELECT id FROM guests WHERE id::text = auth.uid()::text
    )
  );

-- Service role bypasses RLS (for server-side operations)
CREATE POLICY service_role_bypass_guests
  ON guests FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY service_role_bypass_bookings
  ON bookings FOR ALL
  USING (auth.role() = 'service_role');
