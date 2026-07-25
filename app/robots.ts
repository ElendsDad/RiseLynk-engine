import type { MetadataRoute } from "next";
import { site } from "@/site.config";
import { isIndexable } from "@/lib/seo";
import { buildRobotsRules, resolveAiCrawlerPolicy } from "@/lib/ai-robots.mjs";

// Provenance: lifted 2026-07-10 from KitsapComponent
// (Kitsap Component/kitsap-store/app/robots.ts). The SITE_URL constant and the
// storefront-specific disallow list (/admin, /account, /portal, /checkout) were
// replaced by the config domain and the engine's own private path (/api/).
//
// Trust pack: AI crawler split (lib/ai-robots.mjs). Default policy blocks
// training/bulk-scrape agents while leaving citation/search agents under the
// generic allow so /llms.txt discovery still works. Opt into seo.aiCrawlers:
// "block" to disallow citation agents too (discoverability cost). robots.txt
// is advisory; Cloudflare's zone toggle is the real enforcement when DNS is
// on Cloudflare.
export default function robots(): MetadataRoute.Robots {
  const base = (site.seo.domain ?? "").replace(/\/+$/, "");
  const indexable = isIndexable(site);
  const policy = resolveAiCrawlerPolicy(site.seo);
  const rules = buildRobotsRules({ indexable, policy });
  return {
    rules,
    ...(indexable && base ? { sitemap: `${base}/sitemap.xml`, host: base } : {}),
  };
}
