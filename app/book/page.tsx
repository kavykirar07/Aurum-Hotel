
import { Footer } from "@/components/ui/footer";
import { FunnelOrchestrator } from "@/components/booking-funnel/funnel-orchestrator";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Complete Your Reservation | Aurum Hotel",
  robots: { index: false, follow: false }, // Don't index booking funnel
};

export default function BookPage() {
  return (
    <>
      {/* Hide full navbar links in funnel to reduce distraction, keep logo */}
      <header className="fixed top-0 left-0 right-0 z-[400] bg-white border-b border-black/5 h-20">
        <div className="container h-full flex items-center justify-center">
          <span className="font-display text-2xl font-light tracking-widest uppercase text-charcoal">
            Aurum
          </span>
        </div>
      </header>

      <main id="main-content" className="pt-20 pb-16 bg-warm-white min-h-screen">
        <FunnelOrchestrator />
      </main>

      <Footer />
    </>
  );
}
