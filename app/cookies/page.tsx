import type { Metadata } from "next";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";

export const metadata: Metadata = {
  title: "Cookie Policy | Aurum Hotel",
  description: "Cookie Policy for Aurum Hotel.",
};

export default function CookiesPage() {
  return (
    <>
      <Navbar />
      <main className="pt-20">
        <section className="section bg-warm-white min-h-[70vh]">
          <div className="container max-w-3xl">
            <h1 className="text-display-lg text-charcoal mb-8 text-center">Cookie Policy</h1>
            <div className="divider-gold mx-auto mb-12" />
            
            <div className="prose prose-stone max-w-none text-charcoal">
              <p className="lead">Last updated: January 1, 2026</p>
              
              <h2>What Are Cookies?</h2>
              <p>
                Cookies are small text files that are stored on your device when you visit our website. 
                They help us recognize your device, remember your preferences, and provide a seamless browsing experience.
              </p>

              <h2>How We Use Cookies</h2>
              <p>
                We use cookies for the following purposes:
              </p>
              <ul>
                <li><strong>Essential Cookies:</strong> Strictly necessary for the operation of our booking engine and secure authentication (e.g., maintaining your session).</li>
                <li><strong>Performance & Analytics:</strong> To understand how visitors interact with our site, helping us improve our design and functionality.</li>
                <li><strong>Functional Cookies:</strong> To remember your preferences, such as language or currency selection.</li>
              </ul>

              <h2>Managing Your Preferences</h2>
              <p>
                You can manage or disable cookies through your browser settings. Please note that disabling essential cookies may impact 
                the functionality of our booking system and your ability to access the guest dashboard.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
