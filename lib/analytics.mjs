// ============================================================
// site-engine - Cloudflare Web Analytics helpers (trust pack)
//
// Free, cookieless RUM beacon. Recommended analytics default: Plausible is
// paid and GA4 sets cookies; Cloudflare Web Analytics needs only a public
// site token and works with OR without the site sitting on Cloudflare DNS
// (manual JS embed posts to cloudflareinsights.com).
//
// CSP (manual embed, per Cloudflare docs):
//   script-src  https://static.cloudflareinsights.com
//   connect-src https://cloudflareinsights.com
// next.config.ts appends these only when analytics.cloudflareToken is set, so
// a site without the token keeps today's CSP byte-for-byte.
// ============================================================

/** @typedef {{ cloudflareToken?: string, plausibleDomain?: string, gaId?: string }} AnalyticsConfig */

/**
 * @param {AnalyticsConfig | null | undefined} analytics
 * @returns {{ src: string, dataCfBeacon: string } | null}
 */
export function resolveCloudflareBeacon(analytics) {
  const token = String(analytics?.cloudflareToken || "").trim();
  if (!token) return null;
  return {
    src: "https://static.cloudflareinsights.com/beacon.min.js",
    dataCfBeacon: JSON.stringify({ token }),
  };
}

/**
 * @param {AnalyticsConfig | null | undefined} analytics
 * @returns {string[]}
 */
export function analyticsScriptSrcExtras(analytics) {
  return resolveCloudflareBeacon(analytics) ? ["https://static.cloudflareinsights.com"] : [];
}

/**
 * @param {AnalyticsConfig | null | undefined} analytics
 * @returns {string[]}
 */
export function analyticsConnectSrcExtras(analytics) {
  // Manual embed (the engine's path) POSTs beacons to cloudflareinsights.com.
  // Automatic orange-cloud injection would use 'self' /cdn-cgi/rum instead; we
  // always allow the manual host when a token is present so Vercel-hosted sites
  // (not on Cloudflare DNS) work.
  return resolveCloudflareBeacon(analytics) ? ["https://cloudflareinsights.com"] : [];
}

// Cloudflare Web Analytics does not set cookies or localStorage for tracking.
// cookieNotice should stay OFF for a site that only enables this beacon (and
// no Stripe checkout / other cookie-setting path). Documented at the schema
// comment and in the founder runbook.
export function cloudflareAnalyticsSetsCookies() {
  return false;
}
