import type { Metadata } from "next";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";

export const metadata: Metadata = {
  title: "Accessibility | Aurum Hotel",
  description: "Aurum Hotel's commitment to accessibility and inclusive experiences.",
};

export default function AccessibilityPage() {
  return (
    <>
      <Navbar />
      <main className="pt-20">
        <section className="section bg-warm-white min-h-[70vh]">
          <div className="container max-w-3xl">
            <h1 className="text-display-lg text-charcoal mb-8 text-center">Accessibility Statement</h1>
            <div className="divider-gold mx-auto mb-12" />
            
            <div className="prose prose-stone max-w-none text-charcoal">
              <p>
                Aurum Hotel is dedicated to providing an exceptional experience for all our guests, including individuals with disabilities. 
                We strive to ensure our property and our digital presence are accessible to everyone.
              </p>

              <h2>Digital Accessibility</h2>
              <p>
                Our website has been designed in accordance with the Web Content Accessibility Guidelines (WCAG) 2.1 AA standards. 
                We regularly audit our site to maintain and improve user experience for those utilizing assistive technologies.
              </p>

              <h2>Property Accessibility</h2>
              <p>
                Our physical location is fully compliant with ADA regulations. Features include:
              </p>
              <ul>
                <li>Wheelchair-accessible entrances, elevators, and public spaces.</li>
                <li>Specially designed accessible suites featuring roll-in showers and lowered amenities.</li>
                <li>Braille signage throughout the hotel.</li>
                <li>Visual alarm systems in designated rooms.</li>
              </ul>

              <h2>Feedback & Support</h2>
              <p>
                If you encounter any barriers or require specific accommodations during your stay, please contact our accessibility coordinator 
                at accessibility@aurumhotel.com or call +1 (800) 555-0100.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
