// ============================================================
// site-engine - brochure gallery model (feedback item #18)
//
// Pure, dependency-free resolver for the `gallery` section's two independent
// content shapes: the plain photo grid (`section.images`, each optionally
// captioned) and the brand-neutral before/after work-pair grid
// (`section.pairs`, with `beforeLabel`/`afterLabel` tags). Same shared-.mjs
// pattern as lib/story-graph.mjs and lib/hours-ld.mjs: one module feeds the
// component (components/sections/Gallery.tsx), unit-tested in plain Node
// (tools/gallery.test.mjs) without a React renderer or TypeScript toolchain.
//
// WHY THIS EXISTS: the elevator-contractor archetype already has a
// before/after gallery (the `modGallery` section, lib/config-schema.ts
// Project type), but its vocabulary (equipmentClass, "modernization") is
// elevator-specific. A visual trade (roofing, tree work, pressure washing)
// still wants a before/after grid, without borrowing that vocabulary and
// without a config author smuggling a caption into the `alt` attribute
// (alt text is accessibility copy, not a place for visible marketing copy).
// This module resolves the SAME `gallery` section into a plain-grid model
// plus a pairs model; `modGallery` and its Project type are untouched.
//
// CLAIMS WALL: a caption or note is config-supplied text, rendered verbatim
// with no rewriting, truncation, or invention. An item/pair with no caption
// renders with no caption; nothing is ever synthesized to fill the gap.
//
// FAIL-SAFE, NOT FAIL-CLOSED: unlike lib/hours-ld.mjs (where one malformed
// entry withholds the WHOLE schedule, because a half-published schedule is a
// wrong claim by omission), a malformed pair here is simply DROPPED and every
// other valid pair still renders. A missing image is a broken render (a
// <img> with no src), not a false claim about the business, so withholding
// the entire gallery over one bad pair would be overkill - the same
// judgment call lib/story-graph.mjs makes for a malformed edge. Absent or
// non-array `images`/`pairs` resolve to empty arrays; this function never
// throws, on any input shape.
// ============================================================

/** @typedef {{ src: string, alt: string, caption?: string }} GalleryImage */
/** @typedef {{ before: { src: string, alt: string }, after: { src: string, alt: string }, caption?: string, note?: string }} GalleryPair */

// A usable image reference: a non-empty string src AND a non-empty string
// alt. Both are required (an image with no alt is an accessibility bug; an
// image with no src has nothing to render), so a half-specified image
// reference is treated as absent rather than rendered broken.
function isUsableImageRef(ref) {
  return (
    !!ref &&
    typeof ref === "object" &&
    typeof ref.src === "string" &&
    ref.src.trim() !== "" &&
    typeof ref.alt === "string" &&
    ref.alt.trim() !== ""
  );
}

// A caption/note passes through verbatim as a string, or resolves to
// undefined. Anything not a non-empty string (a number, an object, an empty
// string) is treated as absent rather than coerced, so the component's
// caption-less byte-identity path is never accidentally triggered by a
// falsy-but-present value, and a caption is always exactly what the config
// wrote or nothing at all (claims wall: never invented, never mangled).
function textOrUndefined(value) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : value;
}

// Resolve `section.images` into the model's `items`: one entry per usable
// image ref, in declaration order, with `caption` carried through verbatim
// (or undefined for a caption-less item, which is the pre-caption shape and
// the component's byte-identity precondition). An unusable ref (missing/
// blank src or alt) is dropped like a malformed pair below, never rendered
// as a broken <img>.
function resolveItems(images) {
  if (!Array.isArray(images)) return [];
  const out = [];
  for (const img of images) {
    if (!isUsableImageRef(img)) continue;
    out.push({ src: img.src, alt: img.alt, caption: textOrUndefined(img.caption) });
  }
  return out;
}

// Resolve `section.pairs` into the model's `pairs`: one entry per pair whose
// `before` AND `after` are both usable image refs (see isUsableImageRef); any
// other shape (missing side, missing src/alt, a non-object entry, null) is
// dropped silently and does not affect any other pair. caption/note pass
// through verbatim per textOrUndefined.
function resolvePairs(pairs) {
  if (!Array.isArray(pairs)) return [];
  const out = [];
  for (const pair of pairs) {
    if (!pair || typeof pair !== "object") continue;
    if (!isUsableImageRef(pair.before) || !isUsableImageRef(pair.after)) continue;
    out.push({
      before: { src: pair.before.src, alt: pair.before.alt },
      after: { src: pair.after.src, alt: pair.after.alt },
      caption: textOrUndefined(pair.caption),
      note: textOrUndefined(pair.note),
    });
  }
  return out;
}

// Full gallery model for one `gallery` section: { items, pairs, beforeLabel,
// afterLabel }. `items` is the plain-grid model (empty when `images` is
// absent/non-array/all-unusable); `pairs` is the before/after model (empty
// the same way); `beforeLabel`/`afterLabel` default to "Before"/"After" when
// absent, blank, or not a string, so an existing config that never sets them
// gets the plain English default and a config with a real override gets it
// verbatim. Never throws: a missing, empty, or malformed `section` resolves
// to the empty model rather than raising.
export function resolveGalleryModel(section) {
  const s = section && typeof section === "object" ? section : {};
  return {
    items: resolveItems(s.images),
    pairs: resolvePairs(s.pairs),
    beforeLabel: textOrUndefined(s.beforeLabel) ?? "Before",
    afterLabel: textOrUndefined(s.afterLabel) ?? "After",
  };
}
