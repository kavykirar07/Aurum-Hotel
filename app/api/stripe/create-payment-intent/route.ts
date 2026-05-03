import { NextResponse } from "next/server";
import Stripe from "stripe";

// Initialize Stripe gracefully so it doesn't crash if the key is missing in dev mode.
const stripeKey = process.env.STRIPE_SECRET_KEY || "sk_test_mock";
const stripe = new Stripe(stripeKey, {
  apiVersion: "2026-04-22.dahlia", // Matches installed SDK definition
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, currency = "usd", metadata } = body;

    if (!amount) {
      return NextResponse.json({ error: "Amount is required" }, { status: 400 });
    }

    // Convert amount to smallest currency unit (e.g., cents)
    const amountInCents = Math.round(parseFloat(amount) * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id,
    });
  } catch (error: unknown) {
    console.error("Stripe error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
