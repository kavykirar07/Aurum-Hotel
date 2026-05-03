import type { Metadata } from "next";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";

export const metadata: Metadata = {
  title: "Privacy Policy | Aurum Hotel",
  description: "Privacy Policy for Aurum Hotel.",
};

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="pt-20">
        <section className="section bg-warm-white min-h-[70vh]">
          <div className="container max-w-3xl">
            <h1 className="text-display-lg text-charcoal mb-8 text-center">Privacy Policy</h1>
            <div className="divider-gold mx-auto mb-12" />
            
            <div className="prose prose-stone max-w-none text-charcoal">
              <p className="lead">Last updated: January 1, 2026</p>
              
              <h2>1. Information We Collect</h2>
              <p>
                At Aurum Hotel, we are committed to protecting your privacy and ensuring the security of your personal data. 
                When you make a reservation, we collect information such as your name, email address, phone number, payment details, 
                and specific preferences to ensure your stay is tailored to your needs.
              </p>

              <h2>2. How We Use Your Information</h2>
              <p>
                The information collected is used exclusively to:
              </p>
              <ul>
                <li>Process and confirm your reservations.</li>
                <li>Provide personalized concierge services during your stay.</li>
                <li>Process transactions securely via our payment partners.</li>
                <li>Communicate important updates regarding your booking.</li>
              </ul>

              <h2>3. Data Protection & Security</h2>
              <p>
                We implement state-of-the-art encryption and security protocols to safeguard your personal and financial information. 
                We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties without your explicit consent, 
                except as required to provide our services or comply with legal obligations.
              </p>

              <h2>4. Contact Us</h2>
              <p>
                If you have any questions regarding this privacy policy, please contact our Data Protection Officer at privacy@aurumhotel.com.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
