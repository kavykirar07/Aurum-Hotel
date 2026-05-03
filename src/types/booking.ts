// src/types/booking.ts
// Shared Zod schemas and TypeScript types for Aurum Hotel OS
// All monetary values use string representation to preserve Decimal.js precision

import { z } from "zod";

// ============================================================
// ENUMS
// ============================================================

export const RoomStatusEnum = z.enum([
  "available",
  "occupied",
  "maintenance",
  "out_of_order",
  "blocked",
]);
export type RoomStatus = z.infer<typeof RoomStatusEnum>;

export const LoyaltyTierEnum = z.enum([
  "standard",
  "silver",
  "gold",
  "platinum",
  "black",
]);
export type LoyaltyTier = z.infer<typeof LoyaltyTierEnum>;

export const BookingStatusEnum = z.enum([
  "pending",
  "confirmed",
  "checked_in",
  "checked_out",
  "cancelled",
  "no_show",
]);
export type BookingStatus = z.infer<typeof BookingStatusEnum>;

export const BookingSourceEnum = z.enum([
  "direct",
  "ota",
  "gds",
  "phone",
  "walk_in",
]);
export type BookingSource = z.infer<typeof BookingSourceEnum>;

export const InvEventEnum = z.enum([
  "booked",
  "cancelled",
  "checked_in",
  "checked_out",
  "blocked",
  "maintenance",
  "ota_sync",
]);
export type InvEvent = z.infer<typeof InvEventEnum>;

// ============================================================
// DATE HELPERS
// ============================================================

/** ISO date string (YYYY-MM-DD) validator */
export const IsoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD format")
  .refine((d) => !isNaN(new Date(d).getTime()), "Invalid date");

/** Validates check-in is today or future, check-out > check-in, max 365 days */
export const DateRangeSchema = z
  .object({
    check_in: IsoDateSchema,
    check_out: IsoDateSchema,
  })
  .refine(
    ({ check_in, check_out }) => new Date(check_out) > new Date(check_in),
    { message: "check_out must be after check_in", path: ["check_out"] }
  )
  .refine(
    ({ check_in }) => new Date(check_in) >= new Date(new Date().toISOString().split("T")[0]!),
    { message: "check_in cannot be in the past", path: ["check_in"] }
  )
  .refine(
    ({ check_in, check_out }) => {
      const nights =
        (new Date(check_out).getTime() - new Date(check_in).getTime()) /
        86_400_000;
      return nights <= 365;
    },
    { message: "Stay cannot exceed 365 nights", path: ["check_out"] }
  );

// ============================================================
// ROOM CATEGORY
// ============================================================

export const RoomCategorySchema = z.object({
  id: z.string().uuid(),
  slug: z.string().max(60),
  name: z.string().max(120),
  description: z.string().nullable(),
  base_price: z.string(), // Decimal as string
  max_occupancy: z.number().int().positive(),
  size_sqm: z.string().nullable(),
  amenities: z.record(z.string(), z.unknown()).nullable(),
  media: z.record(z.string(), z.unknown()).nullable(),
  created_at: z.string(),
});
export type RoomCategory = z.infer<typeof RoomCategorySchema>;

// ============================================================
// ROOM
// ============================================================

export const RoomSchema = z.object({
  id: z.string().uuid(),
  category_id: z.string().uuid(),
  room_number: z.string().max(10),
  floor: z.number().int(),
  status: RoomStatusEnum,
  features: z.array(z.string()).nullable(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  created_at: z.string(),
});
export type Room = z.infer<typeof RoomSchema>;

// ============================================================
// GUEST
// ============================================================

export const GuestPreferencesSchema = z.object({
  dietary: z.array(z.string()).optional(),
  room_preferences: z
    .object({
      floor: z.string().optional(),
      view: z.string().optional(),
      pillow_type: z.string().optional(),
      bed_type: z.string().optional(),
    })
    .optional(),
  comms_channel: z.enum(["email", "sms", "whatsapp"]).optional(),
  special_notes: z.string().optional(),
});
export type GuestPreferences = z.infer<typeof GuestPreferencesSchema>;

export const GuestSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  first_name: z.string().max(80),
  last_name: z.string().max(80),
  phone: z.string().max(20).nullable(),
  nationality: z.string().length(2).nullable(),
  loyalty_tier: LoyaltyTierEnum,
  loyalty_points: z.number().int().nonnegative(),
  preferences: GuestPreferencesSchema.nullable(),
  gdpr_consent: z.record(z.string(), z.unknown()).nullable(),
  stripe_customer_id: z.string().max(40).nullable(),
  created_at: z.string(),
});
export type Guest = z.infer<typeof GuestSchema>;

