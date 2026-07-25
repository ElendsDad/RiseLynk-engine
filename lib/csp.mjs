// ============================================================
// site-engine - config-extendable CSP connect-src (engine feedback item #31a)
//
// Incident (maxlynk-services, ryan-dehart / ARK Fabrication, 2026-07-20): the
// v0.18.1 hardening CSP hardcoded connect-src to 'self' plus the Cloudflare
// Turnstile host. A site-local public/ artifact (a discovery questionnaire)
// posting to an external control-plane endpoint was silently killed by the
// browser from the v0.20.0 fleet bump on - the request never reached the
// network. This module is the fix: a site declares its own extra connect-src
// origins in config (`security.connectSrc: string[]`, lib/config-schema.ts),
// validated here and appended to the base directive by next.config.ts.
//
// CLAIMS WALL / fail-safe by construction: an entry that is not a bare https
// origin (scheme + host + optional port, nothing else - no path, no query, no
// wildcard, no CSP keyword) is REJECTED, not silently coerced. Rejection never
// aborts the build (a config typo must not become a NEW way to break `next
// build`, the exact class of incident this whole feedback item exists to
// fix) - it is dropped and reported back to the caller so next.config.ts can
// log it loudly. Absent/empty `extra` reproduces the base directive
// byte-for-byte (the additive-versioning contract: a config valid at an older
// tag stays valid, and unchanged, at this one).
//
// Plain ESM (no TypeScript annotations); JSDoc gives the TS caller a real
// signature. Zero dependencies, so this is unit-tested in plain Node
// (tools/csp.test.mjs) without a build.
// ============================================================

/** @typedef {{ value: string, reason: string }} RejectedOrigin */

// A validated entry is EXACTLY an https origin: scheme + host + optional port,
// nothing else. Building this from `new URL()` and comparing back against
// `.origin` is what catches a trailing path/query/hash (any of those makes
// `url.origin` a strict prefix of the input, so the equality fails) without
// hand-rolling URL parsing. The explicit "*" guard runs first so a wildcard
// origin (e.g. "https://*.example.com", a syntactically valid CSP source
// expression the engine does NOT want to allow here - "no wildcards beyond
// host" per the feedback) fails with its own reason rather than a generic
// parse error, and so a "*" is caught even inside a scheme/host `new URL`
// would otherwise choke on for an unrelated reason.
/**
 * @param {unknown} value
 * @returns {{ ok: true } | { ok: false, reason: string }}
 */
export function validateConnectSrcOrigin(value) {
  if (typeof value !== "string") return { ok: false, reason: "not_a_string" };
  const v = value.trim();
  if (!v) return { ok: false, reason: "empty" };
  if (v.includes("*")) return { ok: false, reason: "wildcard_not_allowed" };
  if (/\s/.test(v)) return { ok: false, reason: "whitespace_in_origin" };
  let url;
  try {
    url = new URL(v);
  } catch {
    return { ok: false, reason: "not_a_url" };
  }
  if (url.protocol !== "https:") return { ok: false, reason: "https_only" };
  // url.origin is the normalized "scheme://host[:port]" with no path, query,
  // hash, credentials, or trailing slash. Anything the input carried beyond
  // that (a path, "/", "?x=1", "#frag") makes the two strings diverge.
  if (url.origin !== v) return { ok: false, reason: "origin_only_no_path" };
  return { ok: true };
}

// Validate a whole extra-origins list, splitting it into the entries to append
// (in the order given, deduped against the base list and against themselves)
// and the entries rejected (with a reason each, for a loud build-log line).
// A non-array input (including undefined/null, the absent-field case) is
// treated as an empty list - the additive default.
/**
 * @param {readonly string[]} base
 * @param {unknown} extra
 * @returns {{ accepted: string[], rejected: RejectedOrigin[] }}
 */
export function partitionConnectSrcEntries(base, extra) {
  const baseSet = new Set(base);
  const seen = new Set(base);
  /** @type {string[]} */
  const accepted = [];
  /** @type {RejectedOrigin[]} */
  const rejected = [];
  const list = Array.isArray(extra) ? extra : [];
  for (const raw of list) {
    const v = typeof raw === "string" ? raw.trim() : raw;
    const result = validateConnectSrcOrigin(v);
    if (!result.ok) {
      rejected.push({ value: typeof raw === "string" ? raw : String(raw), reason: result.reason });
      continue;
    }
    if (seen.has(v)) continue; // dedupe against base + earlier entries, including the base Turnstile host
    seen.add(v);
    accepted.push(v);
  }
  return { accepted, rejected };
}

// Build the final connect-src directive VALUE (the space-joined source list,
// no "connect-src " prefix - the caller composes the full CSP line the same
// way it already does for every other directive). Absent/empty extra
// reproduces `base.join(" ")` byte-for-byte, which is the additive-contract
// proof: a config that never sets `security.connectSrc` gets today's exact
// CSP with zero bytes changed.
/**
 * @param {readonly string[]} base
 * @param {unknown} extra
 * @returns {{ value: string, accepted: string[], rejected: RejectedOrigin[] }}
 */
export function buildConnectSrcDirective(base, extra) {
  const { accepted, rejected } = partitionConnectSrcEntries(base, extra);
  const value = [...base, ...accepted].join(" ");
  return { value, accepted, rejected };
}
