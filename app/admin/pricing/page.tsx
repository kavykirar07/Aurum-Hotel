import { createServerSideClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import { format } from "date-fns";
import { PricingToggle } from "./pricing-toggle";

export const metadata = {
  title: "Pricing Engine | Admin",
  robots: { index: false, follow: false },
};

export default async function PricingPage() {
  const cookieStore = await cookies();
  const adminSupabase = await createServerSideClient(cookieStore); 
  
  const { data: pricingRules } = await adminSupabase
    .from("seasonal_pricing")
    .select(`
      id, name, valid_from, valid_to, price_modifier, min_los, priority, is_active,
      room_categories (name)
    `)
    .order("priority", { ascending: false });

  const typedRules = pricingRules as unknown as Array<{
    id: string;
    name: string;
    valid_from: string;
    valid_to: string;
    price_modifier: string;
    min_los: number;
    priority: number;
    is_active: boolean;
    room_categories?: { name: string };
  }>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-display text-charcoal mb-2">Pricing Engine</h1>
          <p className="text-muted">Manage seasonal multipliers and demand-based constraints.</p>
        </div>
        <button className="btn btn-gold">Add Rule</button>
      </div>

      <div className="bg-white rounded-lg border border-black/5 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-warm-gray text-muted text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Rule Name</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Date Range</th>
                <th className="px-6 py-4 font-medium">Multiplier</th>
                <th className="px-6 py-4 font-medium">Min Nights</th>
                <th className="px-6 py-4 font-medium">Priority</th>
                <th className="px-6 py-4 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {typedRules?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted">
                    No pricing rules found.
                  </td>
                </tr>
              ) : (
                typedRules?.map((rule) => (
                  <tr key={rule.id} className="hover:bg-warm-white transition-colors">
                    <td className="px-6 py-4 font-medium text-charcoal">{rule.name}</td>
                    <td className="px-6 py-4 text-muted">{rule.room_categories?.name}</td>
                    <td className="px-6 py-4 text-charcoal">
                      {format(new Date(rule.valid_from), "MMM d")} - {format(new Date(rule.valid_to), "MMM d, yyyy")}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono bg-black/5 px-2 py-1 rounded text-gold-dark font-medium">
                        x{parseFloat(rule.price_modifier).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-charcoal">{rule.min_los}</td>
                    <td className="px-6 py-4 text-charcoal">{rule.priority}</td>
                    <td className="px-6 py-4 text-right">
                      <PricingToggle 
                        id={rule.id} 
                        isActive={rule.is_active} 
                        modifier={parseFloat(rule.price_modifier)} 
                      />
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
