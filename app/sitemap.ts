// app/sitemap.ts — Auto-generated sitemap via Next.js App Router
import type { MetadataRoute } from "next";
import { createServiceClient } from "@/lib/supabase";

export const revalidate = 86400; // Revalidate sitemap daily

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://aurumhotel.com";

  // Fetch dynamic room category slugs from Supabase
  let roomUrls: MetadataRoute.Sitemap = [];
  try {
    const supabase = createServiceClient();
    const { data: categories } = await supabase
      .from("room_categories")
      .select("slug, created_at");

    roomUrls = (categories ?? []).map((cat) => ({
      url: `${baseUrl}/rooms/${cat.slug}`,
      lastModified: cat.created_at ? new Date(cat.created_at) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    }));
  } catch {
    // Non-blocking — sitemap still renders static pages if DB unreachable
  }

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl,                        lastModified: new Date(), changeFrequency: "daily",   priority: 1.0 },
    { url: `${baseUrl}/rooms`,             lastModified: new Date(), changeFrequency: "daily",   priority: 0.95 },
    { url: `${baseUrl}/dining`,            lastModified: new Date(), changeFrequency: "weekly",  priority: 0.8 },
    { url: `${baseUrl}/spa`,               lastModified: new Date(), changeFrequency: "weekly",  priority: 0.8 },
    { url: `${baseUrl}/experiences`,       lastModified: new Date(), changeFrequency: "weekly",  priority: 0.75 },
    { url: `${baseUrl}/about`,             lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/loyalty`,           lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/gift-cards`,        lastModified: new Date(), changeFrequency: "monthly", priority: 0.55 },
    { url: `${baseUrl}/contact`,           lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/careers`,           lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/press`,             lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/accessibility`,     lastModified: new Date(), changeFrequency: "yearly",  priority: 0.2 },
    { url: `${baseUrl}/privacy`,           lastModified: new Date(), changeFrequency: "yearly",  priority: 0.2 },
    { url: `${baseUrl}/terms`,             lastModified: new Date(), changeFrequency: "yearly",  priority: 0.2 },
  ];

  return [...staticPages, ...roomUrls];
}
