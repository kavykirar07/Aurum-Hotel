import { appRouter } from "@/server/root";
import { createTRPCContext } from "@/server/trpc";
import { format } from "date-fns";

export const metadata = {
  title: "Admin Dashboard | Aurum Hotel OS",
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage() {
  // Mock request for SSR tRPC caller
  const ctx = await createTRPCContext({
    req: new Request("http://localhost"),
    resHeaders: new Headers(),
  } as unknown as Parameters<typeof createTRPCContext>[0]);
  
  const caller = appRouter.createCaller(ctx);
  
  // Fetch data in parallel
  const [stats, recentBookingsData] = await Promise.all([
    caller.admin.getOverviewStats(),
    caller.admin.getRecentBookings({ limit: 10 }),
  ]);

  // Handle explicit any issue cleanly
  const recentBookings = recentBookingsData as unknown as Array<{
    id: string;
    reference: string;
    status: string;
    total_amount: string;
    check_in: string;
    check_out: string;
    rooms?: { room_number: string; room_categories?: { name: string } };
    guests?: { first_name: string; last_name: string; email: string };
  }>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-display text-charcoal">Overview</h1>
        <div className="text-sm text-muted">
          {format(new Date(), "EEEE, MMMM do, yyyy")}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-6 rounded-lg border border-black/5 shadow-sm">
          <p className="text-sm text-muted uppercase tracking-wider mb-2">Bookings Today</p>
          <p className="text-4xl font-display text-charcoal">{stats.bookingsToday}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-black/5 shadow-sm">
          <p className="text-sm text-muted uppercase tracking-wider mb-2">Arrivals Today</p>
          <p className="text-4xl font-display text-charcoal">{stats.arrivalsToday}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-black/5 shadow-sm">
          <p className="text-sm text-muted uppercase tracking-wider mb-2">Total Confirmed Revenue</p>
          <p className="text-4xl font-display text-gold-dark">${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="bg-white rounded-lg border border-black/5 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-black/5">
          <h2 className="text-xl font-display text-charcoal">Recent Bookings</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-warm-gray text-muted text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Ref</th>
                <th className="px-6 py-4 font-medium">Guest</th>
                <th className="px-6 py-4 font-medium">Room</th>
                <th className="px-6 py-4 font-medium">Dates</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {recentBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted">
                    No recent bookings found.
                  </td>
                </tr>
              ) : (
                recentBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-warm-white transition-colors">
                    <td className="px-6 py-4 font-mono tracking-widest text-charcoal">{booking.reference}</td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-charcoal">
                        {booking.guests?.first_name} {booking.guests?.last_name}
                      </p>
                      <p className="text-xs text-muted">{booking.guests?.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-charcoal">{booking.rooms?.room_categories?.name}</p>
                      <p className="text-xs text-muted">Room {booking.rooms?.room_number}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-charcoal">{format(new Date(booking.check_in), "MMM d")} &mdash; {format(new Date(booking.check_out), "MMM d")}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider ${
                        booking.status === "confirmed" ? "bg-green-100 text-green-800" :
                        booking.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                        booking.status === "cancelled" ? "bg-red-100 text-red-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-charcoal">
                      ${parseFloat(booking.total_amount).toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
