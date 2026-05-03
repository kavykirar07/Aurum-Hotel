import type { Metadata } from "next";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";

export const metadata: Metadata = {
  title: "Our Heritage | Aurum Hotel",
  description: "Discover the century-long legacy of Aurum Hotel.",
};

export default function AboutPage() {
  return (
    <>
      <Navbar />

      <main className="pt-20">
        <section className="relative h-[60vh] flex items-center justify-center bg-charcoal overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/30 z-10" />
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1578683010236-d716f9a3f461?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center" />
          
          <div className="container relative z-20 text-center">
            <h1 className="text-display-hero text-white mb-4">Our Heritage</h1>
            <div className="divider-gold mx-auto mb-6" />
            <p className="text-lg text-white/80 max-w-2xl mx-auto font-light">
              A century of uncompromising luxury and timeless elegance.
            </p>
          </div>
        </section>

        <section className="section bg-warm-white">
          <div className="container max-w-4xl text-center">
            <p className="text-label text-gold mb-4 tracking-widest">Est. 1921</p>
            <h2 className="text-display-md text-charcoal mb-8">A Legacy of Excellence</h2>
            <p className="text-muted leading-relaxed mb-6">
              Founded in the Roaring Twenties, Aurum Hotel was originally conceived as a private club for the global elite. 
              Its visionary founder, Arthur Pendleton, believed that true luxury lies not merely in opulent surroundings, 
              but in the flawless anticipation of every human desire.
            </p>
            <p className="text-muted leading-relaxed mb-12">
              Today, while our amenities have evolved to embrace the cutting-edge of modern comfort, our core philosophy remains untouched. 
              We are stewards of a timeless tradition of hospitality. Every marble pillar, every bespoke cocktail, and every hushed 
              hallway speaks to a commitment to absolute perfection.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center pt-12 border-t border-black/5">
              <div>
                <p className="font-display text-4xl text-gold mb-2">103</p>
                <p className="text-sm text-charcoal font-medium uppercase tracking-wider">Years of History</p>
              </div>
              <div>
                <p className="font-display text-4xl text-gold mb-2">5</p>
                <p className="text-sm text-charcoal font-medium uppercase tracking-wider">Forbes Stars</p>
              </div>
              <div>
                <p className="font-display text-4xl text-gold mb-2">42</p>
                <p className="text-sm text-charcoal font-medium uppercase tracking-wider">Exclusive Suites</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
