// ============================================================
// site-engine - trust-strip + click-to-call helpers (brand-neutral, config-driven)
//
// Pure, dependency-free helpers shared by the TrustBar section (components/sections/
// TrustBar.tsx), the persistent call bar (components/CallBar.tsx), and the Node harness
// (tools/trust.test.mjs). Same shared-core pattern as lib/rating-ld.mjs and
// lib/contact-intake.mjs: one .mjs the app imports through TypeScript AND the test imports
// directly, so the logic is unit-tested without a TypeScript toolchain.
//
// BRAND-NEUTRAL BY DESIGN: no trade, brand, or trade-specific copy is baked in here. Every
// trust fact and the call number come from per-site config; the engine supplies only the
// structure and a neutral default call-to-action. This is what lets any trade site (plumber,
// electrician, HVAC, contractor, repair shop) enable the trust strip and call bar.
//
// CLAIMS WALL: trustBarFacts emits ONLY the facts config supplies. No credential, coverage,
// year, brand, or item is invented; a field the site did not set never appears.
//
// Plain ESM (no TypeScript annotations); JSDoc gives the TS callers a signature.
// ============================================================

/** @typedef {{ label: string, value: string, href?: string }} TrustItem */
/**
 * @typedef {{
 *   licenseNumber?: string, licenseLabel?: string,
 *   registryUrl?: string, registryLabel?: string,
 *   bonded?: boolean, insured?: boolean,
 *   yearsInBusiness?: number, since?: number,
 *   brands?: string[], items?: TrustItem[]
 * }} TrustFacts
 */

/**
 * Build the ordered list of trust facts to render, from whatever config supplies.
 * Claims-walled: a fact appears only when its config field is set. The typed fields are
 * convenience shortcuts for the most common facts; `items` is the open-ended, fully
 * config-driven surface for any other trust fact (family owned, free estimates, a
 * workmanship warranty, a BBB rating, manufacturer certifications, and so on). Returns []
 * when the site provides nothing, so the section renders nothing.
 * @param {TrustFacts | undefined | null} trust
 * @returns {TrustItem[]}
 */
export function trustBarFacts(trust) {
  if (!trust) return [];
  /** @type {TrustItem[]} */
  const facts = [];

  if (trust.licenseNumber) {
    facts.push({ label: trust.licenseLabel ?? "License", value: trust.licenseNumber });
  }

  const status = [trust.bonded ? "Bonded" : null, trust.insured ? "Insured" : null]
    .filter(Boolean)
    .join(" and ");
  if (status) facts.push({ label: "Coverage", value: status });

  const years =
    typeof trust.yearsInBusiness === "number"
      ? `${trust.yearsInBusiness} years in business`
      : typeof trust.since === "number"
        ? `Serving since ${trust.since}`
        : null;
  if (years) facts.push({ label: "Experience", value: years });

  if (Array.isArray(trust.brands) && trust.brands.length) {
    facts.push({ label: "Brands served", value: trust.brands.join(", ") });
  }

  // Fully config-driven custom items: every one is site-provided. An item renders only when
  // it carries both a label and a value; an optional href turns the value into a proof link.
  if (Array.isArray(trust.items)) {
    for (const it of trust.items) {
      if (it && it.label && it.value) {
        facts.push(it.href ? { label: it.label, value: it.value, href: it.href } : { label: it.label, value: it.value });
      }
    }
  }

  return facts;
}

/**
 * Whether the trust bar has anything to render: at least one fact, or a verify link.
 * @param {TrustFacts | undefined | null} trust
 * @returns {boolean}
 */
export function trustBarHasContent(trust) {
  return trustBarFacts(trust).length > 0 || Boolean(trust && trust.registryUrl);
}

/**
 * tel: href from a display phone number, keeping only dialable characters (digits and a
 * leading +). The number itself is never altered, only stripped of formatting.
 * @param {string} phone
 * @returns {string}
 */
export function telHref(phone) {
  return `tel:${String(phone).replace(/[^0-9+]/g, "")}`;
}

/**
 * Brand-neutral default call-to-action for the call bar. A site-supplied `label` always
 * wins; otherwise a neutral prompt is used. `dispatchRouted` only nuances the hours wording
 * (a number answered any hour vs a plain daytime line); it never changes the number and it
 * implies no trade. Any trade-specific line (for example an entrapment-first elevator line)
 * lives in that site's config, not here.
 * @param {{ label?: string, dispatchRouted?: boolean } | undefined | null} cfg
 * @returns {string}
 */
export function callBarLabel(cfg) {
  if (cfg && typeof cfg.label === "string" && cfg.label.length) return cfg.label;
  return cfg && cfg.dispatchRouted === true
    ? "Prefer to talk? Call us now, any hour."
    : "Prefer to talk? Call us now.";
}

/**
 * Brand-neutral accessible name for the call bar's region/landmark (the screen-reader label
 * for the fixed bar). A site-supplied `regionLabel` always wins (for example an emergency
 * service line); otherwise a neutral default is used. No trade is implied by the default.
 * @param {{ regionLabel?: string } | undefined | null} cfg
 * @returns {string}
 */
export function callBarRegionLabel(cfg) {
  if (cfg && typeof cfg.regionLabel === "string" && cfg.regionLabel.length) return cfg.regionLabel;
  return "Call us";
}
