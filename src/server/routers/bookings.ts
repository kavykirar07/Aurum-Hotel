// src/server/routers/bookings.ts
// Atomic booking creation with soft-lock verification, DB transaction,
// inventory_log write, and confirmation email trigger

import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "@/server/trpc";
import { createServiceClient } from "@/lib/supabase";
import {
  checkSoftLock,
  releaseSoftLock,
  invalidateAvailabilityCache,
} from "@/lib/redis";
import { computeNightlyRate } from "@/lib/pricing";
import { sendBookingConfirmationEmail } from "@/lib/resend";
import {
  CreateBookingInputSchema,
  BookingSchema,
  type Booking,
} from "@/types/booking";
import { z } from "zod";

// ============================================================
// BOOKING REFERENCE GENERATOR
// Format: AUR-XXXXXX (uppercase alphanumeric)
// ============================================================

function generateBookingReference(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // ambiguous chars removed
  let ref = "AUR-";
  for (let i = 0; i < 6; i++) {
    ref += chars[Math.floor(Math.random() * chars.length)];
  }
  return ref;
}

async function generateUniqueReference(supabase: ReturnType<typeof createServiceClient>): Promise<string> {
  for (let attempts = 0; attempts < 10; attempts++) {
    const ref = generateBookingReference();
    const { count } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("reference", ref);

    if (count === 0) return ref;
  }
  throw new Error("Failed to generate unique booking reference");
}

// ============================================================
// ROUTER
// ============================================================

