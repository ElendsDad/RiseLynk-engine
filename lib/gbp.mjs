// ============================================================
// site-engine - Google Business Profile (GBP) helpers
//
// Config-only surface for Local Pack alignment. Josh claims/creates the profile
// by hand and pastes placeId / profileUrl / reviewUrl; there is NO Google API
// integration (the GBP API is closed to aggregator-shaped apps).
//
// REVIEW POLICY (Google + FTC): the review CTA is a plain public URL for every
// visitor equally. This module never scores, filters, routes, or gates reviews
// by predicted sentiment. Ask everyone; filter no one.
//
// NAP: optional name/phone/address under business.gbp are the NAP as listed on
// the GBP profile (paste from the listing). When set, build-time warns if the
// matching business.* field drifts. Absent NAP mirrors => no drift check.
//
// Plain ESM; unit-tested in tools/gbp.test.mjs.
// ============================================================

/** Default visible label for the review CTA. Scaffold-copy linted (no claims). */
export const REVIEW_CTA_LABEL = "Leave us a review";

/**
 * https-only absolute URL, fail-closed (null on anything else).
 * @param {unknown} raw
 * @returns {string|null}
 */
export function sanitizeGbpHttpsUrl(raw) {
  const s = typeof raw === "string" ? raw.trim() : "";
  if (!s) return null;
  try {
    const u = new URL(s);
    return u.protocol === "https:" ? s : null;
  } catch {
    return null;
  }
}

/**
 * @param {unknown} gbp
 * @returns {{ placeId: string|null, profileUrl: string|null, reviewUrl: string|null, name: string|null, phone: string|null, address: string|null }}
 */
export function resolveGbp(gbp) {
  const g = gbp && typeof gbp === "object" ? gbp : {};
  const placeId = typeof g.placeId === "string" && g.placeId.trim() ? g.placeId.trim() : null;
  return {
    placeId,
    profileUrl: sanitizeGbpHttpsUrl(g.profileUrl),
    reviewUrl: sanitizeGbpHttpsUrl(g.reviewUrl),
    name: typeof g.name === "string" && g.name.trim() ? g.name.trim() : null,
    phone: typeof g.phone === "string" && g.phone.trim() ? g.phone.trim() : null,
    address: typeof g.address === "string" && g.address.trim() ? g.address.trim() : null,
  };
}

/**
 * Review CTA for every customer equally: href + label, or null when unset/invalid.
 * No sentiment input; no branching on who is asking.
 * @param {unknown} gbp
 * @returns {{ href: string, label: string }|null}
 */
export function resolveReviewCta(gbp) {
  const { reviewUrl } = resolveGbp(gbp);
  if (!reviewUrl) return null;
  return { href: reviewUrl, label: REVIEW_CTA_LABEL };
}

/**
 * Profile URL for Organization sameAs (and readiness "has GBP" checks).
 * @param {unknown} gbp
 * @returns {string|null}
 */
export function resolveGbpProfileUrl(gbp) {
  return resolveGbp(gbp).profileUrl;
}

/** @param {string} s */
function normText(s) {
  return String(s).trim().replace(/\s+/g, " ").toLowerCase();
}

/** @param {string} s */
function normPhone(s) {
  return String(s).replace(/\D/g, "");
}

/**
 * Build-time NAP drift warnings. Only fields Josh declared under gbp.* are checked;
 * an unset mirror never invents a GBP value and never WARNs.
 * @param {{ name?: string, phone?: string, address?: string }} business
 * @param {unknown} gbp
 * @returns {{ field: string, message: string }[]}
 */
export function gbpNapIssues(business, gbp) {
  const g = resolveGbp(gbp);
  const b = business && typeof business === "object" ? business : {};
  /** @type {{ field: string, message: string }[]} */
  const issues = [];

  if (g.name) {
    const siteName = typeof b.name === "string" ? b.name : "";
    if (!siteName.trim()) {
      issues.push({
        field: "name",
        message: "business.gbp.name is set but business.name is empty",
      });
    } else if (normText(siteName) !== normText(g.name)) {
      issues.push({
        field: "name",
        message: `business.name ("${siteName.trim()}") drifts from business.gbp.name ("${g.name}")`,
      });
    }
  }

  if (g.phone) {
    const sitePhone = typeof b.phone === "string" ? b.phone : "";
    if (!sitePhone.trim()) {
      issues.push({
        field: "phone",
        message: "business.gbp.phone is set but business.phone is empty",
      });
    } else if (normPhone(sitePhone) !== normPhone(g.phone)) {
      issues.push({
        field: "phone",
        message: `business.phone ("${sitePhone.trim()}") drifts from business.gbp.phone ("${g.phone}")`,
      });
    }
  }

  if (g.address) {
    const siteAddress = typeof b.address === "string" ? b.address : "";
    if (!siteAddress.trim()) {
      issues.push({
        field: "address",
        message: "business.gbp.address is set but business.address is empty",
      });
    } else if (normText(siteAddress) !== normText(g.address)) {
      issues.push({
        field: "address",
        message: `business.address ("${siteAddress.trim()}") drifts from business.gbp.address ("${g.address}")`,
      });
    }
  }

  return issues;
}

/**
 * Whether the site has any usable GBP identity (profile or place id).
 * Used by readiness; never invents a placeholder URL.
 * @param {unknown} gbp
 * @returns {boolean}
 */
export function gbpConfigured(gbp) {
  const g = resolveGbp(gbp);
  return Boolean(g.profileUrl || g.placeId || g.reviewUrl);
}
