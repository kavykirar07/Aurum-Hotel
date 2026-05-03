import type { Metadata } from "next";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dining | Aurum Hotel",
  description: "Experience world-class culinary artistry at Aurum Hotel's Michelin-starred restaurants and bespoke bars.",
};

export default function DiningPage() {
  return (
    <>
      <Navbar />

      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative h-[60vh] flex items-center justify-center bg-charcoal overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/30 z-10" />
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center" />
          
          <div className="container relative z-20 text-center">
            <h1 className="text-display-hero text-white mb-4">Culinary Artistry</h1>
            <div className="divider-gold mx-auto mb-6" />
            <p className="text-lg text-white/80 max-w-2xl mx-auto font-light">
              From dawn until dusk, indulge in a symphony of flavors crafted by our Michelin-starred culinary team.
            </p>
          </div>
        </section>

        {/* The Signature Restaurant */}
        <section className="section bg-warm-white">
          <div className="container">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-label text-gold mb-4 tracking-widest">Two Michelin Stars</p>
                <h2 className="text-display-md text-charcoal mb-6">L&apos;Orangerie</h2>
                <p className="text-muted leading-relaxed mb-6">
                  Our signature restaurant offers an avant-garde approach to classic European cuisine. 
                  Sourced from the finest local purveyors and seasonal harvests, every dish is a masterpiece 
                  designed to challenge and delight the palate.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-sm text-charcoal">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold"></span>
                    Dinner: Wednesday - Sunday, 18:00 - 22:30
                  </li>
                  <li className="flex items-center gap-3 text-sm text-charcoal">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold"></span>
                    Dress Code: Smart Elegant
                  </li>
                </ul>
                <button className="btn btn-gold">Reserve a Table</button>
              </div>
              <div className="aspect-[4/5] bg-charcoal rounded-sm overflow-hidden relative shadow-xl">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center hover:scale-105 transition-transform duration-700" />
              </div>
            </div>
          </div>
        </section>

        {/* The Lounge Bar */}
        <section className="section bg-charcoal text-white">
          <div className="container">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="aspect-square rounded-sm overflow-hidden relative shadow-xl order-2 md:order-1">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1543007630-9710e4a00a20?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center hover:scale-105 transition-transform duration-700" />
              </div>
              <div className="order-1 md:order-2">
                <p className="text-label text-gold mb-4 tracking-widest">Bespoke Mixology</p>
                <h2 className="text-display-md mb-6">The Onyx Bar</h2>
                <p className="text-white/70 leading-relaxed mb-6">
                  Step into an atmosphere of quiet sophistication. The Onyx Bar features rare spirits, 
                  custom infusions, and a curated selection of vintage cigars. Live jazz sets the mood 
                  every weekend evening.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-sm text-white/90">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold"></span>
                    Daily: 16:00 - 01:00
                  </li>
                </ul>
                <Link href="#" className="text-gold uppercase tracking-widest text-sm font-medium hover:underline underline-offset-4">View Menu</Link>
              </div>
            </div>
          </div>
        </section>

        {/* In-Room Dining */}
        <section className="section bg-cream text-center">
          <div className="container max-w-3xl">
            <h2 className="text-display-md text-charcoal mb-6">Private Dining</h2>
            <div className="divider-gold mx-auto mb-6" />
            <p className="text-muted leading-relaxed mb-8">
              Experience our culinary excellence from the comfort and privacy of your suite. 
              Our 24-hour in-room dining menu features selections from all our restaurants, 
              delivered with the same impeccable service you expect throughout Aurum.
            </p>
            <Link href="/rooms" className="btn btn-outline">Explore Our Suites</Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
