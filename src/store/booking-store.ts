// src/store/booking-store.ts
// Zustand booking funnel state — persisted to sessionStorage for page-refresh recovery

"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { PricingBreakdown } from "@/types/booking";

// ============================================================
// TYPES
// ============================================================

export interface AddOnSelection {
  id: string;
  slug: string;
  name: string;
  unit_price: string;
  quantity: number;
  pricing_model: "per_person" | "per_night" | "flat";
  total_price: string;
}

export interface GuestDetails {
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  nationality: string;
  special_requests: string;
}

export interface SelectedRoom {
  id: string;
  room_number: string;
  category_id: string;
  category_name: string;
  category_slug: string;
  max_occupancy: number;
}

// ============================================================
// STATE & ACTIONS
// ============================================================

interface BookingState {
  // Step management
  currentStep: 1 | 2 | 3 | 4;

  // Search params
  checkIn: string | null;
  checkOut: string | null;
  adults: number;
  children: number;

  // Selected room
  selectedRoom: SelectedRoom | null;

  // Computed pricing (fetched from API, stored here)
  pricing: PricingBreakdown | null;

  // Soft-lock state
  softLockAcquired: boolean;
  softLockExpiresAt: number | null; // Unix timestamp ms

  // Guest details (Step 1)
  guestDetails: Partial<GuestDetails>;
  isReturningGuest: boolean;

  // Add-ons (Step 2)
  selectedAddOns: AddOnSelection[];

  // Promo code
  promoCode: string;
  promoDiscount: string | null;

  // Payment (Step 3)
  stripePaymentIntentId: string | null;

  // Confirmed booking (Step 4)
  confirmedBookingRef: string | null;
  confirmedBookingId: string | null;

  // Actions
  setDates: (checkIn: string, checkOut: string) => void;
  setGuests: (adults: number, children: number) => void;
  setRoom: (room: SelectedRoom) => void;
  setPricing: (pricing: PricingBreakdown) => void;
  setSoftLock: (acquired: boolean) => void;
  setGuestDetails: (details: Partial<GuestDetails>) => void;
  setReturningGuest: (isReturning: boolean) => void;
  toggleAddOn: (addOn: AddOnSelection) => void;
  removeAddOn: (id: string) => void;
  setPromoCode: (code: string) => void;
  setPromoDiscount: (discount: string | null) => void;
  setStripePaymentIntent: (id: string) => void;
  setConfirmedBooking: (ref: string, id: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: 1 | 2 | 3 | 4) => void;
  reset: () => void;
}

// ============================================================
// INITIAL STATE
// ============================================================

const initialState: Omit<
  BookingState,
  | "setDates" | "setGuests" | "setRoom" | "setPricing" | "setSoftLock"
  | "setGuestDetails" | "setReturningGuest" | "toggleAddOn" | "removeAddOn"
  | "setPromoCode" | "setPromoDiscount" | "setStripePaymentIntent"
  | "setConfirmedBooking" | "nextStep" | "prevStep" | "goToStep" | "reset"
> = {
  currentStep: 1,
  checkIn: null,
  checkOut: null,
  adults: 2,
  children: 0,
  selectedRoom: null,
  pricing: null,
  softLockAcquired: false,
  softLockExpiresAt: null,
  guestDetails: {},
  isReturningGuest: false,
  selectedAddOns: [],
  promoCode: "",
  promoDiscount: null,
  stripePaymentIntentId: null,
  confirmedBookingRef: null,
  confirmedBookingId: null,
};

// ============================================================
// STORE
// ============================================================

export const useBookingStore = create<BookingState>()(
  persist(
    (set) => ({
      ...initialState,

      setDates: (checkIn, checkOut) => set({ checkIn, checkOut }),

      setGuests: (adults, children) => set({ adults, children }),

      setRoom: (room) => set({ selectedRoom: room }),

      setPricing: (pricing) => set({ pricing }),

      setSoftLock: (acquired) =>
        set({
          softLockAcquired: acquired,
          softLockExpiresAt: acquired ? Date.now() + 900_000 : null, // 15 min
        }),

      setGuestDetails: (details) =>
        set((state) => ({
          guestDetails: { ...state.guestDetails, ...details },
        })),

      setReturningGuest: (isReturning) => set({ isReturningGuest: isReturning }),

      toggleAddOn: (addOn) =>
        set((state) => {
          const exists = state.selectedAddOns.find((a) => a.id === addOn.id);
          if (exists) {
            return {
              selectedAddOns: state.selectedAddOns.filter((a) => a.id !== addOn.id),
            };
          }
          return { selectedAddOns: [...state.selectedAddOns, addOn] };
        }),

      removeAddOn: (id) =>
        set((state) => ({
          selectedAddOns: state.selectedAddOns.filter((a) => a.id !== id),
        })),

      setPromoCode: (code) => set({ promoCode: code }),

      setPromoDiscount: (discount) => set({ promoDiscount: discount }),

      setStripePaymentIntent: (id) => set({ stripePaymentIntentId: id }),

      setConfirmedBooking: (ref, id) =>
        set({ confirmedBookingRef: ref, confirmedBookingId: id }),

      nextStep: () =>
        set((state) => ({
          currentStep: Math.min(state.currentStep + 1, 4) as 1 | 2 | 3 | 4,
        })),

      prevStep: () =>
        set((state) => ({
          currentStep: Math.max(state.currentStep - 1, 1) as 1 | 2 | 3 | 4,
        })),

      goToStep: (step) => set({ currentStep: step }),

      reset: () => set({ ...initialState }),
    }),
    {
      name: "aurum-booking-store",
      storage: createJSONStorage(() => sessionStorage),
      // Only persist funnel data, not confirmed booking
      partialize: (state) => ({
        checkIn: state.checkIn,
        checkOut: state.checkOut,
        adults: state.adults,
        children: state.children,
        selectedRoom: state.selectedRoom,
        pricing: state.pricing,
        guestDetails: state.guestDetails,
        selectedAddOns: state.selectedAddOns,
        promoCode: state.promoCode,
        currentStep: state.currentStep,
      }),
    }
  )
);

// ============================================================
// SELECTORS
// ============================================================

/** Compute the current booking subtotal including add-ons and promo */
export function useBookingTotal() {
  return useBookingStore((state) => {
    const baseTotal = parseFloat(state.pricing?.total ?? "0");
    const addOnsTotal = state.selectedAddOns.reduce(
      (sum, a) => sum + parseFloat(a.total_price),
      0
    );
    const discount = parseFloat(state.promoDiscount ?? "0");
    return {
      baseTotal,
      addOnsTotal,
      discount,
      grandTotal: Math.max(0, baseTotal + addOnsTotal - discount),
    };
  });
}

/** Check if soft lock is still valid */
export function useSoftLockTtl() {
  return useBookingStore((state) => {
    if (!state.softLockExpiresAt) return 0;
    return Math.max(0, Math.floor((state.softLockExpiresAt - Date.now()) / 1000));
  });
}
