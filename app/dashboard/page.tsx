import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { createServerSideClient } from "@/lib/supabase";
import { appRouter } from "@/server/root";
import { createTRPCContext } from "@/server/trpc";
import { format } from "date-fns";
import { CancelBookingButton } from "./cancel-button";

export const metadata = {
  title: "Guest Dashboard | Aurum Hotel",
  robots: { index: false, follow: false },
};

interface DashboardBooking {
  id: string;
  reference: string;
  check_in: string;
  check_out: string;
  status: string;
  total_amount: string;
  rooms?: {
    room_number: string;
    room_categories?: {
      name: string;
    };
  };
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const supabase = await createServerSideClient(cookieStore);
  
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  // Create tRPC caller for server-side fetching
  const ctx = await createTRPCContext({
    req: new Request("http://localhost"),
    resHeaders: new Headers(),
  } as unknown as Parameters<typeof createTRPCContext>[0]);
  
  const caller = appRouter.createCaller(ctx);
  
  const profile = await caller.dashboard.getProfile();
  const { upcoming, past } = await caller.dashboard.getMyBookings() as unknown as { upcoming: DashboardBooking[], past: DashboardBooking[] };

  return (
    <>
      <Navbar />
      <main id="main-content" className="pt-32 pb-24 bg-warm-white min-h-screen">
        <div className="container">
          <div className="mb-12">
            <h1 className="text-display-md text-charcoal mb-2">Guest Dashboard</h1>
            <p className="text-muted">
              Welcome back, {profile?.first_name || user.email}.
              {profile?.loyalty_tier && (
                <span className="ml-3 inline-flex items-center">
                  <span className={`badge badge-loyalty-${profile.loyalty_tier}`}>
                    {profile.loyalty_tier} Member
                  </span>
                </span>
              )}
            </p>
          </div>

          <div className="flex justify-end mb-8">
            <form action="/auth/signout" method="POST">
              <button type="submit" className="btn btn-ghost text-sm">Sign Out</button>
            </form>
          </div>

          {/* Upcoming Stays */}
          <section className="mb-16">
            <h2 className="text-2xl font-display text-charcoal mb-6">Upcoming Stays</h2>
            
            {upcoming.length === 0 ? (
              <div className="card-glass p-8 text-center text-muted">
                You have no upcoming stays. <Link href="/rooms" className="text-gold underline underline-offset-4">Browse our rooms</Link> to book your next getaway.
              </div>
            ) : (
              <div className="grid gap-6">
                {upcoming.map((booking) => (
                  <div key={booking.id} className="card p-6 flex flex-col md:flex-row gap-6 items-start md:items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="badge badge-gold">Confirmed</span>
                        <span className="font-mono text-sm tracking-widest text-muted">{booking.reference}</span>
                      </div>
                      <h3 className="font-display text-xl text-charcoal mb-1">
                        {booking.rooms?.room_categories?.name} — Room {booking.rooms?.room_number}
                      </h3>
                      <p className="text-muted mb-4">
                        {format(new Date(booking.check_in), "MMM do, yyyy")} to {format(new Date(booking.check_out), "MMM do, yyyy")}
                      </p>
                      <p className="text-sm text-charcoal font-medium">
                        Total: ${parseFloat(booking.total_amount).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <CancelBookingButton bookingId={booking.id} checkIn={booking.check_in} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Past Stays */}
          {past.length > 0 && (
            <section>
              <h2 className="text-2xl font-display text-charcoal mb-6">Past & Cancelled Stays</h2>
              <div className="grid gap-4">
                {past.map((booking) => (
                  <div key={booking.id} className="bg-white rounded-lg p-5 border border-black/5 flex flex-col md:flex-row justify-between items-center opacity-75 hover:opacity-100 transition-opacity">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-xs font-medium uppercase tracking-wider text-muted">
                          {booking.status.replace("_", " ")}
                        </span>
                        <span className="font-mono text-xs tracking-widest text-muted/70">{booking.reference}</span>
                      </div>
                      <p className="text-charcoal font-medium">{booking.rooms?.room_categories?.name}</p>
                      <p className="text-sm text-muted">
                        {format(new Date(booking.check_in), "MMM do, yyyy")} to {format(new Date(booking.check_out), "MMM do, yyyy")}
                      </p>
                    </div>
                    <div className="mt-3 md:mt-0">
                      <p className="text-sm text-charcoal font-medium">${parseFloat(booking.total_amount).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      </main>
      <Footer />
    </>
  );
}
