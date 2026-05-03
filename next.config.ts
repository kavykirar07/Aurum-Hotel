import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ── Images ──────────────────────────────────────────────
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "imagedelivery.net",   // Cloudflare Images
      },
      {
        protocol: "https",
        hostname: "*.cloudflarestream.com", // Cloudflare Stream
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com", // Unsplash (interim until Cloudflare Images)
      },
    ],
    formats: ["image/avif", "image/webp"],
  },

  // ── Security Headers ────────────────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options",         value: "DENY" },
          { key: "X-Content-Type-Options",   value: "nosniff" },
          { key: "Referrer-Policy",          value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",       value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
              "frame-src https://js.stripe.com",
              "img-src 'self' data: blob: https://imagedelivery.net https://images.unsplash.com",
              "media-src 'self' https://*.cloudflarestream.com",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.upstash.io https://us.posthog.com https://eu.posthog.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "report-uri /api/csp-report",
            ].join("; "),
          },
        ],
      },
    ];
  },

  // ── Redirects ───────────────────────────────────────────
  async redirects() {
    return [
      {
        source: "/admin",
        destination: "/admin/dashboard",
        permanent: false,
      },
    ];
  },

};

export default nextConfig;
