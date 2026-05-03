import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerSideClient } from "@/lib/supabase";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const supabase = await createServerSideClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin?next=/admin");
  }

  // Check if staff member
  const { data: staff } = await supabase
    .from("staff")
    .select("id, role_id")
    .eq("auth_user_id", user.id)
    .single();

  if (!staff) {
    // If not staff, redirect to guest dashboard
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-warm-gray flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-charcoal text-white shrink-0 p-6 flex flex-col">
        <div className="mb-10">
          <Link href="/" className="font-display text-2xl font-light tracking-widest uppercase text-gold">
            Aurum OS
          </Link>
          <p className="text-xs text-white/50 tracking-wider uppercase mt-1">Staff Portal</p>
        </div>

        <nav className="flex-1 space-y-2">
          <Link href="/admin" className="block px-4 py-2 rounded-md bg-white/10 text-white font-medium">
            Dashboard
          </Link>
          <Link href="/admin/bookings" className="block px-4 py-2 rounded-md hover:bg-white/5 text-white/70 transition-colors">
            All Bookings
          </Link>
          <Link href="/admin/inventory" className="block px-4 py-2 rounded-md hover:bg-white/5 text-white/70 transition-colors">
            Inventory Matrix
          </Link>
          <Link href="/admin/pricing" className="block px-4 py-2 rounded-md hover:bg-white/5 text-white/70 transition-colors">
            Pricing Engine
          </Link>
        </nav>

        <div className="pt-6 border-t border-white/10 mt-auto">
          <form action="/auth/signout" method="POST">
            <button type="submit" className="text-sm text-white/70 hover:text-white transition-colors">
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6 md:p-10">
        {children}
      </main>
    </div>
  );
}
