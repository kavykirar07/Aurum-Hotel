import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { createServiceClient } from "@/lib/supabase";
import { computeNightlyRate } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Rooms & Suites | Aurum Hotel",
  description: "Explore our luxurious collection of rooms and suites.",
};

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
            {displayCategories.map((cat) => (
              <article key={cat.id} className="card group cursor-pointer flex flex-col">
                <div
                  className="relative h-64 overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg, #2a2016 0%, #1a1a1a 100%)",
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center opacity-20">
                    <span className="text-9xl font-display text-gold font-light">A</span>
                  </div>
                  
                  {cat.scarcity_badge && (
                    <div className="absolute top-3 left-3">
                      <span className="badge badge-scarcity">Only {cat.available_count} Left</span>
                    </div>
                  )}

                  <div className="absolute bottom-3 right-3">
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
            ))}
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
