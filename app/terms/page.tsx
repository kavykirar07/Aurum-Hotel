import type { Metadata } from "next";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";

export const metadata: Metadata = {
  title: "Terms of Service | Aurum Hotel",
  description: "Terms of Service for Aurum Hotel.",
};

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="pt-20">
        <section className="section bg-warm-white min-h-[70vh]">
          <div className="container max-w-3xl">
            <h1 className="text-display-lg text-charcoal mb-8 text-center">Terms of Service</h1>
            <div className="divider-gold mx-auto mb-12" />
            
            <div className="prose prose-stone max-w-none text-charcoal">
              <p className="lead">Last updated: January 1, 2026</p>
              
              <h2>1. Agreement to Terms</h2>
              <p>
                By accessing our website and utilizing our booking services, you agree to be bound by these Terms of Service. 
                If you do not agree with any part of these terms, you must refrain from using our services.
              </p>

              <h2>2. Reservations and Payment</h2>
              <p>
                All reservations are subject to availability. A valid credit card is required to secure your booking. 
                Full payment or a deposit may be charged at the time of booking depending on the selected rate plan and cancellation policy.
              </p>

              <h2>3. Cancellation Policy</h2>
              <p>
                Cancellations made more than 7 days prior to arrival are eligible for a full refund. 
                Cancellations made between 1 and 7 days prior are eligible for a 50% refund. 
                No-shows or cancellations within 24 hours of check-in will forfeit the entire booking amount.
              </p>

              <h2>4. Hotel Policies</h2>
              <p>
                Check-in time is 15:00 and check-out time is 12:00. Guests are responsible for any damages caused to hotel property during their stay. 
                Aurum Hotel is a smoke-free environment.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
