// src/lib/pricing.ts
// Dynamic pricing engine for Aurum Hotel OS
// CRITICAL: All monetary calculations use Decimal.js — never native floats

import Decimal from "decimal.js";
import { createServiceClient } from "@/lib/supabase";
import {
  getCachedPrice,
  setCachedPrice,
} from "@/lib/redis";
import type { PricingBreakdown, Result } from "@/types/booking";

// ============================================================
// DECIMAL CONFIGURATION
// ============================================================

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

// ============================================================
// LOYALTY DISCOUNT MAP
// ============================================================

const LOYALTY_DISCOUNTS: Record<string, Decimal> = {
  standard: new Decimal("0"),
  silver:   new Decimal("0"),
  gold:     new Decimal("0.05"),    // 5%
  platinum: new Decimal("0.10"),   // 10%
  black:    new Decimal("0.15"),   // 15%
};

// ============================================================
// FIBONACCI DEMAND SURGE SCHEDULE
// ============================================================

// Applied when occupancy > 85%. Each step ~Fibonacci-scaled.
// Capped at 1.5x as per blueprint.
const FIBONACCI_SURGE_STEPS = [
  new Decimal("1.05"),
  new Decimal("1.08"),
  new Decimal("1.13"),
  new Decimal("1.21"),
  new Decimal("1.34"),
  new Decimal("1.50"), // cap
];

function getDemandMultiplier(occupancyPct: number): Decimal {
  if (occupancyPct <= 85) return new Decimal("1");

  // Map occupancy 85–100% → Fibonacci steps 0–5
  const idx = Math.min(
    Math.floor(((occupancyPct - 85) / 15) * FIBONACCI_SURGE_STEPS.length),
    FIBONACCI_SURGE_STEPS.length - 1
  );
  return FIBONACCI_SURGE_STEPS[idx]!;
}

// ============================================================
// OCCUPANCY CALCULATOR
// ============================================================

async function getCategoryOccupancyPct(
  categoryId: string,
  checkIn: string,
  checkOut: string
): Promise<number> {
  const supabase = createServiceClient();

  // Count total rooms in category
  const { count: totalRooms } = await supabase
    .from("rooms")
    .select("id", { count: "exact", head: true })
    .eq("category_id", categoryId)
    .eq("status", "available");

  if (!totalRooms || totalRooms === 0) return 100; // treat as fully booked

  // Count occupied rooms for the date range
  const { count: occupiedRooms } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .in("status", ["confirmed", "checked_in"])
    .lte("check_in", checkOut)
    .gte("check_out", checkIn)
    .eq(
      "room_id",
      // subquery via filter: only rooms in this category
      supabase.from("rooms").select("id").eq("category_id", categoryId)
    );

  return ((occupiedRooms ?? 0) / totalRooms) * 100;
}

// ============================================================
// PER-NIGHT SEASONAL RULE LOOKUP
// ============================================================

interface SeasonalRule {
  name: string;
  price_modifier: string;
  priority: number;
}

async function getSeasonalRuleForDate(
  categoryId: string,
  date: string // YYYY-MM-DD
): Promise<SeasonalRule | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("seasonal_pricing")
    .select("name, price_modifier, priority")
    .eq("category_id", categoryId)
    .eq("is_active", true)
    .lte("valid_from", date)
    .gte("valid_to", date)
    .order("priority", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data as SeasonalRule;
}

// ============================================================
// DATE RANGE ITERATOR
// ============================================================

function* eachNight(checkIn: string, checkOut: string): Generator<string> {
  const current = new Date(checkIn);
  const end = new Date(checkOut);

  while (current < end) {
    yield current.toISOString().split("T")[0]!;
    current.setUTCDate(current.getUTCDate() + 1);
  }
}

// ============================================================
// MAIN PRICING FUNCTION
// ============================================================

/**
 * Compute the total price for a stay.
 *
 * CRITICAL: Rates are computed PER NIGHT, then summed.
 * A stay spanning two pricing periods will correctly apply
 * each period's modifier to its respective nights.
 *
 * @param categoryId  - room_categories.id
 * @param checkIn     - YYYY-MM-DD (inclusive)
 * @param checkOut    - YYYY-MM-DD (exclusive — checkout day)
 * @param guestId     - optional, for loyalty discount
 * @param currency    - ISO 4217 code
 */
