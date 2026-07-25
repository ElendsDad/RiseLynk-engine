// ============================================================
// site-engine - service-area collector + areaServed JSON-LD seam
//
// Pure, dependency-free builders for the areaServed value on the
// Organization/LocalBusiness node and every Service node, shared by lib/seo.ts
// and lib/llms.ts (the app) AND tools/service-area.test.mjs (plain Node). Same
// shared-.mjs pattern as lib/rating-ld.mjs: one module, unit-tested without a
// TypeScript toolchain.
//
// CLAIMS WALL: an area is config-supplied copy, rendered verbatim. The engine
// never invents a coverage claim: with no `business.serviceArea` string and no
// serviceArea sections, areaServedLd returns null and nothing is emitted.
//
// BACK-COMPAT SEAM: the legacy single-string path reproduces the inline
// `{ "@type": "Place", name: b.serviceArea }` object lib/seo.ts carried before,
// byte-for-byte including key order, so every existing config's @graph is
// unchanged. Structured areas (serviceArea sections) win over the string; the
// two are never merged.
//
// Plain ESM (no TypeScript annotations); JSDoc gives the TS callers a signature.
// ============================================================

/** @typedef {{ name: string, note?: string }} ServiceAreaItem */

// Collect every structured service area the active config defines, across all
// pages and serviceArea sections. Mirrors lib/services.ts allServiceLines():
// ONE collector feeds the @graph and llms.txt, so the machine-readable surfaces
// are built from the same areas the ServiceArea section renders (they cannot
// drift). Dedupes by normalized (trim, lowercase) name, first occurrence wins;
// order is otherwise preserved.
/**
 * @param {{ pages: { draft?: boolean, sections: { type: string, areas?: ServiceAreaItem[] }[] }[] }} site
 * @returns {ServiceAreaItem[]}
 */
export function collectServiceAreas(site) {
  /** @type {ServiceAreaItem[]} */
  const out = [];
  const seen = new Set();
  // A draft page (PageConfig.draft) is not yet approved to go live, so its
  // serviceArea sections never leak into this collector, and therefore never into
  // either of its two consumers: areaServed JSON-LD (lib/seo.ts) and llms.txt's
  // "Areas served" line (lib/llms.ts). Absent draft (the default): every page
  // counts, unchanged.
  for (const page of site.pages) {
    if (page.draft) continue;
    for (const section of page.sections) {
      if (section.type !== "serviceArea" || !section.areas) continue;
      for (const area of section.areas) {
        if (!area?.name) continue;
        const key = area.name.trim().toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(area);
      }
    }
  }
  return out;
}

// The areaServed value for a JSON-LD node. Structured areas win: a non-empty
// collected list becomes one Place node per area. Otherwise the legacy string
// becomes the single Place object exactly as lib/seo.ts inlined it ("@type"
// first, then "name"; key order is part of the byte-identical contract).
// Null when the config supplies neither (claims wall: no invented coverage).
/**
 * @param {string | undefined} serviceArea
 * @param {ServiceAreaItem[] | undefined} [areas]
 * @returns {Record<string, unknown> | Record<string, unknown>[] | null}
 */
export function areaServedLd(serviceArea, areas) {
  if (Array.isArray(areas) && areas.length) {
    return areas.map((a) => ({ "@type": "Place", name: a.name }));
  }
  return serviceArea ? { "@type": "Place", name: serviceArea } : null;
}

// The llms.txt "- Areas served:" payload: the collected names joined with ", ".
// Null when there are no structured areas, so the Contact block is unchanged
// for every config without a serviceArea section.
/**
 * @param {ServiceAreaItem[] | undefined} [areas]
 * @returns {string | null}
 */
export function areasLine(areas) {
  if (!Array.isArray(areas) || !areas.length) return null;
  return areas.map((a) => a.name).join(", ");
}
