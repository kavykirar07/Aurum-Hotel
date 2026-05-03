import { createServerSideClient } from "@/lib/supabase";
import { cookies } from "next/headers";


export const metadata = {
  title: "Inventory Matrix | Admin",
  robots: { index: false, follow: false },
};

export default async function InventoryPage() {
  const cookieStore = await cookies();
  const adminSupabase = await createServerSideClient(cookieStore); // Uses service role eventually, but user session works if RLS allows or if bypassed in router
  
  // Directly fetching for simplicity in SSR. In a real app, use the caller.
  const { data: rooms } = await adminSupabase
    .from("rooms")
    .select(`
      id, room_number, floor, status, features,
      room_categories (name)
    `)
    .order("floor", { ascending: true })
    .order("room_number", { ascending: true });

  const typedRooms = rooms as unknown as Array<{
    id: string;
    room_number: string;
    floor: number;
    status: string;
    features: string[];
    room_categories?: { name: string };
  }>;

  const floorMap = typedRooms?.reduce((acc, room) => {
    if (!acc[room.floor]) acc[room.floor] = [];
    acc[room.floor].push(room);
    return acc;
  }, {} as Record<number, typeof typedRooms>) || {};

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-display text-charcoal">Inventory Matrix</h1>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span className="text-sm text-muted">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span className="text-sm text-muted">Occupied</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
            <span className="text-sm text-muted">Maintenance</span>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {Object.entries(floorMap).map(([floor, floorRooms]) => (
          <div key={floor} className="bg-white p-6 rounded-lg border border-black/5 shadow-sm">
            <h2 className="text-lg font-display text-charcoal mb-4 border-b border-black/5 pb-2">Floor {floor}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {floorRooms.map((room) => (
                <div 
                  key={room.id} 
                  className={`
                    p-4 rounded border flex flex-col items-center justify-center text-center
                    ${room.status === 'available' ? 'border-green-200 bg-green-50' : 
                      room.status === 'occupied' ? 'border-red-200 bg-red-50' : 
                      room.status === 'maintenance' ? 'border-yellow-200 bg-yellow-50' : 
                      'border-gray-200 bg-gray-50'}
                  `}
                >
                  <span className="font-mono text-lg font-medium text-charcoal">{room.room_number}</span>
                  <span className="text-xs text-muted truncate w-full mt-1">{room.room_categories?.name}</span>
                  <span className="text-[10px] font-bold uppercase mt-2 tracking-widest opacity-60">
                    {room.status.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
