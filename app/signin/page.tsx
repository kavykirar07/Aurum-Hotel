"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

import Link from "next/link";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });

    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({
        type: "success",
        text: "Check your email for the login link. You can close this window.",
      });
    }
    setLoading(false);
  }

  return (
    <>
      <Navbar />
      <main id="main-content" className="pt-32 pb-24 bg-warm-white min-h-screen flex items-center justify-center">
        <div className="container max-w-md">
          <div className="card p-8 text-center">
            <h1 className="text-display-md text-charcoal mb-2">Welcome Back</h1>
            <p className="text-muted mb-8">Sign in with a magic link to access your reservations.</p>

            {message && (
              <div
                className={`p-4 rounded-md mb-6 text-sm ${
                  message.type === "error" ? "bg-red-50 text-error" : "bg-green-50 text-success"
                }`}
              >
                {message.text}
              </div>
            )}

            {!message || message.type === "error" ? (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="text-left">
                  <label htmlFor="email" className="text-label text-muted block mb-1">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@example.com"
                    className="input w-full"
                    disabled={loading}
                  />
                </div>
                <button type="submit" disabled={loading} className="btn btn-gold w-full mt-4">
                  {loading ? "Sending link..." : "Send Magic Link"}
                </button>
              </form>
            ) : (
              <div className="pt-4 border-t border-black/5 mt-6">
                <Link href="/" className="btn btn-ghost">
                  Return to Home
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
