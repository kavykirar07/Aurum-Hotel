"use client";
// src/components/ui/availability-widget.tsx
// Inline availability search bar — hero section widget

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, addDays } from "date-fns";

interface AvailabilityWidgetProps {
  variant?: "hero" | "inline";
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: number;
}

export function AvailabilityWidget({
  variant = "hero",
  initialCheckIn,
  initialCheckOut,
  initialGuests = 2,
}: AvailabilityWidgetProps) {
  const router = useRouter();
  const today = format(new Date(), "yyyy-MM-dd");
  const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");

  const [checkIn, setCheckIn]   = useState(initialCheckIn  ?? today);
  const [checkOut, setCheckOut] = useState(initialCheckOut ?? tomorrow);
  const [guests, setGuests]     = useState(initialGuests);
  const [error, setError]       = useState<string | null>(null);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (new Date(checkOut) <= new Date(checkIn)) {
      setError("Check-out must be after check-in.");
      return;
    }

    const nights =
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000;
    if (nights > 365) {
      setError("Stay cannot exceed 365 nights.");
      return;
    }

    router.push(
      `/rooms?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`
    );
  }

  const isHero = variant === "hero";

  return (
    <form
      onSubmit={handleSearch}
      aria-label="Search room availability"
      className={`
        ${isHero
          ? "card-glass p-2 flex flex-col md:flex-row gap-2"
          : "flex flex-col md:flex-row gap-2 bg-warm-gray rounded-lg p-2"
        }
      `}
    >
      {/* Check-in */}
      <div className="flex-1 flex flex-col">
        <label
          htmlFor="widget-check-in"
          className="text-label text-muted px-3 pt-2 pb-1"
        >
          Check-in
        </label>
        <input
          id="widget-check-in"
          type="date"
          value={checkIn}
          min={today}
          onChange={(e) => {
            setCheckIn(e.target.value);
            // Auto-advance checkout if it's before new checkin
            if (e.target.value >= checkOut) {
              setCheckOut(
                format(addDays(new Date(e.target.value), 1), "yyyy-MM-dd")
              );
            }
          }}
          required
          className={`
            bg-transparent border-none outline-none px-3 pb-2 text-sm font-medium
            ${isHero ? "text-charcoal" : "text-charcoal"}
            cursor-pointer
          `}
          aria-label="Check-in date"
        />
      </div>

      <div className={`w-px self-stretch ${isHero ? "bg-black/10" : "bg-black/10"} hidden md:block`} />

      {/* Check-out */}
      <div className="flex-1 flex flex-col">
        <label
          htmlFor="widget-check-out"
          className="text-label text-muted px-3 pt-2 pb-1"
        >
          Check-out
        </label>
        <input
          id="widget-check-out"
          type="date"
          value={checkOut}
          min={checkIn}
          onChange={(e) => setCheckOut(e.target.value)}
          required
          className="bg-transparent border-none outline-none px-3 pb-2 text-sm font-medium text-charcoal cursor-pointer"
          aria-label="Check-out date"
        />
      </div>

      <div className="w-px self-stretch bg-black/10 hidden md:block" />

      {/* Guests */}
      <div className="flex-1 flex flex-col">
        <label
          htmlFor="widget-guests"
          className="text-label text-muted px-3 pt-2 pb-1"
        >
          Guests
        </label>
        <select
          id="widget-guests"
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
          className="bg-transparent border-none outline-none px-3 pb-2 text-sm font-medium text-charcoal cursor-pointer"
          aria-label="Number of guests"
        >
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? "Guest" : "Guests"}
            </option>
          ))}
        </select>
      </div>

      {/* CTA */}
      <button
        type="submit"
        className="btn btn-gold md:self-center md:mt-2 md:mb-1 px-8"
        aria-label="Search available rooms"
      >
        Search
      </button>

      {/* Inline error */}
      {error && (
        <p
          role="alert"
          aria-live="polite"
          className="col-span-full text-xs text-red-600 px-3 pb-2"
        >
          {error}
        </p>
      )}
    </form>
  );
}
