import { NextResponse } from "next/server";
import { createServerSideClient } from "@/lib/supabase";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const cookieStore = await cookies();
    const supabase = await createServerSideClient(cookieStore);
    
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If there's an error or no code, redirect to sign-in with an error state
  return NextResponse.redirect(`${origin}/signin?error=AuthFailed`);
}
