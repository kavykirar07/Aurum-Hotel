// src/server/trpc.ts
// tRPC server initialization, context, and procedure factories

import { initTRPC, TRPCError } from "@trpc/server";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { createServerSideClient } from "@/lib/supabase";
import { cookies } from "next/headers";
import superjson from "superjson";
import { ZodError } from "zod";

// ============================================================
// CONTEXT
// ============================================================

export async function createTRPCContext(opts: FetchCreateContextFnOptions) {
  const cookieStore = await cookies();
  const supabase = await createServerSideClient(cookieStore);

  // Get authenticated user (null if not logged in)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    supabase,
    user,
    headers: opts.req.headers,
    req: opts.req,
  };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

// ============================================================
// TRPC INIT
// ============================================================

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

// ============================================================
// ROUTER + MIDDLEWARE FACTORIES
// ============================================================

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;

// Public procedure — no auth required
export const publicProcedure = t.procedure;

// Protected procedure — requires authenticated Supabase user
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in" });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // narrowed — guaranteed non-null
    },
  });
});

// Admin procedure — requires authenticated user with staff record
// (RBAC middleware from Part 5 will extend this further)
export const adminProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const { data: staff } = await ctx.supabase
    .from("staff")
    .select("id, role_id, is_active")
    .eq("auth_user_id", ctx.user.id)
    .single();

  if (!staff || !staff.is_active) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Not a staff member" });
  }

  return next({
    ctx: {
      ...ctx,
      staff,
    },
  });
});
