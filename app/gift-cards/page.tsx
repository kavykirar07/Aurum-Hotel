import type { Metadata } from "next";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";

export const metadata: Metadata = {
  title: "Gift Cards | Aurum Hotel",
  description: "Give the gift of luxury with Aurum Hotel gift cards.",
};

export default function GiftCardsPage() {
  return (
    <>
      <Navbar />
      <main className="pt-20">
        <section className="section bg-warm-white min-h-[70vh] flex items-center justify-center">
          <div className="container max-w-2xl text-center">
            <h1 className="text-display-lg text-charcoal mb-4">Gift Cards</h1>
            <div className="divider-gold mx-auto mb-8" />
            <p className="text-muted leading-relaxed mb-10">
              Give the ultimate gift of an unforgettable experience. Aurum Hotel gift cards can be redeemed for stays in our luxurious suites, dining at our signature restaurants, or rejuvenating treatments at the Aurum Spa.
            </p>
            <div className="bg-white p-8 border border-black/5 shadow-sm rounded-lg">
              <h2 className="text-xl font-display text-charcoal mb-6">Purchase a Digital Gift Card</h2>
              <form className="space-y-4">
                <div>
                  <label className="block text-left text-xs font-medium text-charcoal uppercase tracking-wider mb-2">Amount (USD)</label>
                  <select className="input appearance-none bg-white">
                    <option>$100</option>
                    <option>$250</option>
                    <option>$500</option>
                    <option>$1000</option>
                    <option>Custom Amount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-left text-xs font-medium text-charcoal uppercase tracking-wider mb-2">Recipient Email</label>
                  <input type="email" className="input" placeholder="recipient@example.com" />
                </div>
                <div>
                  <label className="block text-left text-xs font-medium text-charcoal uppercase tracking-wider mb-2">Personal Message</label>
                  <textarea className="input min-h-[100px] resize-y" placeholder="Add a personal touch..."></textarea>
                </div>
                <button type="button" className="btn btn-gold w-full mt-4">Proceed to Payment</button>
              </form>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
