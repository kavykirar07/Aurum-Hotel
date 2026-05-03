import type { Metadata } from "next";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Experiences | Aurum Hotel",
  description: "Curated experiences and unparalleled concierge services at Aurum Hotel.",
};

export default function ExperiencesPage() {
  return (
    <>
      <Navbar />

      <main className="pt-20">
        <section className="relative h-[60vh] flex items-center justify-center bg-charcoal overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/30 z-10" />
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center" />
          
          <div className="container relative z-20 text-center">
            <h1 className="text-display-hero text-white mb-4">Unforgettable Moments</h1>
            <div className="divider-gold mx-auto mb-6" />
            <p className="text-lg text-white/80 max-w-2xl mx-auto font-light">
              Let our award-winning concierge team craft a bespoke itinerary tailored to your passions.
            </p>
          </div>
        </section>

        <section className="section bg-warm-white">
          <div className="container">
            <div className="text-center mb-16">
              <p className="text-label text-gold mb-4">Curated For You</p>
              <h2 className="text-display-md text-charcoal">Signature Experiences</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Experience 1 */}
              <div className="card group overflow-hidden">
                <div className="aspect-[16/9] relative bg-charcoal overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542314831-c6a4d14ca83c?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center group-hover:scale-105 transition-transform duration-700" />
                </div>
                <div className="p-8 bg-white border border-t-0 border-black/5">
                  <h3 className="font-display text-2xl text-charcoal mb-3">Private Yacht Charter</h3>
                  <p className="text-muted leading-relaxed mb-6">
                    Explore the coastline aboard our exclusive motor yacht. Complete with a private chef, 
                    champagne, and personalized navigational itinerary.
                  </p>
                  <Link href="/contact" className="text-gold uppercase tracking-widest text-sm font-medium hover:underline underline-offset-4">Inquire Now</Link>
                </div>
              </div>

              {/* Experience 2 */}
              <div className="card group overflow-hidden">
                <div className="aspect-[16/9] relative bg-charcoal overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center group-hover:scale-105 transition-transform duration-700" />
                </div>
                <div className="p-8 bg-white border border-t-0 border-black/5">
                  <h3 className="font-display text-2xl text-charcoal mb-3">Chef&apos;s Table Masterclass</h3>
                  <p className="text-muted leading-relaxed mb-6">
                    A behind-the-scenes culinary journey with our Executive Chef. Learn techniques, 
                    source local ingredients, and enjoy the fruits of your labor in a private dining room.
                  </p>
                  <Link href="/contact" className="text-gold uppercase tracking-widest text-sm font-medium hover:underline underline-offset-4">Inquire Now</Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section bg-charcoal text-center text-white">
          <div className="container max-w-3xl">
            <h2 className="text-display-md mb-6">The Golden Keys Concierge</h2>
            <div className="divider-gold mx-auto mb-6" />
            <p className="text-white/70 leading-relaxed mb-8">
              Our Les Clefs d&apos;Or certified concierge team possesses the ultimate black book. 
              Whether you desire impossible-to-get theater tickets, a private viewing at a closed art gallery, 
              or a helicopter transfer at a moment&apos;s notice—consider it done.
            </p>
            <Link href="/contact" className="btn btn-gold">Contact Concierge</Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
