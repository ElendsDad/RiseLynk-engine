// ============================================================
// site-engine - per-service detail-page Service JSON-LD (feedback item #19)
//
// Consumer feedback item #19 (engine-feedback-v0.12.0.md lines 73-76): "one quality
// indexable page per service is the standard trades SEO lever and the only legitimate
// home for organic review stars (Service/Product schema)". Item #25 already shipped the
// linking seam (FeatureItem.href / ServiceLine.href); a service detail page is authored
// as a normal PageConfig entry. What was missing is this: a page-level Service node
// identified by the PAGE'S OWN URL, so a genuine detail page (not the sitewide Service
// list in lib/seo.ts siteGraphLd) is the thing search engines and AI answer engines index
// as the canonical description of that one service, and the legitimate home for that
// service's own review stars.
//
// Pure, dependency-free builder, shared by lib/seo.ts's TypeScript callers (via TS-to-mjs
// import, same pattern as lib/rating-ld.mjs / lib/hours-ld.mjs / lib/area-ld.mjs) AND
// tools/service-page.test.mjs (plain Node, no TypeScript toolchain).
//
// CLAIMS WALL: rating/reviews are folded in through the EXISTING withRatingLd (see
// lib/rating-ld.mjs) - zero new logic, so the one-place claims-wall guard (no
// AggregateRating without a real, config-supplied rating; Review nodes only from real
// review items) cannot drift between the business node, a Product node, and this one.
//
// GATE: returns null when `url` is falsy, mirroring lib/seo.ts's productLdsForSections
// gate on site.seo.domain - a domain-less preview build (a client-review deploy with no
// real domain configured) has no stable URL to identify this node with, so it emits
// nothing rather than a wrong or transient @id. The caller passes url = canonicalUrl(...),
// which is itself undefined without a configured domain, so this gate composes for free.
//
// Plain ESM (no TypeScript annotations); JSDoc gives the TS callers a signature.
// ============================================================

import { withRatingLd } from "./rating-ld.mjs";

/** @typedef {import("./rating-ld.mjs").RatingFacts} RatingFacts */
/** @typedef {import("./rating-ld.mjs").ReviewItem} ReviewItem */

/**
 * @param {{
 *   url: string | undefined,
 *   orgId: string | undefined,
 *   name: string,
 *   description?: string,
 *   serviceType?: string,
 *   areaServed?: Record<string, unknown> | Record<string, unknown>[] | null,
 *   rating?: RatingFacts,
 *   reviews?: ReviewItem[],
 * }} input
 * @returns {Record<string, unknown> | null}
 */
export function servicePageLd({ url, orgId, name, description, serviceType, areaServed, rating, reviews }) {
  if (!url) return null;
  /** @type {Record<string, unknown>} */
  const ld = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${url}#service`,
    name,
  };
  if (description) ld.description = description;
  ld.url = url;
  ld.provider = { "@id": orgId };
  if (serviceType) ld.serviceType = serviceType;
  if (areaServed) ld.areaServed = areaServed;
  // AggregateRating / Review for THIS service, only from a REAL config-supplied rating
  // (claims-walled in withRatingLd, the same one gate every other node in the engine
  // uses). A service page with none emits a bare Service node.
  withRatingLd(ld, rating, reviews);
  return ld;
}
