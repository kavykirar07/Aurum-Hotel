"use client";

import { useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useBookingStore } from "@/store/booking-store";

export function Step4Confirmation() {
  const store = useBookingStore();

  // Clear the soft lock from store since booking is confirmed
  useEffect(() => {
    if (store.softLockAcquired) {
      store.setSoftLock(false);
    }
  }, [store]);

  if (!store.confirmedBookingRef) {
    return <div className="p-8 text-center text-error">No confirmation data found.</div>;
  }

  return (
    <div className="card p-10 max-w-2xl mx-auto text-center border-t-4 border-t-gold">
      <div className="w-20 h-20 bg-gold-pale rounded-full flex items-center justify-center mx-auto mb-6">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-10 h-10 text-gold-dark">
          <path d="M20 6L9 17l-5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <p className="text-label text-gold mb-2">Reservation Confirmed</p>
      <h2 className="text-display-md text-charcoal mb-6">Thank you, {store.guestDetails.first_name}.</h2>
      
      <p className="text-muted leading-relaxed mb-8">
        Your reservation at Aurum Hotel has been successfully processed. 
        A confirmation email with your itinerary has been sent to <span className="font-medium text-charcoal">{store.guestDetails.email}</span>.
      </p>

      <div className="bg-warm-gray rounded-lg p-6 mb-8 text-left grid grid-cols-2 gap-6">
        <div>
          <p className="text-xs text-muted uppercase tracking-wider mb-1">Confirmation Number</p>
          <p className="font-mono text-lg font-medium text-charcoal tracking-widest">{store.confirmedBookingRef}</p>
        </div>
        <div>
          <p className="text-xs text-muted uppercase tracking-wider mb-1">Room</p>
          <p className="font-medium text-charcoal">{store.selectedRoom?.category_name}</p>
        </div>
        <div>
          <p className="text-xs text-muted uppercase tracking-wider mb-1">Check-in</p>
          <p className="font-medium text-charcoal">
            {store.checkIn && format(new Date(store.checkIn), "MMM do, yyyy")}
          </p>
          <p className="text-sm text-muted">After 3:00 PM</p>
        </div>
        <div>
          <p className="text-xs text-muted uppercase tracking-wider mb-1">Check-out</p>
          <p className="font-medium text-charcoal">
            {store.checkOut && format(new Date(store.checkOut), "MMM do, yyyy")}
          </p>
          <p className="text-sm text-muted">Before 11:00 AM</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link href="/" className="btn btn-gold">
          Return to Home
        </Link>
        <button 
          onClick={() => window.print()} 
          className="btn btn-outline flex items-center justify-center gap-2"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4">
            <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="6" y="14" width="12" height="8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Print Details
        </button>
      </div>
    </div>
  );
}