export async function computeNightlyRate(
  categoryId: string,
  checkIn: string,
  checkOut: string,
  guestId?: string,
  currency = "USD"
): Promise<Result<PricingBreakdown>> {
  try {
    // Cache check — skip for guest-specific pricing (loyalty requires personalized calc)
    const cached = await getCachedPrice(categoryId, checkIn, checkOut);
    if (cached && !guestId) {
      // Only use cache for anonymous guests; loyalty requires guest-specific calc
      const parsed = JSON.parse(cached) as PricingBreakdown;
      return { success: true, data: parsed };
    }

    // ── 2. Fetch base price ───────────────────────────────────
    const supabase = createServiceClient();
    const { data: category, error: catError } = await supabase
      .from("room_categories")
      .select("base_price")
      .eq("id", categoryId)
      .single();

    if (catError || !category) {
      return { success: false, error: "Room category not found", code: "CATEGORY_NOT_FOUND" };
    }

    const basePrice = new Decimal(category.base_price);

    // ── 3. Fetch loyalty discount ─────────────────────────────
    let loyaltyDiscount = new Decimal("0");
    if (guestId) {
      const { data: guest } = await supabase
        .from("guests")
        .select("loyalty_tier")
        .eq("id", guestId)
        .single();

      if (guest) {
        loyaltyDiscount = LOYALTY_DISCOUNTS[guest.loyalty_tier] ?? new Decimal("0");
      }
    }

    // ── 4. Fetch occupancy (for demand surge) ─────────────────
    const occupancyPct = await getCategoryOccupancyPct(categoryId, checkIn, checkOut);
    const demandMultiplier = getDemandMultiplier(occupancyPct);

    // ── 5. Compute per-night rates ────────────────────────────
    const perNightBreakdown: PricingBreakdown["per_night_breakdown"] = [];
    let runningTotal = new Decimal("0");
    let totalSeasonalModifier = new Decimal("0");
    let nightCount = 0;

    for (const date of eachNight(checkIn, checkOut)) {
      nightCount++;

      // Get seasonal rule for this specific night
      const rule = await getSeasonalRuleForDate(categoryId, date);
      const seasonalModifier = rule
        ? new Decimal(rule.price_modifier)
        : new Decimal("1");

      // Apply modifiers: base × seasonal × demand × (1 - loyalty)
      const nightRate = basePrice
        .mul(seasonalModifier)
        .mul(demandMultiplier)
        .mul(new Decimal("1").minus(loyaltyDiscount))
        .toDecimalPlaces(2);

      runningTotal = runningTotal.plus(nightRate);
      totalSeasonalModifier = totalSeasonalModifier.plus(seasonalModifier);

      perNightBreakdown.push({
        date,
        rate: nightRate.toFixed(2),
        rule_name: rule?.name ?? null,
      });
    }

    if (nightCount === 0) {
      return { success: false, error: "Invalid date range — 0 nights", code: "INVALID_DATES" };
    }

    const avgSeasonalModifier = totalSeasonalModifier.div(nightCount);

    const breakdown: PricingBreakdown = {
      base_rate:         basePrice.toFixed(2),
      seasonal_modifier: avgSeasonalModifier.toFixed(4),
      demand_modifier:   demandMultiplier.toFixed(4),
      loyalty_discount:  loyaltyDiscount.toFixed(4),
      nightly_rate:      runningTotal.div(nightCount).toDecimalPlaces(2).toFixed(2),
      total:             runningTotal.toFixed(2),
      nights:            nightCount,
      currency,
      per_night_breakdown: perNightBreakdown,
    };

    // ── 6. Cache result (anonymous only) ─────────────────────
    if (!guestId) {
      await setCachedPrice(categoryId, checkIn, checkOut, JSON.stringify(breakdown));
    }

    return { success: true, data: breakdown };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown pricing error";
    return { success: false, error: message, code: "PRICING_ERROR" };
  }
}
