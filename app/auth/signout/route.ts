import { NextResponse } from "next/server";
import { createServerSideClient } from "@/lib/supabase";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = await createServerSideClient(cookieStore);

  await supabase.auth.signOut();

  // Redirect to home page after sign out
  return NextResponse.redirect(new URL("/", request.url), {
    status: 302,
  });
}
