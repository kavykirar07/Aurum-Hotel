import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/ui/navbar";
import { AvailabilityWidget } from "@/components/ui/availability-widget";
import { createServiceClient } from "@/lib/supabase";
import { Footer } from "@/components/ui/footer";
import { FadeUp, StaggerContainer } from "@/components/ui/fade-up";

export const metadata: Metadata = {
  title: "Aurum Hotel — A Century of Excellence",
  description:
    "Experience unparalleled heritage luxury at Aurum Hotel. An institution of invisible service and classical elegance since 1921.",
};

// JSON-LD schema for SEO
function LodgingSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: "Aurum Hotel",
    description: "Award-winning heritage luxury hotel.",
    url: process.env.NEXT_PUBLIC_APP_URL,
    priceRange: "$$$$",
    starRating: { "@type": "Rating", ratingValue: "5" },
    address: {
      "@type": "PostalAddress",
      streetAddress: "123 Grand Avenue",
      addressLocality: "New York",
      addressRegion: "NY",
      postalCode: "10001",
      addressCountry: "US",
    },
    telephone: "+18005550100",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "1247",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

async function getRoomCategories() {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("room_categories")
      .select("id, slug, name, description, base_price, max_occupancy, size_sqm")
      .order("base_price", { ascending: true })
      .limit(3);
    return data ?? [];
  } catch {
    return [];
  }
}

// Static room images (Unsplash — now whitelisted in next.config.ts)
const ROOM_IMAGES = [
  {
    src: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=1500&auto=format&fit=crop",
    alt: "Heritage Room — mahogany paneling and copper soaking tub",
  },
  {
    src: "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1500&auto=format&fit=crop",
    alt: "Astor Suite — parlor with antique tapestries",
  },
  {
    src: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=1500&auto=format&fit=crop",
    alt: "Royal Enclave — vaulted ceilings and private conservatory",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "Aurum is the only hotel where I feel time genuinely slows down. Every detail — the temperature of the towels, the precise pour of the champagne — is flawlessly considered.",
    author: "Lady E. Ashworth",
    title: "Returning Guest, London",
    rating: 5,
  },
  {
    quote:
      "After thirty years of global travel, I have not encountered a team that anticipates needs before they are spoken. Aurum is sui generis.",
    author: "Ambassador R. Fairfield",
    title: "Platinum Member",
    rating: 5,
  },
  {
    quote:
      "The Royal Enclave is unlike any suite in the world. The private conservatory at dawn, with the city beginning to stir below, is a memory I will carry always.",
    author: "Ms. C. Montague",
    title: "Art Collector & Traveller",
    rating: 5,
  },
];

const PRESS_MENTIONS = [
  { name: "Condé Nast Traveller", award: "Gold List 2024" },
  { name: "Forbes Travel Guide", award: "Five Star" },
  { name: "The Times", award: "Hotel of the Year" },
  { name: "Tatler", award: "Britain's Best Hotels" },
];

