"use client";
// src/components/ui/navbar.tsx — Sticky navigation with scroll-aware transparency

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/rooms", label: "Rooms & Suites" },
  { href: "/dining", label: "Dining" },
  { href: "/spa", label: "Spa & Wellness" },
  { href: "/experiences", label: "Experiences" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const isHero = pathname === "/";

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const isTransparent = isHero && !scrolled && !menuOpen;

  return (
    <header
      role="banner"
      className={`
        fixed top-0 left-0 right-0 z-[var(--z-nav)]
        transition-all duration-500 ease-out
        ${isTransparent
          ? "bg-transparent"
          : "bg-white/95 backdrop-blur-md shadow-sm border-b border-black/5"
        }
      `}
    >
      <div className="container">
        <nav
          aria-label="Main navigation"
          className="flex items-center justify-between h-20"
        >
          {/* Logo */}
          <Link
            href="/"
            className="flex flex-col leading-none group"
            aria-label="Aurum Hotel home"
          >
            <span
              className={`
                font-display text-2xl font-light tracking-widest uppercase
                transition-colors duration-300
                ${isTransparent ? "text-white" : "text-charcoal"}
                group-hover:text-gold
              `}
              style={{ fontFamily: "var(--font-display)" }}
            >
              Aurum
            </span>
            <span
              className={`
                text-[0.55rem] tracking-[0.35em] uppercase mt-0.5
                transition-colors duration-300
                ${isTransparent ? "text-white/70" : "text-muted"}
              `}
            >
              Hotel &amp; Residences
            </span>
          </Link>

          {/* Desktop nav */}
          <ul className="hidden md:flex items-center gap-8" role="list">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`
                    text-sm font-medium tracking-wide
                    transition-colors duration-200 relative
                    after:absolute after:bottom-0 after:left-0 after:w-0 after:h-px
                    after:bg-gold after:transition-all after:duration-300
                    hover:after:w-full
                    ${pathname === link.href
                      ? "text-gold after:w-full"
                      : isTransparent
                        ? "text-white/90 hover:text-white"
                        : "text-charcoal hover:text-gold-dark"
                    }
                  `}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/signin"
              className={`
                text-sm font-medium transition-colors duration-200
                ${isTransparent ? "text-white/80 hover:text-white" : "text-muted hover:text-charcoal"}
              `}
            >
              Sign In
            </Link>
            <Link href="/rooms" className="btn btn-gold btn-sm">
              Book Now
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((o) => !o)}
            className={`
              md:hidden p-2 rounded-md transition-colors
              ${isTransparent && !menuOpen ? "text-white" : "text-charcoal"}
            `}
          >
            <span className="block w-6 h-0.5 bg-current mb-1.5 transition-transform" />
            <span className="block w-6 h-0.5 bg-current mb-1.5 transition-opacity" />
            <span className="block w-6 h-0.5 bg-current transition-transform" />
          </button>
        </nav>

        {/* Mobile menu */}
        {menuOpen && (
          <div
            id="mobile-menu"
            className="md:hidden bg-white border-t border-black/5 py-4 pb-6"
            role="navigation"
            aria-label="Mobile navigation"
          >
            <ul className="space-y-1" role="list">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={`
                      block px-4 py-3 text-sm font-medium rounded-md transition-colors
                      ${pathname === link.href
                        ? "text-gold bg-gold-pale"
                        : "text-charcoal hover:bg-warm-gray hover:text-gold-dark"
                      }
                    `}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="px-4 pt-4 border-t border-black/5 mt-4 flex flex-col gap-2">
              <Link href="/signin" className="btn btn-outline w-full">Sign In</Link>
              <Link href="/rooms" className="btn btn-gold w-full">Book Now</Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
