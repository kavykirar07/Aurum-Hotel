// src/lib/supabase.ts
// Supabase client factories for server-side and client-side usage

import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import type { cookies } from "next/headers";

// ============================================================
// ENVIRONMENT VALIDATION
// ============================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-role-key";

if (!supabaseUrl) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
if (!supabaseAnonKey) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set");

// ============================================================
// SERVER-SIDE CLIENT (bypasses RLS — for tRPC routers)
// ============================================================

/**
 * Service-role client — bypasses all RLS policies.
 * Use ONLY in server-side tRPC procedures, never in client components.
 */
export function createServiceClient() {
  if (!supabaseServiceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }
  return createClient(supabaseUrl!, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * SSR-aware server client — respects RLS, reads cookies for auth.
 * Use in Server Components and Route Handlers.
 */
export async function createServerSideClient(
  cookieStore: Awaited<ReturnType<typeof cookies>>
) {
  return createServerClient(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });
}

// ============================================================
// BROWSER CLIENT (singleton, anon key)
// ============================================================

let browserClient: ReturnType<typeof createClient> | null = null;

/**
 * Browser-safe Supabase client. Returns a singleton to avoid multiple instances.
 * Safe to call in "use client" components.
 */
export function getSupabaseBrowserClient() {
  if (!browserClient) {
    browserClient = createClient(supabaseUrl!, supabaseAnonKey!);
  }
  return browserClient;
}
