// =============================================================================
// BRAND-LOGO surface resolution. Pure, dependency-free logic shared by
// components/Header.tsx and components/Footer.tsx (a TS file can import a plain
// .mjs directly, same pattern as lib/social-icons.mjs / lib/theme-tokens.mjs), so it is
// unit-testable in plain Node (tools/brand-logo.test.mjs) without a TypeScript toolchain.
//
// Three feedback items, all additive and default OFF:
//   1) header logo-replaces-name (brand.logoReplacesName): when a business's logo IS a
//      wordmark, showing the logo image BESIDE a text business-name duplicates the mark.
//      Opting in swaps the visible text for the image; the image stops being decorative
//      (it now carries the name), so its alt text becomes the business name.
//   2) footer logo slot (footer.logoUrl): the footer has no logo slot today. Opt-in only:
//      an absent footer.logoUrl renders nothing new. Coherence rule (deliberate design
//      call): the header's logoReplacesName flag ALSO governs the footer name text, but
//      only once the footer actually has its own logo asset to show in its place - a site
//      cannot "replace" a footer name with an image that was never supplied. So the footer
//      keeps its name text whenever it has no logoUrl, no matter how the header is set.
//   3) per-theme logo variant (brand.logoUrlDark / footer.logoUrlDark): an <img> (SVG or
//      raster) always follows whatever the file itself draws, never the site's [data-theme]
//      toggle. When a dark-theme asset is supplied AND the site's dual-theme block is
//      enabled, BOTH images are server-rendered and pure CSS (app/globals.css, keyed off
//      [data-theme] on <html>) shows exactly one - no added JS, no flash, works with the
//      pre-paint boot script. A theme-less site (or one with no dark asset) always resolves
//      to the single light image, i.e. the flag is inert.
//
// JSON-LD (lib/seo.ts organizationLd) intentionally keeps reading brand.logoUrl only - the
// canonical light asset - never logoUrlDark; structured data has no theme concept.
// =============================================================================

/**
 * @typedef {{
 *   showImg: boolean,
 *   imgAlt: string,
 *   replacesName: boolean,
 *   showDarkVariant: boolean,
 *   logoUrl: string | undefined,
 *   logoUrlDark: string | undefined,
 * }} LogoResolution
 */

// Shared resolver: both the header brand-mark and the footer logo slot follow the same
// three rules over whichever (logoUrl, logoUrlDark) pair applies to that surface, so the
// per-surface wrappers below are thin call sites, not duplicated logic.
/**
 * @param {string | undefined} logoUrl
 * @param {string | undefined} logoUrlDark
 * @param {boolean} logoReplacesName
 * @param {string} businessName
 * @param {boolean} themeOn
 * @returns {LogoResolution}
 */
function resolve(logoUrl, logoUrlDark, logoReplacesName, businessName, themeOn) {
  const showImg = Boolean(logoUrl);
  // Replacing the name is only meaningful when there is an image to replace it with; an
  // opted-in flag with no logo asset never blanks the name (fails safe to today's text).
  const replacesName = showImg && Boolean(logoReplacesName);
  // The dark counterpart only ever renders on a theme-enabled site; without a [data-theme]
  // toggle there is no signal to key the CSS off, so a theme-less site stays single-image.
  const showDarkVariant = showImg && Boolean(themeOn) && Boolean(logoUrlDark);
  return {
    showImg,
    // No longer decorative once it carries the name; empty alt (decorative) otherwise,
    // matching the pre-existing alt="" behavior for a logo shown beside the name.
    imgAlt: replacesName ? businessName : "",
    replacesName,
    showDarkVariant,
    logoUrl,
    logoUrlDark: showDarkVariant ? logoUrlDark : undefined,
  };
}

// Header brand-mark resolution (feedback items 1 + 3).
/**
 * @param {{logoUrl?: string, logoUrlDark?: string, logoReplacesName?: boolean} | undefined} brand
 * @param {string} businessName
 * @param {boolean} themeOn
 * @returns {LogoResolution}
 */
export function resolveHeaderLogo(brand, businessName, themeOn) {
  return resolve(
    brand?.logoUrl,
    brand?.logoUrlDark,
    Boolean(brand?.logoReplacesName),
    businessName,
    themeOn,
  );
}

// Footer logo-slot resolution (feedback items 2 + 3). Takes `brand` only to read the
// logoReplacesName coherence flag; the image itself is always the footer's OWN asset
// (footer.logoUrl / footer.logoUrlDark), never a silent fallback to the header's brand.logoUrl.
/**
 * @param {{logoReplacesName?: boolean} | undefined} brand
 * @param {{logoUrl?: string, logoUrlDark?: string} | undefined} footer
 * @param {string} businessName
 * @param {boolean} themeOn
 * @returns {LogoResolution}
 */
export function resolveFooterLogo(brand, footer, businessName, themeOn) {
  return resolve(
    footer?.logoUrl,
    footer?.logoUrlDark,
    Boolean(brand?.logoReplacesName),
    businessName,
    themeOn,
  );
}
