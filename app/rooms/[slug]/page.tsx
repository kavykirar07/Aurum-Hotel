import { notFound } from "next/navigation";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { createServiceClient } from "@/lib/supabase";
import { RoomBookingForm } from "@/components/ui/room-booking-form";
import type { Metadata } from "next";

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("room_categories")
    .select("name, description")
    .eq("slug", params.slug)
    .single();

  if (!data) return { title: "Room Not Found" };
  return {
    title: `${data.name} | Aurum Hotel`,
    description: data.description ?? "Luxurious accommodations at Aurum Hotel.",
  };
}

export default async function RoomDetailPage(props: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ checkIn?: string; checkOut?: string; guests?: string }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  
  const supabase = createServiceClient();
  const { data: category, error } = await supabase
    .from("room_categories")
    .select("*, rooms(id, room_number, floor, status, features)")
    .eq("slug", params.slug)
    .single();

  if (error || !category) {
    notFound();
  }

  const availableRooms = (category.rooms as unknown as { status: string; id: string; room_number: string; floor: number; features: unknown }[]).filter(
    (r) => r.status === "available"
  );

  const parsedAmenities = category.amenities ? Object.entries(category.amenities as Record<string, unknown>) : [];

  return (
    <>
      <Navbar />
      <main id="main-content" className="bg-warm-white min-h-screen">
        {/* Hero Image */}
        <section className="relative h-[60vh] min-h-[400px] w-full" style={{ background: "var(--color-charcoal)" }}>
          <div className="absolute inset-0 flex items-center justify-center opacity-30">
             {/* Placeholder for actual image */}
             <span className="text-9xl font-display text-gold font-light">A</span>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full p-8 md:p-16">
            <div className="container">
              <h1 className="text-display-lg text-white mb-2">{category.name}</h1>
              <p className="text-white/80 text-lg">{category.size_sqm}m² · Up to {category.max_occupancy} Guests</p>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="flex flex-col lg:flex-row gap-16">
              
              {/* Content */}
              <div className="flex-1">
                <h2 className="text-display-md text-charcoal mb-6">About the Suite</h2>
                <div className="divider-gold mt-0 mb-8" />
                <p className="text-lg text-muted leading-relaxed mb-12">
                  {category.description}
                </p>

                <h3 className="text-2xl font-display text-charcoal mb-6">Amenities</h3>
                {parsedAmenities.length > 0 ? (
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {parsedAmenities.map(([key, val]) => (
                      <li key={key} className="flex items-center gap-3 text-muted">
                        <span className="text-gold">•</span>
                        <span className="capitalize">{key.replace(/_/g, " ")}: {String(val)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {["King Size Bed", "Marble Bathroom", "Freestanding Tub", "City View", "Minibar", "24/7 Room Service"].map((item) => (
                      <li key={item} className="flex items-center gap-3 text-muted">
                        <span className="text-gold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Booking Sidebar */}
              <aside className="w-full lg:w-[400px]">
                <RoomBookingForm
                  category={category as unknown as Parameters<typeof RoomBookingForm>[0]["category"]}
                  availableRooms={availableRooms}
                  initialCheckIn={searchParams.checkIn}
                  initialCheckOut={searchParams.checkOut}
                  initialGuests={searchParams.guests ? parseInt(searchParams.guests, 10) : 2}
                />
              </aside>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
