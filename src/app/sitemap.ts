import type { MetadataRoute } from "next";
import { getAllPublished, getCategories, getPublishedPages } from "@/lib/data/public";
import { absoluteUrl, articlePath } from "@/lib/format";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, categories, pages] = await Promise.all([getAllPublished(), getCategories(), getPublishedPages()]);
  return [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/services"), changeFrequency: "monthly", priority: 0.6 },
    ...pages.map((p) => ({ url: absoluteUrl(`/${p.slug}`), lastModified: p.updated_at, priority: 0.7 })),
    ...categories.map((c) => ({ url: absoluteUrl(`/${c.slug}`), changeFrequency: "daily" as const, priority: 0.8 })),
    ...articles.map((a) => ({
      url: absoluteUrl(articlePath(a)),
      lastModified: a.updated_at,
      priority: 0.6,
      ...(a.cover_image_url ? { images: [a.cover_image_url] } : {}),
    })),
  ];
}
