import type { MetadataRoute } from "next";
import { services } from "@/server/container";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

/** Spec C1: every public route, lastmod from each record's updatedAt. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await services().seo.sitemapEntries(new Date());
  return entries.map((entry) => ({
    url: `${SITE_URL}${entry.path}`,
    lastModified: entry.lastModified,
    changeFrequency: entry.path === "/" || entry.path.startsWith("/classes") ? "daily" : "weekly",
    priority: entry.path === "/" ? 1 : entry.path.split("/").length === 2 ? 0.8 : 0.6,
  }));
}
