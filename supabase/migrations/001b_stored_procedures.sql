-- ============================================================
-- Aurum Hotel OS — Stored Procedures for Atomic Operations
-- ============================================================
-- These functions run inside a single DB transaction.
-- Called via supabase.rpc() from the tRPC booking router.
-- ============================================================

-- ============================================================
-- create_booking_atomic
-- Atomically inserts a booking + inventory_log entry.
-- The DB exclusion constraint on bookings is the final guard
-- against double-booking — it will raise error code 23P01
-- if a conflict exists, which the application catches.
-- ============================================================

CREATE OR REPLACE FUNCTION create_booking_atomic(
  p_reference             VARCHAR(12),
  p_guest_id              UUID,
  p_room_id               UUID,
  p_check_in              DATE,
  p_check_out             DATE,
  p_adults                SMALLINT,
  p_children              SMALLINT,
  p_status                booking_status_enum,
  p_total_amount          NUMERIC(12,2),
  p_tax_amount            NUMERIC(12,2),
  p_tax_breakdown         JSONB,
  p_currency              CHAR(3),
  p_rate_snapshot         JSONB,
  p_stripe_payment_intent VARCHAR(40),
  p_source                booking_source_enum,
  p_special_requests      TEXT,
  p_actor_id              UUID,
  p_actor_type            VARCHAR(20)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER  -- runs as table owner, bypasses RLS for this operation
AS $$
DECLARE
  v_booking_id UUID;
  v_room_status room_status_enum;
BEGIN
  -- Lock the room row to prevent concurrent modifications
  SELECT status INTO v_room_status
  FROM rooms
  WHERE id = p_room_id
  FOR UPDATE;

  IF v_room_status IS NULL THEN
    RAISE EXCEPTION 'Room not found: %', p_room_id
      USING ERRCODE = 'P0001';
  END IF;

  IF v_room_status != 'available' THEN
    RAISE EXCEPTION 'Room is not available: status=%', v_room_status
      USING ERRCODE = 'P0002';
  END IF;

  -- INSERT booking (exclusion constraint fires here if conflict)
  INSERT INTO bookings (
    reference,
    guest_id,
    room_id,
    check_in,
    check_out,
    adults,
    children,
    status,
    total_amount,
    tax_amount,
    tax_breakdown,
    currency,
    rate_snapshot,
    stripe_payment_intent,
    source,
    special_requests
  ) VALUES (
    p_reference,
    p_guest_id,
    p_room_id,
    p_check_in,
    p_check_out,
    p_adults,
    p_children,
    p_status,
    p_total_amount,
    p_tax_amount,
    p_tax_breakdown,
    p_currency,
    p_rate_snapshot,
    p_stripe_payment_intent,
    p_source,
    p_special_requests
  )
  RETURNING id INTO v_booking_id;

  -- INSERT audit log entry (append-only, never fails silently)
  INSERT INTO inventory_log (
    room_id,
    booking_id,
    event_type,
    status_before,
    status_after,
    actor_id,
    actor_type,
    notes
  ) VALUES (
    p_room_id,
    v_booking_id,
    'booked',
    'available',
    'occupied',
    p_actor_id,
    p_actor_type,
    'Booking created: ' || p_reference
  );

  RETURN jsonb_build_object('booking_id', v_booking_id, 'reference', p_reference);
END;
$$;

-- ============================================================
-- cancel_booking_atomic
-- Atomically updates booking status + writes inventory_log.
-- Stripe refund is handled by the application layer.
-- ============================================================

CREATE OR REPLACE FUNCTION cancel_booking_atomic(
  p_booking_id      UUID,
  p_actor_id        UUID,
  p_actor_type      VARCHAR(20),
  p_refund_fraction NUMERIC(3,2)
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_room_id UUID;
  v_current_status booking_status_enum;
BEGIN
  -- Lock booking row
  SELECT room_id, status INTO v_room_id, v_current_status
  FROM bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF v_current_status IN ('cancelled', 'no_show', 'checked_out') THEN
    RAISE EXCEPTION 'Booking % cannot be cancelled from status %', p_booking_id, v_current_status
      USING ERRCODE = 'P0003';
  END IF;

  -- Update booking status
  UPDATE bookings
  SET status = 'cancelled'
  WHERE id = p_booking_id;

  -- Log the cancellation
  INSERT INTO inventory_log (
    room_id,
    booking_id,
    event_type,
    status_before,
    status_after,
    actor_id,
    actor_type,
    notes
  ) VALUES (
    v_room_id,
    p_booking_id,
    'cancelled',
    'occupied',
    'available',
    p_actor_id,
    p_actor_type,
    'Booking cancelled. Refund fraction: ' || p_refund_fraction::TEXT
  );
END;
$$;
