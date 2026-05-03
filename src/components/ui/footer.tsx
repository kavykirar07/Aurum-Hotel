// src/components/ui/footer.tsx

import Link from "next/link";

const FOOTER_LINKS = {
  Explore: [
    { href: "/rooms", label: "Rooms & Suites" },
    { href: "/dining", label: "Dining" },
    { href: "/spa", label: "Spa & Wellness" },
    { href: "/experiences", label: "Experiences" },
  ],
  "Guest Services": [
    { href: "/dashboard", label: "Manage Booking" },
    { href: "/concierge", label: "Concierge Requests" },
    { href: "/loyalty", label: "Loyalty Programme" },
    { href: "/gift-cards", label: "Gift Cards" },
  ],
  Company: [
    { href: "/about", label: "About Aurum" },
    { href: "/careers", label: "Careers" },
    { href: "/press", label: "Press" },
    { href: "/contact", label: "Contact" },
  ],
  Legal: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
    { href: "/accessibility", label: "Accessibility" },
    { href: "/cookies", label: "Cookie Policy" },
  ],
};

export function Footer() {
  return (
    <footer
      className="bg-charcoal text-white"
      role="contentinfo"
      aria-label="Site footer"
    >
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" aria-label="Aurum Hotel home">
              <p
                className="font-display text-2xl font-light tracking-widest uppercase text-white hover:text-gold transition-colors"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Aurum
              </p>
            </Link>
            <p className="text-label text-white/30 tracking-[0.3em] mt-1">
              Hotel &amp; Residences
            </p>
            <p className="text-sm text-white/50 mt-4 leading-relaxed">
              123 Grand Avenue<br />
              New York, NY 10001
            </p>
            <a
              href="tel:+18005550100"
              className="text-sm text-gold hover:text-gold-light transition-colors mt-2 block"
            >
              +1 800 555 0100
            </a>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h3 className="text-label text-white/40 mb-4">{heading}</h3>
              <ul className="space-y-2.5" role="list">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/60 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/30">
            &copy; {new Date().getFullYear()} Aurum Hotel &amp; Residences. All rights reserved.
          </p>
          <div className="flex items-center gap-1">
            <span className="text-label text-white/20">Rated</span>
            <span className="text-gold text-sm ml-1">★★★★★</span>
            <span className="text-label text-white/20 ml-1">5-Star Excellence</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
