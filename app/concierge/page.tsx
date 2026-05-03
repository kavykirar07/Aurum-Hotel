import type { Metadata } from "next";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";

export const metadata: Metadata = {
  title: "Concierge Services | Aurum Hotel",
  description: "Request personalized services from our Les Clefs d'Or certified concierge team.",
};

export default function ConciergePage() {
  return (
    <>
      <Navbar />
      <main className="pt-20">
        <section className="relative h-[40vh] flex items-center justify-center bg-charcoal overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/30 z-10" />
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-50" />
          <div className="container relative z-20 text-center">
            <h1 className="text-display-hero text-white mb-4">Concierge Services</h1>
            <div className="divider-gold mx-auto mb-6" />
            <p className="text-lg text-white/80 max-w-2xl mx-auto font-light">
              Your key to unlocking the extraordinary.
            </p>
          </div>
        </section>

        <section className="section bg-warm-white">
          <div className="container max-w-3xl">
            <div className="bg-white p-8 md:p-12 shadow-sm border border-black/5 rounded-lg">
              <h2 className="text-2xl font-display text-charcoal mb-6 text-center">Submit a Request</h2>
              <p className="text-muted text-center mb-8">
                Please let us know how we can make your upcoming stay more comfortable. Our team will review your request and contact you shortly.
              </p>
              
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-medium text-charcoal uppercase tracking-wider mb-2">Full Name</label>
                    <input type="text" className="input" placeholder="Jane Doe" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-charcoal uppercase tracking-wider mb-2">Booking Reference (Optional)</label>
                    <input type="text" className="input" placeholder="e.g. AUR-12345" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-charcoal uppercase tracking-wider mb-2">Request Type</label>
                  <select className="input appearance-none bg-white">
                    <option>Transportation & Transfers</option>
                    <option>Dining Reservations</option>
                    <option>Spa & Wellness Appointments</option>
                    <option>Special Occasion Setup</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-charcoal uppercase tracking-wider mb-2">Details</label>
                  <textarea className="input min-h-[150px] resize-y" placeholder="Please provide specific details..."></textarea>
                </div>
                <button type="button" className="btn btn-gold w-full mt-4">Submit Request</button>
              </form>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