export default async function HomePage() {
  const categories = await getRoomCategories();

  const displayCategories =
    categories.length > 0
      ? categories
      : [
          {
            id: "demo-1",
            slug: "deluxe-room",
            name: "The Heritage Room",
            description:
              "Restored to its original 1921 grandeur, featuring mahogany paneling and a freestanding copper soaking tub.",
            base_price: "450.00",
            size_sqm: 45,
            max_occupancy: 2,
          },
          {
            id: "demo-2",
            slug: "grand-suite",
            name: "The Astor Suite",
            description:
              "An expansive parlor suite adorned with antique tapestries, a private library, and a dedicated butler.",
            base_price: "950.00",
            size_sqm: 120,
            max_occupancy: 4,
          },
          {
            id: "demo-3",
            slug: "penthouse",
            name: "The Royal Enclave",
            description:
              "The crown jewel of Aurum. Hand-carved vaulted ceilings, a private conservatory, and unrestrained old-world luxury.",
            base_price: "2800.00",
            size_sqm: 320,
            max_occupancy: 6,
          },
        ];

  return (
    <div className="bg-[#11100e] text-[#f4f1ea] selection:bg-[#b08d57] selection:text-[#11100e] min-h-screen font-body relative">
      <LodgingSchema />
      <Navbar />

      <main id="main-content">
        {/* ── 1. HERITAGE HERO ── */}
        <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden border-b-[8px] border-[#b08d57]/20">
          <div className="absolute inset-0 bg-[#11100e]/60 z-10" />
          <div
            className="absolute inset-0 bg-cover bg-center sepia-overlay animate-slow-pan"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1578683010236-d716f9a3f461?q=80&w=2000&auto=format&fit=crop')",
            }}
          />

          {/* Desktop hero content */}
          <div className="relative z-20 text-center max-w-4xl px-4 mt-20 hidden md:flex flex-col items-center">
            <div className="w-px h-24 bg-[#b08d57] mx-auto mb-8 opacity-70" />
            <p className="font-body text-[10px] tracking-[0.4em] text-[#b08d57] uppercase mb-8">
              Established 1921
            </p>
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-light leading-[1.1] mb-8 text-[#f9f6f0]">
              A Century of <br />
              <span className="italic text-[#b08d57]">Excellence.</span>
            </h1>
            <p className="font-display text-xl md:text-2xl text-[#f4f1ea]/80 italic max-w-2xl mx-auto mb-16">
              &quot;The art of invisible service, perfected over generations.&quot;
            </p>

            <div className="bg-[#11100e]/80 backdrop-blur-md border border-[#b08d57]/30 p-2 max-w-3xl w-full mx-auto">
              <AvailabilityWidget variant="hero" />
            </div>
          </div>

          {/* Mobile hero content */}
          <div className="relative z-20 text-center max-w-xs px-6 mt-16 flex flex-col items-center md:hidden">
            <div className="w-px h-16 bg-[#b08d57] mx-auto mb-6 opacity-70" />
            <p className="font-body text-[10px] tracking-[0.4em] text-[#b08d57] uppercase mb-6">
              Established 1921
            </p>
            <h1 className="font-display text-4xl font-light leading-[1.1] mb-6 text-[#f9f6f0]">
              A Century of <br />
              <span className="italic text-[#b08d57]">Excellence.</span>
            </h1>
            <p className="font-display text-base text-[#f4f1ea]/80 italic max-w-xs mx-auto">
              &quot;The art of invisible service, perfected over generations.&quot;
            </p>
          </div>

          {/* Mobile sticky CTA — sits at bottom of hero */}
          <div className="absolute bottom-6 left-4 right-4 z-20 md:hidden">
            <Link
              href="/rooms"
              className="flex items-center justify-center gap-3 bg-[#b08d57] text-[#11100e] font-body text-[11px] tracking-[0.25em] uppercase py-4 px-6 w-full"
            >
              <span>Check Availability</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M3 8h10M9 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
        </section>

        {/* ── 2. PRESS STRIP ── */}
        <section
          className="py-8 bg-[#e6e2d8]/10 border-b border-[#b08d57]/10"
          aria-label="Press recognition"
        >
          <div className="container max-w-5xl">
            <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
              {PRESS_MENTIONS.map((press) => (
                <div key={press.name} className="text-center">
                  <p className="font-body text-[9px] tracking-[0.3em] text-[#b08d57] uppercase">
                    {press.award}
                  </p>
                  <p className="font-display italic text-sm text-[#f4f1ea]/50 mt-0.5">
                    {press.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 3. THE CHRONICLE (STORY) ── */}
        <section className="py-32 bg-[#e6e2d8] text-[#1c1a17] relative">
          <div className="container max-w-5xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <FadeUp className="order-2 md:order-1 relative">
                <div className="border border-[#1c1a17]/20 p-2">
                  <div className="aspect-[3/4] relative overflow-hidden sepia-overlay">
                    <Image
                      src="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=1500&auto=format&fit=crop"
                      alt="Aurum Hotel grand entrance — 1921 heritage architecture"
                      fill
                      className="object-cover transition-transform duration-[10s] hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                </div>
                {/* Letterpress badge */}
                <div className="absolute -bottom-6 -right-6 bg-[#11100e] text-[#f4f1ea] border border-[#b08d57] p-6 text-center">
                  <p className="font-display text-3xl text-[#b08d57] mb-1">103</p>
                  <p className="font-body text-[8px] tracking-widest uppercase">
                    Years of History
                  </p>
                </div>
              </FadeUp>

              <FadeUp delay={0.15} className="order-1 md:order-2">
                <h2 className="font-display text-4xl lg:text-5xl font-light mb-8 text-[#11100e]">
                  The Legacy of <br />{" "}
                  <span className="italic">Aurum.</span>
                </h2>
                <div className="w-full h-px bg-[#11100e]/20 mb-8" />

                <p className="drop-cap text-[#1c1a17]/80 font-body text-sm leading-loose mb-6 text-justify">
                  Conceived in the roaring twenties as a private club for the global
                  elite, Aurum Hotel has stood as a bastion of uncompromising luxury
                  for over a century. Its visionary founder, Arthur Pendleton, believed
                  that true luxury lies not merely in opulent surroundings, but in the
                  flawless anticipation of every human desire.
                </p>
                <p className="text-[#1c1a17]/80 font-body text-sm leading-loose mb-8 text-justify">
                  Today, while our amenities have embraced the modern era, our core
                  philosophy remains untouched. We are stewards of a timeless tradition.
                  Every heavy brass key, every hand-polished banister, and every hushed
                  hallway speaks to a commitment to absolute perfection.
                </p>

                <Link
                  href="/about"
                  className="inline-flex items-center gap-3 text-[#11100e] group"
                >
                  <span className="font-body text-[10px] tracking-widest uppercase border-b border-[#b08d57] pb-1 transition-colors group-hover:text-[#b08d57]">
                    Read the Archives
                  </span>
                </Link>
              </FadeUp>
            </div>
          </div>
        </section>

        {/* ── 4. THE CHAMBERS (ROOMS) ── */}
        <section className="py-32 bg-[#11100e] text-[#f4f1ea] border-y border-[#b08d57]/20">
          <div className="container max-w-6xl">
            <FadeUp className="text-center mb-24">
              <span className="font-body text-[10px] tracking-[0.4em] text-[#b08d57] uppercase block mb-4">
                Accommodations
              </span>
              <h2 className="font-display text-5xl lg:text-6xl font-light">
                The Chambers
              </h2>
              <div className="w-16 h-px bg-[#b08d57]/50 mx-auto mt-8" />
            </FadeUp>

            <div className="space-y-32">
              {displayCategories.map((cat, index) => {
                const isEven = index % 2 !== 0;
                const img = ROOM_IMAGES[index % ROOM_IMAGES.length];
                return (
                  <FadeUp key={cat.id} delay={index * 0.1}>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                      <div
                        className={`lg:col-span-7 ${isEven ? "lg:order-2" : "lg:order-1"}`}
                      >
                        <div className="p-2 border border-[#b08d57]/20">
                          <div className="aspect-[16/10] relative overflow-hidden sepia-overlay">
                            <Image
                              src={img.src}
                              alt={img.alt}
                              fill
                              className="object-cover transition-transform duration-[20s] hover:scale-105"
                              sizes="(max-width: 768px) 100vw, 60vw"
                            />
                          </div>
                        </div>
                      </div>

                      <div
                        className={`lg:col-span-5 text-center px-4 ${isEven ? "lg:order-1" : "lg:order-2"}`}
                      >
                        <h3 className="font-display text-3xl lg:text-4xl font-light mb-4 text-[#f9f6f0]">
                          {cat.name}
                        </h3>
                        <p className="font-display italic text-xl text-[#b08d57] mb-6">
                          From ${parseFloat(cat.base_price).toLocaleString()} per evening
                        </p>

                        <div className="w-8 h-px bg-[#f4f1ea]/20 mx-auto mb-6" />

                        <p className="font-body text-sm text-[#f4f1ea]/60 leading-relaxed mb-8">
                          {cat.description}
                        </p>

                        <div className="flex justify-center gap-8 mb-8 font-body text-[10px] tracking-widest uppercase text-[#b08d57]">
                          <span>{cat.size_sqm} m²</span>
                          <span>&middot;</span>
                          <span>Up to {cat.max_occupancy} Guests</span>
                        </div>

                        <Link
                          href={`/rooms/${cat.slug}`}
                          className="inline-block border border-[#b08d57] text-[#b08d57] hover:bg-[#b08d57] hover:text-[#11100e] transition-colors px-8 py-3 font-body text-[10px] tracking-[0.2em] uppercase"
                        >
                          Reserve Chamber
                        </Link>
                      </div>
                    </div>
                  </FadeUp>
                );
              })}
            </div>

            <FadeUp className="text-center mt-32">
              <Link
                href="/rooms"
                className="font-display italic text-2xl text-[#b08d57] hover:text-[#f4f1ea] transition-colors border-b border-[#b08d57]/30 pb-2"
              >
                View the Full Collection
              </Link>
            </FadeUp>
          </div>
        </section>

        {/* ── 5. TESTIMONIALS ── */}
        <section
          className="py-24 bg-[#f4f1ea] text-[#1c1a17]"
          aria-label="Guest testimonials"
        >
          <div className="container max-w-6xl">
            <FadeUp className="text-center mb-16">
              <span className="font-body text-[10px] tracking-[0.4em] text-[#b08d57] uppercase block mb-4">
                Voices of Aurum
              </span>
              <h2 className="font-display text-4xl lg:text-5xl font-light text-[#11100e]">
                Impressions
              </h2>
            </FadeUp>

            <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {TESTIMONIALS.map((t, i) => (
                <FadeUp key={i} delay={i * 0.1}>
                  <blockquote className="border border-[#11100e]/10 p-8 h-full flex flex-col">
                    <div className="flex gap-0.5 mb-6" aria-label={`${t.rating} stars`}>
                      {Array.from({ length: t.rating }).map((_, s) => (
                        <span key={s} className="text-[#b08d57] text-sm" aria-hidden="true">
                          ★
                        </span>
                      ))}
                    </div>
                    <p className="font-display italic text-lg text-[#1c1a17]/80 leading-relaxed flex-1 mb-8">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                    <footer>
                      <p className="font-display text-base font-medium text-[#11100e]">
                        {t.author}
                      </p>
                      <p className="font-body text-[9px] tracking-[0.2em] uppercase text-[#b08d57] mt-1">
                        {t.title}
                      </p>
                    </footer>
                  </blockquote>
                </FadeUp>
              ))}
            </StaggerContainer>
          </div>
        </section>

        {/* ── 6. THE INSTITUTION (DINING/SPA) ── */}
        <section className="py-0 flex flex-col md:flex-row min-h-[80vh]">
          {/* Left: Dining */}
          <div className="w-full md:w-1/2 relative flex items-center justify-center p-16 overflow-hidden border-r border-[#b08d57]/20 min-h-[50vh] md:min-h-0">
            <div className="absolute inset-0 bg-[#11100e]/80 z-10" />
            <div className="absolute inset-0">
              <Image
                src="https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=2000&auto=format&fit=crop"
                alt="The Onyx Room — Aurum Hotel fine dining restaurant"
                fill
                className="object-cover sepia-overlay transition-transform duration-[15s] hover:scale-105"
                sizes="50vw"
              />
            </div>
            <FadeUp className="relative z-20 text-center max-w-sm">
              <span className="font-body text-[10px] tracking-[0.3em] text-[#b08d57] uppercase mb-4 block">
                Gastronomy
              </span>
              <h2 className="font-display text-4xl mb-6 text-[#f9f6f0]">
                The Onyx Room
              </h2>
              <p className="font-body text-sm text-[#f4f1ea]/70 leading-relaxed mb-8">
                A sanctuary of rare vintage spirits and classical culinary techniques,
                preserved since the prohibition era.
              </p>
              <Link
                href="/dining"
                className="font-body text-[10px] tracking-widest uppercase border-b border-[#b08d57] pb-1 hover:text-[#b08d57] transition-colors"
              >
                Explore Dining
              </Link>
            </FadeUp>
          </div>

          {/* Right: Spa/Wellness */}
          <div className="w-full md:w-1/2 bg-[#f4f1ea] text-[#11100e] relative flex items-center justify-center p-16 min-h-[50vh] md:min-h-0">
            <div className="absolute inset-4 border border-[#11100e]/10 pointer-events-none" />
            <FadeUp delay={0.1} className="relative z-20 text-center max-w-sm">
              <span className="font-body text-[10px] tracking-[0.3em] text-[#b08d57] uppercase mb-4 block">
                Restoration
              </span>
              <h2 className="font-display text-4xl mb-6 text-[#11100e]">The Baths</h2>
              <p className="font-body text-sm text-[#11100e]/70 leading-relaxed mb-8">
                Subterranean thermal suites featuring Roman-style architecture, offering
                deeply restorative therapies.
              </p>
              <Link
                href="/spa"
                className="font-body text-[10px] tracking-widest uppercase border-b border-[#11100e] pb-1 hover:text-[#b08d57] transition-colors"
              >
                Discover Wellness
              </Link>
            </FadeUp>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
