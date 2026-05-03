import type { Metadata } from "next";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Spa & Wellness | Aurum Hotel",
  description: "Rejuvenate your mind and body at the award-winning Aurum Spa.",
};

export default function SpaPage() {
  return (
    <>
      <Navbar />

      <main className="pt-20">
        <section className="relative h-[60vh] flex items-center justify-center bg-charcoal overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/20 z-10" />
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center" />
          
          <div className="container relative z-20 text-center">
            <h1 className="text-display-hero text-white mb-4">Sanctuary of Serenity</h1>
            <div className="divider-gold mx-auto mb-6" />
            <p className="text-lg text-white/80 max-w-2xl mx-auto font-light">
              Escape the tempo of the city and discover a holistic retreat dedicated to your absolute well-being.
            </p>
          </div>
        </section>

        <section className="section bg-warm-white">
          <div className="container">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 aspect-[4/3] rounded-sm overflow-hidden relative shadow-xl">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600334129128-685054110de4?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center hover:scale-105 transition-transform duration-700" />
              </div>
              <div className="order-1 md:order-2">
                <p className="text-label text-gold mb-4 tracking-widest">The Aurum Spa</p>
                <h2 className="text-display-md text-charcoal mb-6">Holistic Healing</h2>
                <p className="text-muted leading-relaxed mb-6">
                  Drawing inspiration from ancient wellness traditions and modern therapeutic techniques, 
                  our spa offers a comprehensive menu of treatments. From deep-tissue massages to bespoke 
                  facials using rare botanical extracts, every session is tailored to your unique needs.
                </p>
                <Link href="/contact" className="btn btn-gold">Inquire About Treatments</Link>
              </div>
            </div>
          </div>
        </section>

        <section className="section bg-charcoal text-white text-center">
          <div className="container max-w-4xl">
            <h2 className="text-display-md mb-12">Wellness Facilities</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-6 border border-white/10 rounded-lg bg-white/5">
                <h3 className="font-display text-xl text-gold mb-3">Thermal Suite</h3>
                <p className="text-white/70 text-sm leading-relaxed">
                  Experience contrasting temperatures with our hydrotherapy pools, saunas, and snow cabin to stimulate circulation.
                </p>
              </div>
              <div className="p-6 border border-white/10 rounded-lg bg-white/5">
                <h3 className="font-display text-xl text-gold mb-3">Fitness Studio</h3>
                <p className="text-white/70 text-sm leading-relaxed">
                  State-of-the-art cardiovascular and strength equipment, available 24/7 exclusively for our guests.
                </p>
              </div>
              <div className="p-6 border border-white/10 rounded-lg bg-white/5">
                <h3 className="font-display text-xl text-gold mb-3">Yoga Pavilion</h3>
                <p className="text-white/70 text-sm leading-relaxed">
                  Join complimentary morning sessions or book a private instructor in our tranquil, light-filled studio.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
