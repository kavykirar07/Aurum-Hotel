import type { Metadata } from "next";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";

export const metadata: Metadata = {
  title: "Contact Us | Aurum Hotel",
  description: "Get in touch with Aurum Hotel's concierge and reservations team.",
};

export default function ContactPage() {
  return (
    <>
      <Navbar />

      <main className="pt-20">
        <section className="section bg-warm-white min-h-[calc(100vh-80px)] flex flex-col justify-center">
          <div className="container max-w-5xl">
            <div className="text-center mb-16">
              <h1 className="text-display-lg text-charcoal mb-4">At Your Service</h1>
              <div className="divider-gold mx-auto mb-6" />
              <p className="text-muted max-w-2xl mx-auto">
                Whether you wish to make a reservation, inquire about a private event, or speak directly with our concierge, we are at your disposal.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 bg-white p-8 md:p-12 shadow-sm border border-black/5 rounded-lg">
              {/* Contact Info */}
              <div>
                <h2 className="text-2xl font-display text-charcoal mb-6">Contact Information</h2>
                
                <div className="space-y-6">
                  <div>
                    <p className="text-label text-gold mb-1">Address</p>
                    <p className="text-charcoal leading-relaxed">
                      1 Aurum Plaza<br />
                      The Platinum District<br />
                      New York, NY 10001
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-label text-gold mb-1">Reservations</p>
                    <p className="text-charcoal">+1 (800) 555-0100</p>
                    <p className="text-muted text-sm mt-1">Available 24 hours</p>
                  </div>

                  <div>
                    <p className="text-label text-gold mb-1">Concierge &amp; General Inquiries</p>
                    <p className="text-charcoal">concierge@aurumhotel.com</p>
                    <p className="text-charcoal mt-1">+1 (212) 555-0101</p>
                  </div>
                </div>
              </div>

              {/* Inquiry Form */}
              <div>
                <h2 className="text-2xl font-display text-charcoal mb-6">Send an Inquiry</h2>
                <form className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-charcoal uppercase tracking-wider mb-2">First Name</label>
                      <input type="text" className="input" placeholder="Jane" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-charcoal uppercase tracking-wider mb-2">Last Name</label>
                      <input type="text" className="input" placeholder="Doe" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-charcoal uppercase tracking-wider mb-2">Email Address</label>
                    <input type="email" className="input" placeholder="jane@example.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-charcoal uppercase tracking-wider mb-2">Message</label>
                    <textarea className="input min-h-[120px] resize-y" placeholder="How may we assist you?"></textarea>
                  </div>
                  <button type="button" className="btn btn-gold w-full mt-2">Submit Inquiry</button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
