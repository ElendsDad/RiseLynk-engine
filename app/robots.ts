import type { MetadataRoute } from "next";
import { site } from "@/site.config";
import { isIndexable } from "@/lib/seo";

// Provenance: lifted 2026-07-10 from KitsapComponent
// (Kitsap Component/kitsap-store/app/robots.ts). The SITE_URL constant and the
// storefront-specific disallow list (/admin, /account, /portal, /checkout) were
// replaced by the config domain and the engine's own private path (/api/).
export default function robots(): MetadataRoute.Robots {
  const base = (site.seo.domain ?? "").replace(/\/+$/, "");
  // A draft or domain-less build (a client-review deploy) disallows all crawling, so a
  // not-yet-live brand stays out of search even on a public production alias.
  if (!isIndexable(site)) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    ...(base ? { sitemap: `${base}/sitemap.xml`, host: base } : {}),
  };
}
