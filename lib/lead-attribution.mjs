// ============================================================
// site-engine - lead-source attribution (UTM + referrer + landing path)
//
// First-party, session-scoped capture on form submit only. No cookies, no
// third-party calls, no fingerprinting, no per-visitor profile. Hidden form
// fields are populated client-side from location.search / document.referrer /
// location.pathname; THIS module sanitizes them server-side before
// foldExtras() folds them into the save-first lead message.
//
// Privacy: referrer keeps origin + path at most (query strings routinely carry
// third-party search terms, session ids, or tokens). Treat every value as
// hostile: attacker-controllable by crafting a URL.
//
// Plain ESM, zero dependencies. Driven by tools/lead-attribution.test.mjs.
// ============================================================

/** Canonical attribution keys folded into the lead message via foldExtras. */
export const LEAD_ATTRIBUTION_KEYS = Object.freeze([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "referrer",
  "landing_path",
]);

const ATTR_SET = new Set(LEAD_ATTRIBUTION_KEYS);
const MAX_LEN = 200;
const CONTROL_RE = /[\u0000-\u001F\u007F]/g;

/**
 * Strip control characters and angle brackets from a string. Length-capped.
 * @param {string} s
 * @returns {string}
 */
function neutralizeScalar(s) {
  return s.replace(CONTROL_RE, "").replace(/[<>]/g, "").trim().slice(0, MAX_LEN);
}

/**
 * Plain scalar only: string / number / boolean. Arrays, objects, null → reject.
 * @param {unknown} value
 * @returns {string|null}
 */
function asPlainScalar(value) {
  if (value == null) return null;
  if (typeof value === "object") return null; // arrays and plain objects
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return null;
}

/**
 * Referrer: http(s) origin + pathname only. Query and hash are dropped.
 * @param {string} raw
 * @returns {string|null}
 */
function sanitizeReferrer(raw) {
  const cleaned = neutralizeScalar(raw);
  if (!cleaned) return null;
  let url;
  try {
    url = new URL(cleaned);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  const out = neutralizeScalar(url.origin + url.pathname);
  return out || null;
}

/**
 * Landing path: same-origin path only (leading "/", never "//", no query/hash).
 * @param {string} raw
 * @returns {string|null}
 */
function sanitizeLandingPath(raw) {
  let s = neutralizeScalar(raw);
  if (!s) return null;
  // Drop query/hash if a hostile client stuffed them into the field.
  const cut = s.search(/[?#]/);
  if (cut >= 0) s = s.slice(0, cut);
  if (!s.startsWith("/") || s.startsWith("//") || s.includes("\\")) return null;
  // Reject absolute URLs that somehow start with "/" after neutralize (should not).
  if (/^\/[a-z][a-z0-9+.-]*:/i.test(s)) return null;
  return s.slice(0, MAX_LEN) || null;
}

/**
 * Sanitize one attribution field. Returns a clean string, or null to omit.
 * @param {string} key
 * @param {unknown} value
 * @returns {string|null}
 */
export function sanitizeAttributionField(key, value) {
  const k = String(key || "").toLowerCase();
  if (!ATTR_SET.has(k)) return null;
  const raw = asPlainScalar(value);
  if (raw == null) return null;

  if (k === "referrer") return sanitizeReferrer(raw);
  if (k === "landing_path") return sanitizeLandingPath(raw);

  // utm_* : neutralized plain text
  const out = neutralizeScalar(raw);
  return out || null;
}

/**
 * Return a shallow copy of `body` with attribution keys sanitized (or removed).
 * Non-attribution keys are copied unchanged. Absent / empty / hostile values
 * stay absent so foldExtras never emits an empty-string line.
 * @param {Record<string, any>} [body]
 * @returns {Record<string, any>}
 */
export function applyLeadAttribution(body = {}) {
  const out = { ...body };
  // Drop any case-variant attribution keys first, then re-apply clean lowercase.
  for (const key of Object.keys(out)) {
    if (ATTR_SET.has(String(key).toLowerCase())) delete out[key];
  }
  for (const key of LEAD_ATTRIBUTION_KEYS) {
    // Prefer the canonical key; fall back to a case-insensitive match on the original body.
    let raw = body[key];
    if (raw === undefined) {
      const found = Object.keys(body).find((k) => String(k).toLowerCase() === key);
      if (found) raw = body[found];
    }
    if (raw === undefined) continue;
    const clean = sanitizeAttributionField(key, raw);
    if (clean != null) out[key] = clean;
  }
  return out;
}
