import type { MetadataRoute } from "next";
import { site } from "@/site.config";
import { publishedArticles } from "@/lib/config-schema";

// Provenance: lifted 2026-07-10 from KitsapComponent
// (Kitsap Component/kitsap-store/app/sitemap.ts). That version read product URLs from
// the storefront database; here the map is generated from site.pages so it stays
// config-driven and needs no backend.
//
// v0.2.0: the blog index and every published (non-draft) article are appended, so the
// hosted blog is discoverable. Drafts are omitted, matching their noindex.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = (site.seo.domain ?? "").replace(/\/+$/, "");
  const now = new Date();

  const pages: MetadataRoute.Sitemap = site.pages.map((p) => {
    const isHome = p.slug === "";
    return {
      url: `${base}${isHome ? "" : `/${p.slug}`}`,
      lastModified: now,
      changeFrequency: isHome ? "weekly" : "monthly",
      priority: isHome ? 1 : 0.6,
    };
  });

  if (!site.blog) return pages;

  const blogIndex: MetadataRoute.Sitemap = [
    { url: `${base}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
  ];
  const articles: MetadataRoute.Sitemap = publishedArticles(site).map((a) => ({
    url: `${base}/blog/${a.slug}`,
    lastModified: a.date ? new Date(a.date) : now,
    changeFrequency: "yearly",
    priority: 0.5,
  }));

  return [...pages, ...blogIndex, ...articles];
}
