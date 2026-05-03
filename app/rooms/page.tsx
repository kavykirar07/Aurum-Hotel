import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { createServiceClient } from "@/lib/supabase";
import { computeNightlyRate } from "@/lib/pricing";
import { FadeUp } from "@/components/ui/fade-up";

const ROOM_IMAGES: Record<string, { src: string; alt: string }> = {
  "deluxe-room": {
    src: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=1200&auto=format&fit=crop",
    alt: "Heritage Room — mahogany paneling and copper soaking tub",
  },
  "grand-suite": {
    src: "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1200&auto=format&fit=crop",
    alt: "Astor Suite — parlor with antique tapestries and private library",
  },
  penthouse: {
    src: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=1200&auto=format&fit=crop",
    alt: "Royal Enclave — vaulted ceilings and private conservatory",
  },
};

const FALLBACK_IMAGES = [
  { src: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=1200&auto=format&fit=crop", alt: "Luxury hotel room" },
  { src: "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1200&auto=format&fit=crop", alt: "Luxury hotel suite" },
  { src: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=1200&auto=format&fit=crop", alt: "Luxury hotel penthouse" },
];

export const metadata: Metadata = {
  title: "Rooms & Suites | Aurum Hotel",
  description: "Explore our luxurious collection of rooms and suites.",
};

// ISR: revalidate once per hour; purge on-demand via revalidateTag("room-categories")
export const revalidate = 3600;

export default async function RoomsPage(props: {
  searchParams: Promise<{ checkIn?: string; checkOut?: string; guests?: string }>;
}) {
  const searchParams = await props.searchParams;
  const checkIn = searchParams.checkIn;
  const checkOut = searchParams.checkOut;
  const guests = searchParams.guests ? parseInt(searchParams.guests, 10) : 2;

  const supabase = createServiceClient();
  const { data: categories } = await supabase
    .from("room_categories")
    .select("*, rooms(id, status)")
    .order("base_price", { ascending: true });

  const displayCategories = await Promise.all(
    (categories ?? []).map(async (cat) => {
      const availableRooms = (cat.rooms as { id: string; status: string }[]).filter(
        (r) => r.status === "available"
      );

      let fromPrice = cat.base_price;
      if (checkIn && checkOut) {
        const priceResult = await computeNightlyRate(cat.id, checkIn, checkOut);
        if (priceResult.success) {
          fromPrice = priceResult.data.nightly_rate;
        }
      }

      return {
        ...cat,
        available_count: availableRooms.length,
        from_price: fromPrice,
        scarcity_badge: availableRooms.length > 0 && availableRooms.length <= 2,
      };
    })
  );

  return (
    <>
      <Navbar />
      <main id="main-content" className="pt-24 pb-16 bg-warm-white min-h-screen">
        <div className="container">
          <div className="text-center mb-12">
            <h1 className="text-display-lg text-charcoal mb-4">Rooms &amp; Suites</h1>
            <p className="text-muted max-w-2xl mx-auto">
              {checkIn && checkOut
                ? `Showing availability for ${checkIn} to ${checkOut} for ${guests} ${guests === 1 ? 'guest' : 'guests'}.`
                : "Discover an intimate world of curated luxury. Each of our 42 rooms and suites is an individual work of art."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayCategories.map((cat, idx) => {
              const img = ROOM_IMAGES[cat.slug] ?? FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length];
              return (
              <FadeUp key={cat.id} delay={idx * 0.08}>
                <article className="card group cursor-pointer flex flex-col h-full">
                  <div className="relative h-64 overflow-hidden">
                    <Image
                      src={img.src}
                      alt={img.alt}
                      fill
                      className="object-cover sepia-[0.3] transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    {cat.scarcity_badge && (
                      <div className="absolute top-3 left-3 z-10">
                        <span className="badge badge-scarcity">Only {cat.available_count} Left</span>
                      </div>
                    )}
                    <div className="absolute bottom-3 right-3 z-10">
                      <span className="badge badge-gold text-xs">
                        From ${parseFloat(cat.from_price).toLocaleString()}/night
                      </span>
                    </div>
                  </div>

                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h2 className="font-display text-xl font-medium text-charcoal">
                      {cat.name}
                    </h2>
                    <span className="text-label text-muted">{cat.size_sqm}m²</span>
                  </div>
                  <p className="text-sm text-muted mb-6 leading-relaxed flex-1 line-clamp-3">
                    {cat.description}
                  </p>

                  <div className="mt-auto">
                    <Link
                      href={`/rooms/${cat.slug}${
                        checkIn && checkOut
                          ? `?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`
                          : ""
                      }`}
                      className="btn btn-gold w-full text-center"
                    >
                      View Details
                    </Link>
                  </div>
                  </div>
                </article>
              </FadeUp>
            );
            })}
          </div>

          {displayCategories.length === 0 && (
            <div className="text-center py-20">
              <p className="text-lg text-muted">No rooms currently available.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
