"use client";

import { useState } from "react";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { useBookingStore, useBookingTotal } from "@/store/booking-store";
import { trpc } from "@/lib/trpc-client";

export function StripeForm() {
  const stripe = useStripe();
  const elements = useElements();
  const store = useBookingStore();
  const { grandTotal } = useBookingTotal();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const createBooking = trpc.bookings.create.useMutation({
    onSuccess: (data) => {
      store.setConfirmedBooking(data.reference, data.booking_id);
      store.nextStep();
    },
    onError: (error) => {
      setErrorMessage(`Booking creation failed: ${error.message}`);
      setIsProcessing(false);
    },
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setErrorMessage(null);

    // 1. Confirm the PaymentIntent with Stripe
    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required", // Prevent automatic redirect to allow atomic DB save
      confirmParams: {
        payment_method_data: {
          billing_details: {
            name: `${store.guestDetails.first_name} ${store.guestDetails.last_name}`,
            email: store.guestDetails.email,
            phone: store.guestDetails.phone || undefined,
          },
        },
      },
    });

    if (stripeError) {
      setErrorMessage(stripeError.message ?? "Payment failed.");
      setIsProcessing(false);
      return;
    }

    if (paymentIntent && paymentIntent.status === "succeeded") {
      // 2. Payment was successful, now atomically commit the booking to our DB
      if (!store.selectedRoom || !store.checkIn || !store.checkOut || !store.guestDetails.email) {
        setErrorMessage("Missing required booking information.");
        setIsProcessing(false);
        return;
      }

      createBooking.mutate({
        room_id: store.selectedRoom.id,
        check_in: store.checkIn,
        check_out: store.checkOut,
        adults: store.adults,
        children: store.children,
        guest: {
          email: store.guestDetails.email,
          first_name: store.guestDetails.first_name || "",
          last_name: store.guestDetails.last_name || "",
          phone: store.guestDetails.phone,
          nationality: store.guestDetails.nationality,
        },
        special_requests: store.guestDetails.special_requests,
        promo_code: store.promoCode,
        stripe_payment_intent: paymentIntent.id,
        currency: "USD",
      });
    } else {
      setErrorMessage("Payment requires further action or is not complete.");
      setIsProcessing(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 border border-black/10 rounded-md bg-white">
        <PaymentElement options={{ layout: "tabs" }} />
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 text-error text-sm rounded-md border border-red-100">
          {errorMessage}
        </div>
      )}

      <div className="bg-warm-gray p-4 rounded-md flex items-start gap-3">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5 text-gold shrink-0 mt-0.5">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeWidth="2" strokeLinejoin="round" />
        </svg>
        <p className="text-xs text-muted leading-relaxed">
          Your payment information is encrypted and securely processed by Stripe. 
          Aurum Hotel does not store your full credit card details. By clicking &quot;Confirm &amp; Pay&quot;, 
          you agree to our terms of service and cancellation policy.
        </p>
      </div>

      <div className="pt-6 border-t border-black/5 flex justify-between items-center">
        <button type="button" onClick={() => store.prevStep()} disabled={isProcessing} className="btn btn-ghost">
          Back
        </button>
        <button type="submit" disabled={isProcessing || !stripe || !elements} className="btn btn-gold">
          {isProcessing ? "Processing..." : `Confirm & Pay $${grandTotal.toFixed(2)}`}
        </button>
      </div>
    </form>
  );
}
