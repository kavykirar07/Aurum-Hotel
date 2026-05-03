import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { createServiceClient } from "@/lib/supabase";

export const dashboardRouter = createTRPCRouter({
  /**
   * Get all bookings for the currently authenticated user.
   * Matches bookings where the guest email equals the user's login email.
   * Uses service client to bypass RLS since guests.id isn't guaranteed to equal auth.uid().
   */
  getMyBookings: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user.email) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "User email required" });
    }

    const supabase = createServiceClient();

    // 1. Find guest records matching this email
    const { data: guests, error: guestError } = await supabase
      .from("guests")
      .select("id")
      .eq("email", ctx.user.email);

    if (guestError || !guests || guests.length === 0) {
      return { upcoming: [], past: [] }; // No guest record yet
    }

    const guestIds = guests.map((g) => g.id);

    // 2. Fetch bookings for these guest IDs
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select(`
        *,
        rooms:room_id (room_number, floor, features, category_id,
          room_categories:category_id (name, slug, amenities, media)
        ),
        guests:guest_id (first_name, last_name, email, loyalty_tier)
      `)
      .in("guest_id", guestIds)
      .order("check_in", { ascending: true });

    if (bookingsError || !bookings) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch bookings" });
    }

    // Categorize
    const now = new Date().toISOString();

    const upcoming = bookings.filter(
      (b) => b.check_out >= now && !["cancelled", "no_show"].includes(b.status)
    );
    
    const past = bookings.filter(
      (b) => b.check_out < now || ["cancelled", "no_show"].includes(b.status)
    );

    // Sort past bookings descending (most recent first)
    past.sort((a, b) => new Date(b.check_in).getTime() - new Date(a.check_in).getTime());

    return { upcoming, past };
  }),

  /**
   * Get user profile details
   */
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user.email) return null;

    const supabase = createServiceClient();
    const { data } = await supabase
      .from("guests")
      .select("first_name, last_name, email, phone, loyalty_tier, loyalty_points")
      .eq("email", ctx.user.email)
      .single();

    return data;
  }),
});
