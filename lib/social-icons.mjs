// =============================================================================
// BUILT-IN SOCIAL icon set + platform detection. A small, curated, brand-neutral,
// dependency-free set of inline SVG icons a `business.socials[]` entry resolves to,
// mirroring the lib-holds-data / component-draws-it split lib/icons.mjs +
// components/Icon.tsx already use (components/SocialIcon.tsx draws these).
//
// Every icon is hand-drawn path data on a 24x24 viewBox, stroked in `currentColor` at the
// same weight as the built-in icon set, so it inherits whatever CSS color context frames
// it. Not traced from, or a subset of, any third-party icon font, icon library, or brand
// logo artwork: simplified, original line-icon representations of each platform's general
// shape (a rounded-square "in" badge, a camera outline, a circle "f" mark, and so on), not
// a reproduction of any company's trademarked logo file. No dependency, no license to track.
//
// Detection (socialPlatform) is label-first, then href-hostname, so both a hand-authored
// placeholder like `{ label: "Facebook", href: "#" }` and a real
// `{ label: "LinkedIn", href: "https://www.linkedin.com/company/..." }` resolve sensibly.
// A malformed or relative href never throws (fail-safe, matches lib/icons.mjs's posture);
// anything unrecognized falls back to a plain "link" glyph rather than guessing wrong.
// =============================================================================

export const SOCIAL_ICONS = {
  linkedin: [
    "M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z",
    "M7.5 7.6v.01",
    "M7.5 10.4v6.6",
    "M11 17v-4a2.3 2.3 0 0 1 4.6 0v4",
  ],
  instagram: [
    "M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z",
    "M12 15.3a3.3 3.3 0 1 0 0-6.6 3.3 3.3 0 0 0 0 6.6Z",
    "M16.3 7.7v.01",
  ],
  facebook: [
    "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z",
    "M14 8.3h-1.3a2.2 2.2 0 0 0-2.2 2.2V17",
    "M9.3 13h4.4",
  ],
  x: [
    "M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z",
    "M8.5 8.5l7 7",
    "M15.5 8.5l-7 7",
  ],
  youtube: [
    "M4 8.5A2.5 2.5 0 0 1 6.5 6h11A2.5 2.5 0 0 1 20 8.5v7a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 15.5v-7Z",
    "M10.5 9.5l5 2.5-5 2.5v-5Z",
  ],
  link: [
    "M9.5 14.5l5-5",
    "M8 13a3 3 0 0 1 0-4.2l2-2a3 3 0 0 1 4.2 4.2l-1 1",
    "M16 11a3 3 0 0 1 0 4.2l-2 2a3 3 0 0 1-4.2-4.2l1-1",
  ],
};

export const SOCIAL_ICON_NAMES = Object.keys(SOCIAL_ICONS);

const LABEL_MAP = {
  linkedin: "linkedin",
  instagram: "instagram",
  facebook: "facebook",
  x: "x",
  twitter: "x",
  youtube: "youtube",
};

const HOST_MAP = [
  [/(^|\.)linkedin\.com$/, "linkedin"],
  [/(^|\.)instagram\.com$/, "instagram"],
  [/(^|\.)facebook\.com$/, "facebook"],
  [/(^|\.)fb\.com$/, "facebook"],
  [/(^|\.)x\.com$/, "x"],
  [/(^|\.)twitter\.com$/, "x"],
  [/(^|\.)youtube\.com$/, "youtube"],
  [/(^|\.)youtu\.be$/, "youtube"],
];

// A known platform key for a { label, href } social entry, or "link" (the generic fallback)
// when neither the label nor the href hostname resolves to a recognized platform. Never
// throws: an unparseable href (a relative path, a bare "#" placeholder, mailto:, etc.) is
// caught and simply falls through to the label check / the generic fallback.
/** @param {{label?: unknown, href?: unknown}} social @returns {string} */
export function socialPlatform(social) {
  const label = String(social?.label ?? "").trim().toLowerCase();
  if (Object.hasOwn(LABEL_MAP, label)) return LABEL_MAP[label];
  const href = String(social?.href ?? "");
  try {
    const host = new URL(href).hostname.replace(/^www\./, "").toLowerCase();
    for (const [re, key] of HOST_MAP) {
      if (re.test(host)) return key;
    }
  } catch {
    // Malformed or relative href (a "#" placeholder, a bare path): fall through to "link".
  }
  return "link";
}

// Path data for a known platform key, fail-safe to the generic "link" glyph for anything
// else (never null, never a broken icon: components/SocialIcon.tsx always has paths to draw).
/** @param {unknown} platform @returns {string[]} */
export function socialIconPaths(platform) {
  if (typeof platform === "string" && Object.hasOwn(SOCIAL_ICONS, platform)) {
    return SOCIAL_ICONS[platform];
  }
  return SOCIAL_ICONS.link;
}