// ============================================================
// PRICING
// ============================================================

export const PricingBreakdownSchema = z.object({
  base_rate: z.string(),           // per-night base
  seasonal_modifier: z.string(),   // multiplier applied (e.g. "1.35")
  demand_modifier: z.string(),     // demand surge multiplier
  loyalty_discount: z.string(),    // discount fraction (e.g. "0.05")
  nightly_rate: z.string(),        // final per-night rate
  total: z.string(),               // total for stay
  nights: z.number().int(),
  currency: z.string().length(3),
  per_night_breakdown: z
    .array(
      z.object({
        date: IsoDateSchema,
        rate: z.string(),
        rule_name: z.string().nullable(),
      })
    )
    .optional(),
});
export type PricingBreakdown = z.infer<typeof PricingBreakdownSchema>;

// ============================================================
// BOOKING
// ============================================================

export const CreateBookingInputSchema = z
  .object({
    room_id: z.string().uuid(),
    check_in: IsoDateSchema,
    check_out: IsoDateSchema,
    adults: z.number().int().min(1).max(10),
    children: z.number().int().min(0).max(10).default(0),
    guest: z.object({
      email: z.string().email(),
      first_name: z.string().min(1).max(80),
      last_name: z.string().min(1).max(80),
      phone: z.string().max(20).optional(),
      nationality: z.string().length(2).optional(),
    }),
    special_requests: z.string().max(2000).optional(),
    promo_code: z.string().max(30).optional(),
    stripe_payment_intent: z.string().min(1),
    source: BookingSourceEnum.default("direct"),
    currency: z.string().length(3).default("USD"),
  })
  .merge(DateRangeSchema);
export type CreateBookingInput = z.infer<typeof CreateBookingInputSchema>;

export const BookingSchema = z.object({
  id: z.string().uuid(),
  reference: z.string().max(12),
  guest_id: z.string().uuid(),
  room_id: z.string().uuid(),
  check_in: z.string(),
  check_out: z.string(),
  adults: z.number().int(),
  children: z.number().int(),
  status: BookingStatusEnum,
  total_amount: z.string(),
  tax_amount: z.string(),
  tax_breakdown: z.record(z.string(), z.unknown()),
  currency: z.string().length(3),
  rate_snapshot: PricingBreakdownSchema,
  stripe_payment_intent: z.string().nullable(),
  source: BookingSourceEnum,
  special_requests: z.string().nullable(),
  created_at: z.string(),
});
export type Booking = z.infer<typeof BookingSchema>;

// ============================================================
// AVAILABILITY
// ============================================================

export const AvailabilityCheckInputSchema = z.object({
  room_id: z.string().uuid(),
  check_in: IsoDateSchema,
  check_out: IsoDateSchema,
  guests: z.number().int().min(1).max(10).optional(),
});
export type AvailabilityCheckInput = z.infer<typeof AvailabilityCheckInputSchema>;

export const AvailabilityResultSchema = z.object({
  available: z.boolean(),
  price: z.string().nullable(),
  currency: z.string().length(3).nullable(),
  breakdown: PricingBreakdownSchema.nullable(),
  soft_lock_acquired: z.boolean(),
});
export type AvailabilityResult = z.infer<typeof AvailabilityResultSchema>;

// ============================================================
// RESULT TYPE PATTERN (never throw from business logic)
// ============================================================

export type Result<T, E = string> =
  | { success: true; data: T }
  | { success: false; error: E; code?: string };

export function ok<T>(data: T): Result<T> {
  return { success: true, data };
}

export function err<E = string>(error: E, code?: string): Result<never, E> {
  return { success: false, error, code };
}
