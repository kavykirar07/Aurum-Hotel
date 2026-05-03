import { NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase";
import { computeNightlyRate } from "@/lib/pricing";
import { sendBookingConfirmationEmail } from "@/lib/resend";
import { releaseSoftLock, invalidateAvailabilityCache } from "@/lib/redis";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_mock", {
  apiVersion: "2026-04-22.dahlia",
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || "whsec_mock";

// Helper to generate reference
function generateBookingReference(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let ref = "AUR-";
  for (let i = 0; i < 6; i++) {
    ref += chars[Math.floor(Math.random() * chars.length)];
  }
  return ref;
}

export async function POST(req: Request) {
  const body = await req.text();
  const sig = (await headers()).get("stripe-signature");

  let event: Stripe.Event;

  try {
    if (!sig) throw new Error("No signature");
    // In dev mode with mock keys, we skip strict signature validation if it fails
    // In production, this guarantees the payload is from Stripe
    try {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err: unknown) {
      if (endpointSecret === "whsec_mock") {
        event = JSON.parse(body) as Stripe.Event;
      } else {
        throw err;
      }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(`Webhook Error: ${msg}`);
    return NextResponse.json({ error: `Webhook Error: ${msg}` }, { status: 400 });
  }

  // Handle successful payment
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const metadata = paymentIntent.metadata;

    // Check if we have enough metadata to create a booking
    if (metadata.room_id && metadata.check_in && metadata.guest_email) {
      console.log(`[Webhook] Processing successful payment for Room ${metadata.room_id}`);
      
      const supabase = createServiceClient();
      
      try {
        // 1. Fetch room
        const { data: room } = await supabase
          .from("rooms")
          .select("category_id")
          .eq("id", metadata.room_id)
          .single();
          
        if (!room) throw new Error("Room not found");

        // 2. Upsert guest
        const { data: guest } = await supabase
          .from("guests")
          .upsert({
            email: metadata.guest_email.toLowerCase(),
            first_name: metadata.guest_first_name,
            last_name: metadata.guest_last_name,
            phone: metadata.guest_phone || null,
          }, { onConflict: "email" })
          .select("id")
          .single();

        if (!guest) throw new Error("Failed to upsert guest");

        // 3. Compute price
        const priceResult = await computeNightlyRate(
          room.category_id,
          metadata.check_in,
          metadata.check_out,
          guest.id,
          "USD"
        );

        if (!priceResult.success) throw new Error("Pricing failed");

        // 4. Generate Reference
        const reference = generateBookingReference();

        // 5. Create atomic booking via RPC
        const { error: bookingError } = await supabase.rpc("create_booking_atomic", {
          p_reference: reference,
          p_guest_id: guest.id,
          p_room_id: metadata.room_id,
          p_check_in: metadata.check_in,
          p_check_out: metadata.check_out,
          p_adults: parseInt(metadata.adults || "1", 10),
          p_children: parseInt(metadata.children || "0", 10),
          p_status: "confirmed", // Set immediately to confirmed
          p_total_amount: priceResult.data.total,
          p_tax_amount: "0",
          p_tax_breakdown: {},
          p_currency: "USD",
          p_rate_snapshot: priceResult.data,
          p_stripe_payment_intent: paymentIntent.id,
          p_source: "web_webhook",
          p_special_requests: metadata.special_requests || null,
          p_actor_id: guest.id,
          p_actor_type: "guest",
        });

        if (bookingError) {
          // If 23P01 (Exclusion Constraint), it means the booking was already created by the client browser!
          // This is expected behavior if the browser didn't close. We just ignore it.
          if (bookingError.code !== "23P01") {
            throw bookingError;
          } else {
            console.log(`[Webhook] Booking already exists or room taken. Ignoring.`);
          }
        } else {
          console.log(`[Webhook] Successfully created booking ${reference}`);
          
          // Release locks & invalidate cache
          await releaseSoftLock(metadata.room_id, metadata.check_in, metadata.check_out, "any");
          await invalidateAvailabilityCache(metadata.room_id, metadata.check_in, metadata.check_out);

          // Fire off confirmation email
          sendBookingConfirmationEmail(
            metadata.guest_email,
            metadata.guest_first_name,
            reference,
            metadata.check_in,
            metadata.check_out,
            priceResult.data.total
          ).catch(e => console.error("Webhook email error", e));
        }
      } catch (err) {
        console.error("[Webhook] Failed to process booking:", err);
        // We still return 200 so Stripe doesn't retry endlessly if it's a hard DB error
      }
    }
  }

  return NextResponse.json({ received: true });
}
