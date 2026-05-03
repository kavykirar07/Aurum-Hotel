import { TRPCError } from "@trpc/server";
import { createTRPCRouter, adminProcedure } from "@/server/trpc";
import { z } from "zod";

export const adminRouter = createTRPCRouter({
  /**
   * Get hotel overview stats (bookings today, occupancy, etc.)
   */
  getOverviewStats: adminProcedure.query(async () => {
    // We can use ctx.supabase since adminProcedure uses the user's session,
    // but for administrative sweeping queries, service_role is sometimes better.
    // However, if RLS policies (e.g. service_role_bypass_bookings) are set up,
    // we should use the service client for cross-tenant/cross-guest data.
    // In trpc.ts we passed the normal supabase client. For Admin, we must bypass RLS.
    const { createServiceClient } = await import("@/lib/supabase");
    const adminSupabase = createServiceClient();

    const today = new Date().toISOString().split("T")[0];

    // Total bookings for today
    const { count: bookingsToday } = await adminSupabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .gte("created_at", `${today}T00:00:00Z`);

    // Arrivals today
    const { count: arrivalsToday } = await adminSupabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("check_in", today)
      .not("status", "in", '("cancelled", "no_show")');

    // Total revenue for confirmed upcoming/active bookings
    const { data: revenueData } = await adminSupabase
      .from("bookings")
      .select("total_amount")
      .not("status", "in", '("cancelled", "no_show")');

    const totalRevenue = revenueData?.reduce((sum, b) => sum + parseFloat(b.total_amount), 0) || 0;

    return {
      bookingsToday: bookingsToday || 0,
      arrivalsToday: arrivalsToday || 0,
      totalRevenue,
    };
  }),

  /**
   * Get all recent bookings across all guests
   */
  getRecentBookings: adminProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ input }) => {
      const { createServiceClient } = await import("@/lib/supabase");
      const adminSupabase = createServiceClient();

      const { data, error } = await adminSupabase
        .from("bookings")
        .select(`
          *,
          rooms:room_id (room_number, category_id, room_categories:category_id(name)),
          guests:guest_id (first_name, last_name, email)
        `)
        .order("created_at", { ascending: false })
        .limit(input.limit);

      if (error || !data) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch bookings" });
      }

      return data;
    }),

  /**
   * Modify seasonal pricing constraints
   */
  updatePricingModifier: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        price_modifier: z.number().min(0.1).max(5.0),
        is_active: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      const { createServiceClient } = await import("@/lib/supabase");
      const adminSupabase = createServiceClient();

      const { error } = await adminSupabase
        .from("seasonal_pricing")
        .update({
          price_modifier: input.price_modifier,
          is_active: input.is_active,
        })
        .eq("id", input.id);

      if (error) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update pricing" });
      }

      return { success: true };
    }),
});
