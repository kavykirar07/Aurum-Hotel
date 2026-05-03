"use client";

import { useEffect, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useBookingStore, useBookingTotal } from "@/store/booking-store";
import { StripeForm } from "./stripe-form";

// Load Stripe outside of component to avoid recreating the object on every render
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_mock_fallback"
);

export function Step3Payment() {
  const store = useBookingStore();
  const { grandTotal } = useBookingTotal();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function createIntent() {
      try {
        const res = await fetch("/api/stripe/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: grandTotal,
            currency: "usd",
            metadata: {
              room_id: store.selectedRoom?.id,
              check_in: store.checkIn,
              check_out: store.checkOut,
              adults: String(store.adults),
              children: String(store.children),
              guest_email: store.guestDetails.email,
              guest_first_name: store.guestDetails.first_name || "",
              guest_last_name: store.guestDetails.last_name || "",
              guest_phone: store.guestDetails.phone || "",
              special_requests: store.guestDetails.special_requests || "",
            },
          }),
        });

        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || "Failed to create payment intent");
        }

        setClientSecret(data.clientSecret);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "An unknown error occurred";
        setError(message);
      }
    }

    if (grandTotal > 0 && !clientSecret) {
      createIntent();
    }
  }, [grandTotal, store, clientSecret]);

  return (
    <div className="card p-8">
      <h2 className="text-display-md text-charcoal mb-2">Payment</h2>
      <p className="text-muted mb-8">Secure your reservation with a credit card.</p>

      {error ? (
        <div className="p-4 bg-red-50 text-error rounded-md border border-red-100 mb-6">
          <p className="font-medium">Initialization failed</p>
          <p className="text-sm mt-1">{error}</p>
          <p className="text-xs mt-3 opacity-80">
            Note: If you are running locally without Stripe keys, the backend will fail to initialize. 
            Please add Stripe keys to your .env.local file.
          </p>
        </div>
      ) : !clientSecret ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-4">
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-muted animate-pulse">Initializing secure payment gateway...</p>
        </div>
      ) : (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: "stripe",
              variables: {
                colorPrimary: "#B8860B", // Gold
                colorBackground: "#ffffff",
                colorText: "#2C3E50", // Charcoal
                fontFamily: "Inter, system-ui, sans-serif",
                borderRadius: "4px",
              },
            },
          }}
        >
          <StripeForm />
        </Elements>
      )}

      {error && (
        <div className="pt-6 border-t border-black/5 flex justify-between items-center">
          <button type="button" onClick={() => store.prevStep()} className="btn btn-ghost">
            Back
          </button>
        </div>
      )}
    </div>
  );
}
