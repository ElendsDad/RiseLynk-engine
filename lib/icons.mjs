// =============================================================================
// BUILT-IN ICON SET (feedback-v0.5.0 item 12, cosmetic). A small, curated,
// brand-neutral, dependency-free set of inline SVG icons a `services` (feature-card)
// item can opt into by name, instead of the literal glyph string FeatureItem.icon has
// always rendered verbatim (a bare "*" in the demos; the consumer's own workaround was
// to omit `icon` entirely, since that reads cleaner than the punctuation placeholder).
//
// Additive and default OFF: a card with no `iconName` keeps rendering byte-for-byte as
// before (the legacy `icon` glyph, or nothing). This module holds only the DATA (path
// geometry); components/Icon.tsx draws it, mirroring the lib-holds-data /
// component-draws-it split lib/stars.mjs + components/StarRating.tsx already use.
//
// Every icon is hand-drawn path data on a 24x24 viewBox, stroked in `currentColor` at a
// shared weight (drawn by components/Icon.tsx), so it inherits whatever CSS color
// context frames it (the engine's icon frame uses the brand accent). Not traced from,
// or a subset of, any third-party icon font or SVG library: no dependency, no license
// to track.
// =============================================================================

export const ICONS = {
  wrench: ["M14.7 6.3a4 4 0 0 1-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 1 5.4-5.4L21 6l-3-3-3.3 3.3Z"],
  shield: ["M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z", "M9.5 12l1.8 1.8L15 10"],
  clock: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z", "M12 7v5l3.5 2"],
  phone: [
    "M6.6 3.5 9 8l-2 2.3a12 12 0 0 0 6.7 6.7L16 15l4.5 2.4-.5 3.4a2 2 0 0 1-2.1 1.7C10 22 2 14 1.5 5.6A2 2 0 0 1 3.2 3.5H6.6Z",
  ],
  mapPin: ["M12 21s7-6.3 7-11.5a7 7 0 1 0-14 0C5 14.7 12 21 12 21Z", "M12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"],
  check: ["M4 12.5l5.5 5.5L20 7"],
  calendar: [
    "M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v13A1.5 1.5 0 0 1 18.5 20h-13A1.5 1.5 0 0 1 4 18.5v-13Z",
    "M4 9.5h16",
    "M8 3v3",
    "M16 3v3",
  ],
  truck: [
    "M3 6h11v9H3z",
    "M14 10h4l3 3v2h-7v-5Z",
    "M6.5 18a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4Z",
    "M17.5 18a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4Z",
  ],
};

export const ICON_NAMES = Object.keys(ICONS);

// Path data for a valid name, or null. Fail-safe by design: an unknown or misspelled
// name (a typo in config) renders nothing rather than a broken icon or a build error,
// matching the engine's "nothing invented, degrade quietly" posture elsewhere.
// Object.hasOwn (not `ICONS[name] ?? null`): a bare property read walks the prototype
// chain, so an iconName of "toString" / "constructor" / "hasOwnProperty" / "__proto__"
// would return an inherited Function (a truthy non-array) and crash the build at
// components/Icon.tsx's paths.map(). The own-key check keeps the never-throw contract.
/** @param {unknown} name @returns {string[]|null} */
export function iconPaths(name) {
  if (typeof name !== "string") return null;
  return Object.hasOwn(ICONS, name) ? ICONS[name] : null;
}