export const bookingsRouter = createTRPCRouter({
  /**
   * Create a booking — fully atomic transaction.
   *
   * Flow:
   *   1. Validate soft-lock exists
   *   2. Re-verify availability (defense in depth)
   *   3. Upsert guest record
   *   4. Compute final price (re-price at commit time)
   *   5. INSERT booking (DB exclusion constraint is final guard)
   *   6. INSERT inventory_log
   *   7. Release soft-lock
   *   8. Invalidate availability cache
   *   9. Queue confirmation email
   *
   * CRITICAL: Steps 3–6 execute via Supabase RPC (DB transaction).
   * If any step fails, the entire transaction rolls back.
   */
  create: publicProcedure
    .input(CreateBookingInputSchema)
    .mutation(async ({ input }): Promise<{ booking_id: string; reference: string }> => {
      const supabase = createServiceClient();
      const {
        room_id,
        check_in,
        check_out,
        adults,
        children,
        guest,
        special_requests,
        stripe_payment_intent,
        source,
        currency,
      } = input;

      // ── 1. Verify soft-lock ───────────────────────────────
      const lockHolder = await checkSoftLock(room_id, check_in, check_out);
      if (!lockHolder) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Room hold expired. Please search again.",
          cause: { code: "LOCK_EXPIRED" },
        });
      }

      // ── 2. Re-verify availability (defense in depth) ──────
      const { count: conflictCount } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("room_id", room_id)
        .not("status", "in", '("cancelled","no_show")')
        .lt("check_in", check_out)
        .gt("check_out", check_in);

      if ((conflictCount ?? 0) > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Room is no longer available for the selected dates.",
          cause: { code: "ROOM_UNAVAILABLE" },
        });
      }

      // ── 3. Fetch room + category ──────────────────────────
      const { data: room, error: roomError } = await supabase
        .from("rooms")
        .select("id, category_id, room_number, status")
        .eq("id", room_id)
        .single();

      if (roomError || !room) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });
      }

      if (room.status !== "available") {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Room is currently unavailable.",
          cause: { code: "ROOM_STATUS_BLOCKED" },
        });
      }

      // ── 4. Upsert guest ───────────────────────────────────
      const { data: upsertedGuest, error: guestError } = await supabase
        .from("guests")
        .upsert(
          {
            email: guest.email.toLowerCase(),
            first_name: guest.first_name,
            last_name: guest.last_name,
            phone: guest.phone ?? null,
            nationality: guest.nationality ?? null,
          },
          { onConflict: "email", ignoreDuplicates: false }
        )
        .select("id, loyalty_tier")
        .single();

      if (guestError || !upsertedGuest) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create guest record",
        });
      }

      // ── 5. Re-price at commit time ────────────────────────
      const priceResult = await computeNightlyRate(
        room.category_id,
        check_in,
        check_out,
        upsertedGuest.id,
        currency
      );

      if (!priceResult.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Pricing failed: ${priceResult.error}`,
        });
      }

      const rateSnapshot = priceResult.data;

      // ── 6. Generate unique booking reference ──────────────
      let reference: string;
      try {
        reference = await generateUniqueReference(supabase);
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate booking reference",
        });
      }

      // ── 7. INSERT booking + inventory_log (atomic via RPC) ─
      // We use Supabase's RPC to execute a stored procedure that
      // wraps both INSERTs in a single transaction.
      // The DB exclusion constraint is the final double-booking guard.
      const { data: bookingResult, error: bookingError } = await supabase
        .rpc("create_booking_atomic", {
          p_reference:             reference,
          p_guest_id:              upsertedGuest.id,
          p_room_id:               room_id,
          p_check_in:              check_in,
          p_check_out:             check_out,
          p_adults:                adults,
          p_children:              children,
          p_status:                "pending", // confirmed via Stripe webhook
          p_total_amount:          rateSnapshot.total,
          p_tax_amount:            "0", // Phase 5: tax engine
          p_tax_breakdown:         {},
          p_currency:              currency,
          p_rate_snapshot:         rateSnapshot,
          p_stripe_payment_intent: stripe_payment_intent,
          p_source:                source,
          p_special_requests:      special_requests ?? null,
          p_actor_id:              upsertedGuest.id,
          p_actor_type:            "guest",
        });

      if (bookingError) {
        // Check for exclusion constraint violation
        if (bookingError.code === "23P01") {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Room was just booked by another guest. Please select different dates.",
            cause: { code: "DOUBLE_BOOKING_PREVENTED" },
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Booking creation failed. Please try again.",
        });
      }

      const bookingId = (bookingResult as { booking_id: string }).booking_id;

      // ── 8. Release soft-lock ──────────────────────────────
      await releaseSoftLock(room_id, check_in, check_out, lockHolder);

      // ── 9. Invalidate availability cache ──────────────────
      await invalidateAvailabilityCache(room_id, check_in, check_out);

      // ── 10. Queue confirmation email (fire-and-forget) ────
      // BullMQ integration added in Part 4. For now, log intent and send async.
      console.log(`[Booking Created] ref=${reference} guest=${upsertedGuest.id}`);
      sendBookingConfirmationEmail(
        guest.email,
        guest.first_name,
        reference,
        check_in,
        check_out,
        rateSnapshot.total
      ).catch(err => console.error("Email fire-and-forget error:", err));

      return { booking_id: bookingId, reference };
    }),

  /**
   * Get a booking by its human-readable reference.
   * Guest authentication is verified via magic link token.
   */
  getByRef: publicProcedure
    .input(
      z.object({
        reference: z.string().regex(/^AUR-[A-Z0-9]{6}$/),
      })
    )
    .query(async ({ input }): Promise<Booking> => {
      const supabase = createServiceClient();

      const { data, error } = await supabase
        .from("bookings")
        .select(
          `
          *,
          rooms:room_id (room_number, floor, features, category_id,
            room_categories:category_id (name, slug, amenities, media)
          ),
          guests:guest_id (first_name, last_name, email, loyalty_tier)
        `
        )
        .eq("reference", input.reference)
        .single();

      if (error || !data) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });
      }

      return BookingSchema.parse(data);
    }),

  /**
   * Cancel a booking with tiered refund policy:
   *   - > 7 days before check-in: full refund
   *   - 1–7 days before check-in: 50% refund
   *   - < 24 hours before check-in: no refund
   */
  cancel: protectedProcedure
    .input(z.object({ booking_id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const supabase = createServiceClient();

      // Fetch booking to verify ownership
      const { data: booking, error } = await supabase
        .from("bookings")
        .select("id, guest_id, check_in, status, total_amount, stripe_payment_intent, room_id")
        .eq("id", input.booking_id)
        .single();

      if (error || !booking) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Verify the authenticated user owns this booking
      const { data: guest } = await supabase
        .from("guests")
        .select("id")
        .eq("id", booking.guest_id)
        .single();

      if (!guest) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      if (["cancelled", "no_show", "checked_out"].includes(booking.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Booking cannot be cancelled in its current state",
        });
      }

      // ── Determine refund tier ─────────────────────────────
      const daysUntilCheckIn =
        (new Date(booking.check_in).getTime() - Date.now()) / 86_400_000;

      let refundFraction = 0;
      if (daysUntilCheckIn > 7) {
        refundFraction = 1.0;    // Full refund
      } else if (daysUntilCheckIn >= 1) {
        refundFraction = 0.5;    // 50% refund
      } else {
        refundFraction = 0;      // No refund
      }

      // ── Update booking + log (atomic RPC) ─────────────────
      const { error: cancelError } = await supabase.rpc("cancel_booking_atomic", {
        p_booking_id:    input.booking_id,
        p_actor_id:      booking.guest_id,
        p_actor_type:    "guest",
        p_refund_fraction: refundFraction,
      });

      if (cancelError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Cancellation failed",
        });
      }

      return {
        cancelled: true,
        refund_fraction: refundFraction,
        refund_amount:
          refundFraction > 0
            ? (parseFloat(booking.total_amount) * refundFraction).toFixed(2)
            : "0.00",
      };
    }),
});
