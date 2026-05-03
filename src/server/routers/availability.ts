// src/server/routers/availability.ts
// Availability check: Redis cache → DB query → soft lock

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "@/server/trpc";
import { createServiceClient } from "@/lib/supabase";
import {
  getCachedAvailability,
  setCachedAvailability,
  acquireSoftLock,
} from "@/lib/redis";
import { computeNightlyRate } from "@/lib/pricing";
import { AvailabilityCheckInputSchema } from "@/types/booking";
import type { AvailabilityResult } from "@/types/booking";
import { nanoid } from "nanoid";

export const availabilityRouter = createTRPCRouter({
  /**
   * Check availability for a room over a date range.
   *
   * Flow:
   *   1. Validate input
   *   2. Check Redis availability cache (60s TTL)
   *   3. On cache miss: query Postgres
   *   4. If available: compute price + acquire soft lock
   *   5. Return { available, price, currency, breakdown, soft_lock_acquired }
   */
  check: publicProcedure
    .input(AvailabilityCheckInputSchema)
    .query(async ({ input }): Promise<AvailabilityResult> => {
      const { room_id, check_in, check_out } = input;

      // ── 1. Check Redis cache ──────────────────────────────
      const cached = await getCachedAvailability(room_id, check_in, check_out);
      let available: boolean;

      if (cached !== null) {
        available = cached;
      } else {
        // ── 2. DB check via exclusion constraint ──────────────
        const supabase = createServiceClient();

        // Fetch room + category in one query
        const { data: room, error: roomError } = await supabase
          .from("rooms")
          .select("id, category_id, status, max_occupancy:room_categories(max_occupancy)")
          .eq("id", room_id)
          .single();

        if (roomError || !room) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Room not found",
          });
        }

        if (room.status !== "available") {
          available = false;
        } else {
          // Check for conflicting bookings using the DB exclusion range
          const { count } = await supabase
            .from("bookings")
            .select("id", { count: "exact", head: true })
            .eq("room_id", room_id)
            .not("status", "in", '("cancelled","no_show")')
            .lt("check_in", check_out)   // booking starts before our checkout
            .gt("check_out", check_in);  // booking ends after our checkin

          available = (count ?? 0) === 0;
        }

        // ── 3. Cache the result ───────────────────────────────
        await setCachedAvailability(room_id, check_in, check_out, available);
      }

      if (!available) {
        return {
          available: false,
          price: null,
          currency: null,
          breakdown: null,
          soft_lock_acquired: false,
        };
      }

      // ── 4. Compute pricing ────────────────────────────────
      const supabase = createServiceClient();
      const { data: room } = await supabase
        .from("rooms")
        .select("category_id")
        .eq("id", room_id)
        .single();

      if (!room) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });
      }

      const priceResult = await computeNightlyRate(
        room.category_id,
        check_in,
        check_out
      );

      if (!priceResult.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: priceResult.error,
        });
      }

      // ── 5. Acquire soft lock ──────────────────────────────
      const sessionId = nanoid();
      const lockResult = await acquireSoftLock(room_id, check_in, check_out, sessionId);
      const softLockAcquired = lockResult.success && lockResult.data;

      return {
        available: true,
        price: priceResult.data.total,
        currency: priceResult.data.currency,
        breakdown: priceResult.data,
        soft_lock_acquired: softLockAcquired,
      };
    }),

  /**
   * Get soft lock TTL remaining (seconds) for a room+dates.
   * Used by the countdown timer in the booking funnel.
   */
  getLockTtl: publicProcedure
    .input(
      z.object({
        room_id: z.string().uuid(),
        check_in: z.string(),
        check_out: z.string(),
      })
    )
    .query(async ({ input }) => {
      const { getSoftLockTtl } = await import("@/lib/redis");
      const ttl = await getSoftLockTtl(input.room_id, input.check_in, input.check_out);
      return { ttl_seconds: ttl };
    }),
});
