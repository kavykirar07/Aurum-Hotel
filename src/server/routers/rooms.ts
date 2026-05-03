// src/server/routers/rooms.ts
// Room and room category queries

import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/trpc";
import { createServiceClient } from "@/lib/supabase";
import { TRPCError } from "@trpc/server";
import { computeNightlyRate } from "@/lib/pricing";

export const roomsRouter = createTRPCRouter({
  /**
   * List room categories with dynamic pricing for the given dates.
   * Backed by ISR — room pages are statically generated.
   */
  listCategories: publicProcedure
    .input(
      z.object({
        check_in: z.string().optional(),
        check_out: z.string().optional(),
        guests: z.number().int().min(1).max(20).optional(),
      })
    )
    .query(async ({ input }) => {
      const supabase = createServiceClient();

      const { data: categories, error } = await supabase
        .from("room_categories")
        .select("*, rooms(id, status)")
        .order("base_price", { ascending: true });

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      }

      // Enrich each category with dynamic pricing if dates provided
      const enriched = await Promise.all(
        (categories ?? []).map(async (cat) => {
          const availableRooms = (cat.rooms as { id: string; status: string }[]).filter(
            (r) => r.status === "available"
          );

          let fromPrice: string | null = null;
          if (input.check_in && input.check_out) {
            const priceResult = await computeNightlyRate(
              cat.id,
              input.check_in,
              input.check_out
            );
            fromPrice = priceResult.success ? priceResult.data.nightly_rate : null;
          }

          return {
            ...cat,
            rooms: undefined, // don't expose room list to client
            available_count: availableRooms.length,
            from_price: fromPrice ?? cat.base_price.toString(),
            scarcity_badge: availableRooms.length > 0 && availableRooms.length <= 2,
          };
        })
      );

      return enriched;
    }),

  /**
   * Get a single room category by slug with full media and availability.
   */
  getCategoryBySlug: publicProcedure
    .input(
      z.object({
        slug: z.string(),
        check_in: z.string().optional(),
        check_out: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const supabase = createServiceClient();

      const { data: category, error } = await supabase
        .from("room_categories")
        .select("*, rooms(id, room_number, floor, status, features)")
        .eq("slug", input.slug)
        .single();

      if (error || !category) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Room category not found" });
      }

      let pricing = null;
      if (input.check_in && input.check_out) {
        const priceResult = await computeNightlyRate(
          category.id,
          input.check_in,
          input.check_out
        );
        pricing = priceResult.success ? priceResult.data : null;
      }

      const availableRooms = (category.rooms as { id: string; status: string }[]).filter(
        (r) => r.status === "available"
      );

      return {
        ...category,
        pricing,
        available_count: availableRooms.length,
        available_rooms: availableRooms,
      };
    }),

  /**
   * Get a single room by ID with its category details.
   */
  getById: publicProcedure
    .input(z.object({ room_id: z.string().uuid() }))
    .query(async ({ input }) => {
      const supabase = createServiceClient();

      const { data, error } = await supabase
        .from("rooms")
        .select(
          "*, room_categories:category_id(id, slug, name, description, base_price, max_occupancy, size_sqm, amenities, media)"
        )
        .eq("id", input.room_id)
        .single();

      if (error || !data) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Room not found" });
      }

      return data;
    }),
});
