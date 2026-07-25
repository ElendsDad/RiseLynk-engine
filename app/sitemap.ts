import type { MetadataRoute } from "next";
import { site } from "@/site.config";
import { publishedArticles } from "@/lib/config-schema";
import { isIndexable } from "@/lib/seo";

// Provenance: lifted 2026-07-10 from KitsapComponent
// (Kitsap Component/kitsap-store/app/sitemap.ts). That version read product URLs from
// the storefront database; here the map is generated from site.pages so it stays
// config-driven and needs no backend.
//
// v0.2.0: the blog index and every published (non-draft) article are appended, so the
// hosted blog is discoverable. Drafts are omitted, matching their noindex.
//
// A draft PAGE (PageConfig.draft, mirroring Article.draft) is omitted here the same
// way a draft article is: it carries robots:noindex on its own route regardless of
// this build's overall indexable state, so listing it in the sitemap would contradict
// that noindex. It stays reachable at its direct URL; it is just not advertised here.
//
// Feedback item #20: a not-indexable build (no domain, or seo.draft) still emitted every
// page URL here while robots.txt disallowed everything and every page carried noindex -
// the three surfaces disagreed. isIndexable() is the one source of truth for all three
// (app/robots.ts, app/layout.tsx, and here); a not-indexable build now emits an EMPTY
// sitemap instead of a domain-relative one (closing item #21 too: a relative <loc> is not
// spec-valid XML, and there is nothing worth crawling on a build search will never index).
export default function sitemap(): MetadataRoute.Sitemap {
  if (!isIndexable(site)) return [];
  const base = (site.seo.domain ?? "").replace(/\/+$/, "");
  const now = new Date();

  const pages: MetadataRoute.Sitemap = site.pages.filter((p) => !p.draft).map((p) => {
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
