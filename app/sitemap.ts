import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/products`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/phones`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/accessories`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${siteUrl}/spare-parts`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${siteUrl}/services`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];

  try {
    const [phonesRes, partsRes] = await Promise.all([
      fetch(`${API_URL}/api/phones?limit=500`, { cache: "no-store" }),
      fetch(`${API_URL}/api/spare-parts?limit=500`, { cache: "no-store" }),
    ]);

    const productUrls: MetadataRoute.Sitemap = [];
    if (phonesRes.ok) {
      const phones = (await phonesRes.json()) as Array<{ _id?: string; updatedAt?: string }>;
      for (const p of Array.isArray(phones) ? phones : []) {
        if (!p?._id) continue;
        productUrls.push({
          url: `${siteUrl}/product/${p._id}`,
          lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
          changeFrequency: "daily",
          priority: 0.7,
        });
      }
    }

    if (partsRes.ok) {
      const raw = await partsRes.json();
      const parts = Array.isArray(raw?.parts) ? raw.parts : Array.isArray(raw) ? raw : [];
      for (const p of parts as Array<{ _id?: string; updatedAt?: string }>) {
        if (!p?._id) continue;
        productUrls.push({
          url: `${siteUrl}/product/${p._id}`,
          lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
          changeFrequency: "daily",
          priority: 0.65,
        });
      }
    }

    return [...staticPages, ...productUrls];
  } catch {
    return staticPages;
  }
}
