"use client";

import { format } from "date-fns";
import { useBookingStore, useBookingTotal } from "@/store/booking-store";

export function OrderSummary() {
  const store = useBookingStore();
  const { baseTotal, discount, grandTotal } = useBookingTotal();

  if (!store.selectedRoom || !store.checkIn || !store.checkOut) return null;

  return (
    <div className="card p-6 sticky top-28 border border-black/5">
      <h3 className="font-display text-2xl text-charcoal mb-4">Your Stay</h3>
      <div className="divider-gold mt-0 mb-6 w-12" />

      {/* Stay Details */}
      <div className="mb-6 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted">Check-in</span>
          <span className="font-medium text-charcoal">{format(new Date(store.checkIn), "MMM do, yyyy")}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted">Check-out</span>
          <span className="font-medium text-charcoal">{format(new Date(store.checkOut), "MMM do, yyyy")}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted">Guests</span>
          <span className="font-medium text-charcoal">
            {store.adults} {store.adults === 1 ? "Adult" : "Adults"}
            {store.children > 0 ? `, ${store.children} Children` : ""}
          </span>
        </div>
        <div className="flex justify-between text-sm pt-3 border-t border-black/5">
          <span className="text-muted">Room</span>
          <span className="font-medium text-charcoal text-right">
            {store.selectedRoom.category_name}<br />
            <span className="text-xs text-muted font-normal">Room {store.selectedRoom.room_number}</span>
          </span>
        </div>
      </div>

      {/* Pricing Breakdown */}
      <div className="bg-warm-gray rounded-md p-4 mb-6 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted">Room Rate ({store.pricing?.nights || 0} nights)</span>
          <span className="text-charcoal">${baseTotal.toFixed(2)}</span>
        </div>
        
        {store.selectedAddOns.map((addon) => (
          <div key={addon.id} className="flex justify-between text-sm">
            <span className="text-muted">{addon.name}</span>
            <span className="text-charcoal">${parseFloat(addon.total_price).toFixed(2)}</span>
          </div>
        ))}

        {discount > 0 && (
          <div className="flex justify-between text-sm text-gold-dark">
            <span>Promo Code Applied</span>
            <span>-${discount.toFixed(2)}</span>
          </div>
        )}
        
        {/* Note: Tax is mocked as 0 for Part 1/2 as per blueprint, full tax engine in Part 5 */}
        <div className="flex justify-between text-sm">
          <span className="text-muted">Taxes &amp; Fees</span>
          <span className="text-charcoal">$0.00</span>
        </div>
      </div>

      <div className="flex justify-between items-end border-t border-black/10 pt-4">
        <div>
          <span className="block text-sm text-muted">Total</span>
          <span className="block text-xs text-muted">Includes all taxes and fees</span>
        </div>
        <span className="font-display text-3xl font-medium text-charcoal">
          ${grandTotal.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
