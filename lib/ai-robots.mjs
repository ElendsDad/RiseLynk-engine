// ============================================================
// site-engine - AI crawler robots.txt policy (trust pack)
//
// CRITICAL TENSION: the engine emits /llms.txt so local businesses get FOUND
// and CITED in AI answers. Blanket-blocking every AI agent would destroy that
// customer value. The safe default ("split") therefore:
//   - DISALLOWS training / bulk-scrape crawlers and training opt-out tokens
//   - ALLOWS search / citation / user-fetch agents (they inherit the generic
//     User-agent: * Allow: / rule)
//
// A site may opt into policy "block" to also disallow the citation agents,
// understanding the discoverability cost.
//
// robots.txt is ADVISORY. Badly-behaved scrapers ignore it. Real enforcement
// for a site on Cloudflare DNS is the zone-level "Block AI Scrapers and
// Crawlers" toggle (founder runbook). Lists researched mid-2026 against
// vendor-documented user-agents; refresh when vendors split fleets again.
// ============================================================

// Training / bulk-scrape crawlers + training opt-out tokens. Google-Extended
// and Applebot-Extended are control tokens (not separate HTTP crawlers); listing
// them is the documented way to opt out of Gemini / Apple Intelligence training
// without affecting Googlebot / Applebot search indexing.
export const TRAINING_BOTS = Object.freeze([
  "GPTBot",
  "ClaudeBot",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
  "Bytespider",
  "anthropic-ai",
  "Claude-Web",
  "cohere-ai",
  "Meta-ExternalAgent",
  "Amazonbot",
]);

// Search-indexing and user-triggered fetch agents that drive AI citations /
// recommendations. Kept under the generic allow in "split" mode.
export const CITATION_BOTS = Object.freeze([
  "OAI-SearchBot",
  "ChatGPT-User",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
]);

/**
 * @param {{ aiCrawlers?: unknown } | null | undefined} seo
 * @returns {"split" | "block"}
 */
export function resolveAiCrawlerPolicy(seo) {
  const v = seo?.aiCrawlers;
  if (v === "block") return "block";
  // Absent, "split", or any unknown value -> safe split default (fail closed
  // toward preserving citation discoverability rather than inventing a third mode).
  return "split";
}

/**
 * @param {{ indexable: boolean, policy?: "split" | "block" }} opts
 * @returns {Array<{ userAgent: string, allow?: string, disallow: string | string[] }>}
 */
export function buildRobotsRules(opts) {
  const { indexable, policy = "split" } = opts || {};
  if (!indexable) {
    return [{ userAgent: "*", disallow: "/" }];
  }
  /** @type {Array<{ userAgent: string, allow?: string, disallow: string | string[] }>} */
  const rules = [
    { userAgent: "*", allow: "/", disallow: ["/api/"] },
  ];
  for (const bot of TRAINING_BOTS) {
    rules.push({ userAgent: bot, disallow: "/" });
  }
  if (policy === "block") {
    for (const bot of CITATION_BOTS) {
      rules.push({ userAgent: bot, disallow: "/" });
    }
  }
  return rules;
}

/**
 * Belt-and-braces HTML meta signals. These are CONVENTIONAL / voluntary
 * machine-readable preferences (TDM Reservation Protocol; unofficial noai /
 * noimageai tokens). They are NOT a substitute for a license, statute, or
 * Cloudflare WAF rule, and badly-behaved scrapers ignore them the same way
 * they ignore robots.txt.
 *
 * @param {{ indexable: boolean, policy?: "split" | "block", enabled?: boolean }} opts
 * @returns {Array<{ name: string, content: string }>}
 */
export function aiMetaTags(opts) {
  const { indexable, enabled = true } = opts || {};
  if (!indexable || enabled === false) return [];
  return [
    { name: "tdm-reservation", content: "1" },
    { name: "robots", content: "noai, noimageai" },
  ];
}
