import type { Metadata } from "next";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Aurum Society | Loyalty Programme",
  description: "Join the Aurum Society, our exclusive loyalty programme offering unparalleled benefits.",
};

export default function LoyaltyPage() {
  return (
    <>
      <Navbar />
      <main className="pt-20">
        <section className="relative h-[50vh] flex items-center justify-center bg-charcoal overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/30 z-10" />
          <div className="absolute inset-0 bg-charcoal opacity-50" />
          <div className="container relative z-20 text-center">
            <p className="text-label text-gold mb-4 tracking-[0.3em] uppercase">Aurum Society</p>
            <h1 className="text-display-hero text-white mb-4">Loyalty Rewarded</h1>
            <div className="divider-gold mx-auto mb-6" />
          </div>
        </section>

        <section className="section bg-warm-white text-center">
          <div className="container max-w-4xl">
            <h2 className="text-display-md text-charcoal mb-8">Exclusive Privileges</h2>
            <p className="text-muted leading-relaxed mb-12">
              Membership in the Aurum Society grants you access to a world of exceptional privileges, including complimentary room upgrades, priority reservations at our Michelin-starred restaurants, and flexible check-in times.
            </p>
            
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="p-8 border border-black/5 bg-white rounded-lg">
                <h3 className="font-display text-xl text-charcoal mb-2">Silver</h3>
                <p className="text-sm text-gold uppercase tracking-wider mb-4">Entry Tier</p>
                <ul className="text-sm text-muted space-y-3 text-left">
                  <li>• Complimentary high-speed Wi-Fi</li>
                  <li>• Welcome amenity upon arrival</li>
                  <li>• Priority waitlist</li>
                </ul>
              </div>
              <div className="p-8 border-2 border-gold bg-white rounded-lg relative transform md:-translate-y-4 shadow-xl">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">Most Popular</div>
                <h3 className="font-display text-xl text-charcoal mb-2">Gold</h3>
                <p className="text-sm text-gold uppercase tracking-wider mb-4">10+ Nights</p>
                <ul className="text-sm text-muted space-y-3 text-left">
                  <li>• All Silver benefits</li>
                  <li>• Complimentary room upgrade</li>
                  <li>• 4PM Late check-out</li>
                  <li>• Daily complimentary breakfast</li>
                </ul>
              </div>
              <div className="p-8 border border-black/5 bg-charcoal rounded-lg">
                <h3 className="font-display text-xl text-white mb-2">Platinum</h3>
                <p className="text-sm text-gold uppercase tracking-wider mb-4">Invite Only</p>
                <ul className="text-sm text-white/70 space-y-3 text-left">
                  <li>• All Gold benefits</li>
                  <li>• Guaranteed suite upgrade</li>
                  <li>• 24/7 dedicated butler</li>
                  <li>• Private airport transfers</li>
                </ul>
              </div>
            </div>

            <Link href="/signin" className="btn btn-gold btn-lg">Join the Society</Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
