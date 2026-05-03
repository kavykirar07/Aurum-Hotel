import type { Metadata } from "next";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";

export const metadata: Metadata = {
  title: "Press | Aurum Hotel",
  description: "Latest news, media coverage, and press releases for Aurum Hotel.",
};

export default function PressPage() {
  return (
    <>
      <Navbar />
      <main className="pt-20">
        <section className="section bg-warm-white min-h-[70vh]">
          <div className="container max-w-4xl">
            <div className="text-center mb-16">
              <h1 className="text-display-lg text-charcoal mb-4">Press Room</h1>
              <div className="divider-gold mx-auto mb-6" />
              <p className="text-muted leading-relaxed">
                Stay updated with the latest news, accolades, and media coverage from Aurum Hotel.
              </p>
            </div>
            
            <div className="space-y-8">
              {/* Press Item 1 */}
              <article className="bg-white p-8 border border-black/5 shadow-sm rounded-lg">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                  <h3 className="font-display text-2xl text-charcoal">Aurum Hotel Awarded 5 Forbes Travel Guide Stars</h3>
                  <span className="text-xs text-gold uppercase tracking-widest mt-2 md:mt-0">February 15, 2026</span>
                </div>
                <p className="text-muted leading-relaxed mb-4">
                  We are thrilled to announce that Aurum Hotel has been awarded the prestigious 5-Star rating by the Forbes Travel Guide, cementing our status as a premier luxury destination.
                </p>
                <a href="#" className="text-sm font-medium text-charcoal hover:text-gold uppercase tracking-wider underline underline-offset-4">Read Full Release</a>
              </article>

              {/* Press Item 2 */}
              <article className="bg-white p-8 border border-black/5 shadow-sm rounded-lg">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                  <h3 className="font-display text-2xl text-charcoal">L&apos;Orangerie Earns Second Michelin Star</h3>
                  <span className="text-xs text-gold uppercase tracking-widest mt-2 md:mt-0">November 10, 2025</span>
                </div>
                <p className="text-muted leading-relaxed mb-4">
                  Our signature restaurant, L&apos;Orangerie, under the direction of Executive Chef Marcus Vance, has officially been awarded its second Michelin Star in the 2026 guide.
                </p>
                <a href="#" className="text-sm font-medium text-charcoal hover:text-gold uppercase tracking-wider underline underline-offset-4">Read Full Release</a>
              </article>
            </div>

            <div className="mt-16 text-center border-t border-black/5 pt-12">
              <h2 className="text-xl font-display text-charcoal mb-4">Media Inquiries</h2>
              <p className="text-muted">
                For press inquiries, high-resolution imagery, or interview requests, please contact:<br />
                <a href="mailto:press@aurumhotel.com" className="text-gold hover:underline mt-2 inline-block">press@aurumhotel.com</a>
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
