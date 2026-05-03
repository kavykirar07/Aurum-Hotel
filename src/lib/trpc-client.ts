// src/lib/trpc-client.ts
// tRPC client setup for use in Client Components

import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@/server/root";

export const trpc = createTRPCReact<AppRouter>();
