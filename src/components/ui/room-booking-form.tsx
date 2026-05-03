"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, addDays } from "date-fns";
import { useBookingStore } from "@/store/booking-store";
import { trpc } from "@/lib/trpc-client";
import type { RoomCategory } from "@/types/booking";

export function RoomBookingForm({
  category,
  initialCheckIn,
  initialCheckOut,
  initialGuests = 2,
  availableRooms,
}: {
  category: RoomCategory;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: number;
  availableRooms: { id: string; room_number: string; floor: number; status: string }[];
}) {
  const router = useRouter();
  const store = useBookingStore();
  const today = format(new Date(), "yyyy-MM-dd");
  const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");

  const [checkIn, setCheckIn] = useState(initialCheckIn ?? today);
  const [checkOut, setCheckOut] = useState(initialCheckOut ?? tomorrow);
  const [guests, setGuests] = useState(initialGuests);

  // We only run the query lazily when the user clicks "Check Availability"
  // so we don't spam the DB or locks on mount.
  const [isChecking, setIsChecking] = useState(false);
  const utils = trpc.useUtils();

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    setIsChecking(true);

    try {
      // Pick the first available room for this category
      if (availableRooms.length === 0) {
        alert("No rooms available in this category.");
        return;
      }
      
      const selectedRoom = availableRooms[0];
      if (!selectedRoom) return;

      const result = await utils.availability.check.fetch({
        room_id: selectedRoom.id,
        check_in: checkIn,
        check_out: checkOut,
        guests,
      });

      if (!result.available) {
        alert("Room is not available for these dates.");
        return;
      }

      if (!result.soft_lock_acquired) {
        alert("Room is currently held by another guest. Please try again later.");
        return;
      }

      // Populate store
      store.setDates(checkIn, checkOut);
      store.setGuests(guests, 0); // Assuming adults for now
      store.setRoom({
        id: selectedRoom.id,
        room_number: selectedRoom.room_number,
        category_id: category.id,
        category_name: category.name,
        category_slug: category.slug,
        max_occupancy: category.max_occupancy,
      });
      if (result.breakdown) {
        store.setPricing(result.breakdown);
      }
      store.setSoftLock(true);
      store.goToStep(1);

      // Navigate to booking funnel
      router.push("/book");
    } catch {
      alert("Error checking availability.");
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <div className="card-glass p-6 sticky top-24">
      <h3 className="font-display text-2xl text-charcoal mb-4">Reserve</h3>
      <div className="divider-gold mt-0 mb-6 w-12" />

      <form onSubmit={handleCheck} className="flex flex-col gap-4">
        <div>
          <label className="text-label text-muted block mb-1">Check-in</label>
          <input
            type="date"
            value={checkIn}
            min={today}
            onChange={(e) => {
              setCheckIn(e.target.value);
              if (e.target.value >= checkOut) {
                setCheckOut(format(addDays(new Date(e.target.value), 1), "yyyy-MM-dd"));
              }
            }}
            required
            className="input"
          />
        </div>

        <div>
          <label className="text-label text-muted block mb-1">Check-out</label>
          <input
            type="date"
            value={checkOut}
            min={checkIn}
            onChange={(e) => setCheckOut(e.target.value)}
            required
            className="input"
          />
        </div>

        <div>
          <label className="text-label text-muted block mb-1">Guests</label>
          <select
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className="input"
          >
            {Array.from({ length: category.max_occupancy }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "Guest" : "Guests"}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={isChecking || availableRooms.length === 0}
          className="btn btn-gold w-full mt-4"
        >
          {isChecking ? "Checking..." : availableRooms.length === 0 ? "Sold Out" : "Book Now"}
        </button>
      </form>
    </div>
  );
}
