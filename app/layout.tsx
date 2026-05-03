// app/layout.tsx — Root layout with providers, fonts, and metadata

import type { Metadata } from "next";
import "./globals.css";
import { TRPCProvider } from "@/providers/trpc-provider";

export const metadata: Metadata = {
  title: {
    default: "Aurum Hotel — Luxury Boutique Experience",
    template: "%s | Aurum Hotel",
  },
  description:
    "Experience unparalleled luxury at Aurum Hotel. Award-winning boutique hotel with world-class dining, spa, and personalised concierge service.",
  keywords: ["luxury hotel", "boutique hotel", "fine dining", "spa", "Aurum"],
  authors: [{ name: "Aurum Hotel" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Aurum Hotel",
    title: "Aurum Hotel — Luxury Boutique Experience",
    description:
      "Experience unparalleled luxury at Aurum Hotel. Award-winning boutique hotel with world-class dining, spa, and personalised concierge service.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  twitter: {
    card: "summary_large_image",
    title: "Aurum Hotel — Luxury Boutique Experience",
    description:
      "Experience unparalleled luxury at Aurum Hotel.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#1a1a1a" />
      </head>
      <body className="antialiased min-h-screen flex flex-col">
        {/* Skip to main content — WCAG 2.2 AA */}
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[500] focus:px-4 focus:py-2 focus:bg-white focus:text-charcoal focus:rounded">
          Skip to main content
        </a>
        <div className="film-grain" />
        <TRPCProvider>
          {children}
        </TRPCProvider>
      </body>
    </html>
  );
}
