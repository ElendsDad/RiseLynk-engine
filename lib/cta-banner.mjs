// =============================================================================
// Closing CTA band (CTABanner) multi-button resolution.
//
// Pure helper so the additive `Section.cta[]` seam is testable without rendering
// React. Contract:
//   - Absent / empty `cta[]` -> mode "legacy". The component MUST keep the
//     pre-existing ctaLabel/ctaHref (+ optional reviewAsk) markup byte-identical.
//   - Non-empty `cta[]` -> mode "multi" with up to 6 normalized items. Each
//     item defaults variant to "primary" and href to /contact (same fallback as
//     the legacy single button's href default; the legacy single button's class
//     stays btn--accent and is untouched on the legacy path).
// =============================================================================

/** @typedef {{ label: string, href?: string, variant?: "primary" | "accent" | "ghost" }} CtaItem */
/** @typedef {{ mode: "legacy" } | { mode: "multi", items: Array<{ label: string, href: string, variant: "primary" | "accent" | "ghost" }> }} CtaBannerMode */

const MAX_CTAS = 6;

/**
 * @param {{ cta?: CtaItem[] | null | undefined } | null | undefined} section
 * @returns {CtaBannerMode}
 */
export function resolveCtaBannerMode(section) {
  const list = section && Array.isArray(section.cta) ? section.cta : null;
  if (!list || list.length === 0) {
    return { mode: "legacy" };
  }
  const items = [];
  for (const raw of list.slice(0, MAX_CTAS)) {
    if (!raw || typeof raw !== "object") continue;
    const label = typeof raw.label === "string" ? raw.label.trim() : "";
    if (!label) continue;
    const variant =
      raw.variant === "accent" || raw.variant === "ghost" || raw.variant === "primary"
        ? raw.variant
        : "primary";
    const href =
      typeof raw.href === "string" && raw.href.trim() ? raw.href.trim() : "/contact";
    items.push({ label, href, variant });
  }
  // A cta[] full of empty/malformed entries fails closed to the legacy path so a
  // broken opt-in never blanks a still-valid ctaLabel.
  if (!items.length) return { mode: "legacy" };
  return { mode: "multi", items };
}

export const CTA_BANNER_MAX = MAX_CTAS;
