import type { Metadata } from "next";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";

export const metadata: Metadata = {
  title: "Careers | Aurum Hotel",
  description: "Join the team at Aurum Hotel and help us craft unforgettable experiences.",
};

export default function CareersPage() {
  return (
    <>
      <Navbar />
      <main className="pt-20">
        <section className="relative h-[40vh] flex items-center justify-center bg-charcoal overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/30 z-10" />
          <div className="absolute inset-0 bg-charcoal opacity-80" />
          <div className="container relative z-20 text-center">
            <h1 className="text-display-hero text-white mb-4">Careers</h1>
            <div className="divider-gold mx-auto mb-6" />
            <p className="text-lg text-white/80 max-w-2xl mx-auto font-light">
              Crafting Excellence, Together.
            </p>
          </div>
        </section>

        <section className="section bg-warm-white">
          <div className="container max-w-4xl">
            <div className="text-center mb-16">
              <h2 className="text-display-md text-charcoal mb-6">Join Our Team</h2>
              <p className="text-muted leading-relaxed">
                At Aurum Hotel, we believe our people are our most precious asset. We are always looking for passionate, dedicated individuals who share our commitment to exceptional service and hospitality.
              </p>
            </div>
            
            <div className="space-y-6">
              {/* Job 1 */}
              <div className="bg-white p-6 border border-black/5 shadow-sm rounded-lg flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                  <h3 className="font-display text-xl text-charcoal mb-1">Executive Sous Chef</h3>
                  <p className="text-sm text-muted">Culinary Team &middot; Full Time</p>
                </div>
                <button className="btn btn-outline btn-sm">Apply Now</button>
              </div>
              
              {/* Job 2 */}
              <div className="bg-white p-6 border border-black/5 shadow-sm rounded-lg flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                  <h3 className="font-display text-xl text-charcoal mb-1">Spa Therapist</h3>
                  <p className="text-sm text-muted">Wellness & Spa &middot; Part Time</p>
                </div>
                <button className="btn btn-outline btn-sm">Apply Now</button>
              </div>

              {/* Job 3 */}
              <div className="bg-white p-6 border border-black/5 shadow-sm rounded-lg flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                  <h3 className="font-display text-xl text-charcoal mb-1">Guest Relations Manager</h3>
                  <p className="text-sm text-muted">Front Desk &middot; Full Time</p>
                </div>
                <button className="btn btn-outline btn-sm">Apply Now</button>
              </div>
            </div>

            <div className="mt-12 text-center border-t border-black/5 pt-8">
              <p className="text-muted text-sm">
                Don&apos;t see a position that matches your skills? Send your resume to <a href="mailto:careers@aurumhotel.com" className="text-gold hover:underline">careers@aurumhotel.com</a>.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
