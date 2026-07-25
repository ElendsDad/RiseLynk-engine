// ============================================================
// site-engine - deterministic per-section DOM id resolution (feedback item 7)
//
// PROBLEM THIS CLOSES: components/sections/Pricing.tsx hardcodes `id="pricing"`, so
// a page can only ever carry ONE pricing section (a second collides on the DOM id,
// and there was no config-level way to tell two such sections apart at all). The
// addons section (components/sections/Addons.tsx, lib/config-schema.ts) is the
// first consumer of a real fix: it needs a UNIQUE id per section instance, with
// zero config required in the common one-section case, and a config-level escape
// hatch for a site that wants a specific id (an anchor link already points at it,
// for example).
//
// MECHANISM: Section gets an optional `id` field (see its doc comment in
// lib/config-schema.ts). A section that sets it wins outright - the explicit id is
// used VERBATIM (the site author is trusted with their own markup, same discipline
// as every other config string in this engine). A section that OMITS it gets a
// DETERMINISTIC auto-suffixed id instead: the given `base` slug (e.g. "addons") for
// the FIRST section of that TYPE on the page, "<base>-2" for the second, "<base>-3"
// for the third, and so on - counted by POSITION in the page's own section list
// (document order), never by content, never by Math.random() or Date.now(). Same
// config in, same ids out, every time (a rebuild, or a resumed build, never moves
// an id a link may already point at). Interleaved OTHER section types between two
// same-type sections do not affect the count: only sections of the SAME type as the
// one being resolved are counted.
//
// Dependency-free plain ESM so tools/addons.test.mjs can exercise it with plain
// Node, same as every other lib/*.mjs module in this engine.
// ============================================================

/**
 * Resolve the DOM id for the section at `index` within `sections`.
 *
 * @param {{ type?: string, id?: string }[] | undefined | null} sections - the
 *   page's full Section list, in document order (the SAME array/order
 *   components/SectionRenderer.tsx walks).
 * @param {number} index - the index, within `sections`, of the section being
 *   resolved. Out-of-range (negative, past the end, or a non-array `sections`)
 *   resolves as if it were the first (and only) section of its type: `base`.
 * @param {string} base - the fallback slug for this section's type when no
 *   explicit `id` is set (e.g. "addons").
 * @returns {string} the explicit `section.id` when set to a non-empty (trimmed)
 *   string, else the deterministic auto-suffixed slug.
 */
export function resolveSectionId(sections, index, base) {
  const list = Array.isArray(sections) ? sections : [];
  const section = index >= 0 && index < list.length ? list[index] : undefined;
  const explicit = section && typeof section.id === "string" ? section.id.trim() : "";
  if (explicit) return explicit;
  const type = section ? section.type : undefined;
  let occurrence = 0;
  for (let i = 0; i <= index && i < list.length; i++) {
    if (list[i] && list[i].type === type) occurrence++;
  }
  // No section found at all (empty/short list, or a negative index) still resolves
  // to a real id rather than a blank/undefined one: occurrence stays 0, which takes
  // the same "first occurrence" branch as occurrence === 1.
  return occurrence <= 1 ? base : `${base}-${occurrence}`;
}
