// src/server/root.ts
// Root tRPC router — assembles all sub-routers

import { createTRPCRouter } from "@/server/trpc";
import { availabilityRouter } from "@/server/routers/availability";
import { bookingsRouter } from "@/server/routers/bookings";
import { roomsRouter } from "@/server/routers/rooms";
import { dashboardRouter } from "@/server/routers/dashboard";
import { adminRouter } from "@/server/routers/admin";

export const appRouter = createTRPCRouter({
  availability: availabilityRouter,
  bookings: bookingsRouter,
  rooms: roomsRouter,
  dashboard: dashboardRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
