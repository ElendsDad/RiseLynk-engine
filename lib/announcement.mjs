// ============================================================
// site-engine - sitewide announcement bar helpers (engine feedback item #26)
//
// Pure, dependency-free logic shared by the Announcement component
// (components/Announcement.tsx), the build-time claims-lint preflight
// (next.config.ts), and the Node harness (tools/announcement.test.mjs). Same
// shared-core pattern as lib/trust.mjs and lib/delivery-guard.mjs: one .mjs the
// app imports through TypeScript AND the test imports directly, so the logic is
// unit-tested without a TypeScript toolchain.
//
// WHAT IT IS: a config-driven, time-bounded, dismissible notice surface rendered
// sitewide (a promotion window, a holiday-hours note, a temporary service
// advisory). Brand-neutral by design: no copy, brand, or trade wording is baked
// in here; every string comes from per-site config.
//
// CLAIMS WALL: the announcement text and link label flow through the engine's
// EXISTING banned-phrase lint (tools/hydrate.mjs lintString) at build time via
// next.config.ts - a claims-violating announcement FAILs the build, exactly like
// every other config copy surface. This module supplies the strings to lint
// (announcementLintTargets); it does not re-implement the rules.
//
// TIME BOUND: start/end are REQUIRED. The window is evaluated against the
// viewer's current time on the client (announcementActive), so a static build
// made inside the window auto-hides the bar once the window closes, with no
// rebuild. A malformed or inverted window fails closed (the bar never shows).
//
// Plain ESM (no TypeScript annotations); JSDoc gives the TS callers a signature.
// ============================================================

/**
 * @typedef {{
 *   enabled?: boolean,
 *   text?: string,
 *   startDate?: string,
 *   endDate?: string,
 *   href?: string,
 *   linkLabel?: string,
 *   dismissible?: boolean,
 *   dismissLabel?: string,
 *   id?: string,
 * }} AnnouncementConfig
 */

// Parse an ISO date (YYYY-MM-DD or a full ISO timestamp) to epoch ms, or null if
// it is not a well-formed date. A bare YYYY-MM-DD is treated as the START of that
// UTC day; this keeps the window math deterministic and timezone-stable rather
// than depending on the builder's or viewer's local offset.
/** @param {unknown} raw @param {boolean} [endOfDay] @returns {number | null} */
export function parseBound(raw, endOfDay = false) {
  if (typeof raw !== "string" || raw.trim() === "") return null;
  const s = raw.trim();
  // Bare calendar date: pin to the very start (00:00:00.000Z) or, for an end
  // bound, the very end (23:59:59.999Z) of that UTC day, so an endDate of
  // "2026-12-31" includes all of Dec 31 rather than expiring at its midnight.
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (dateOnly) {
    const t = Date.parse(`${s}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`);
    return Number.isNaN(t) ? null : t;
  }
  const t = Date.parse(s);
  return Number.isNaN(t) ? null : t;
}

// Is the [startDate, endDate] window well-formed (both parse, start <= end)?
/** @param {AnnouncementConfig | null | undefined} cfg @returns {boolean} */
export function hasValidWindow(cfg) {
  if (!cfg) return false;
  const start = parseBound(cfg.startDate, false);
  const end = parseBound(cfg.endDate, true);
  if (start === null || end === null) return false;
  return start <= end;
}

// Does the config declare a renderable announcement AT ALL (independent of the
// current time)? enabled !== false, a non-empty text, and a valid window. Used to
// gate whether the component/preflight look at it; a config that omits
// `announcement`, sets enabled:false, or gives a blank text or bad window is a
// no-op (fail closed).
/** @param {AnnouncementConfig | null | undefined} cfg @returns {boolean} */
export function announcementConfigured(cfg) {
  if (!cfg) return false;
  if (cfg.enabled === false) return false;
  if (typeof cfg.text !== "string" || cfg.text.trim() === "") return false;
  return hasValidWindow(cfg);
}

// Is the announcement live at time `now` (epoch ms)? Configured AND now within
// [start, end] inclusive. This is the viewer-time check the client component runs
// on mount so an expired window hides without a rebuild.
/** @param {AnnouncementConfig | null | undefined} cfg @param {number} now @returns {boolean} */
export function announcementActive(cfg, now) {
  if (!announcementConfigured(cfg)) return false;
  const start = parseBound(cfg.startDate, false);
  const end = parseBound(cfg.endDate, true);
  return typeof now === "number" && now >= start && now <= end;
}

// Normalize a configured announcement to the exact shape the component renders,
// with defaults applied, or null when it is not configured. A link is emitted
// only when BOTH href and a resolvable label are present. `storageKey` is stable
// per announcement so a dismissal of one promotion does not suppress the next:
// it keys off the site-supplied `id` when given, else a short hash of the text.
/** @param {AnnouncementConfig | null | undefined} cfg @returns {{
 *   text: string, href: string | null, linkLabel: string,
 *   dismissible: boolean, dismissLabel: string, storageKey: string
 * } | null} */
export function resolveAnnouncement(cfg) {
  if (!announcementConfigured(cfg)) return null;
  const text = cfg.text.trim();
  const hasHref = typeof cfg.href === "string" && cfg.href.trim() !== "";
  const linkLabel =
    typeof cfg.linkLabel === "string" && cfg.linkLabel.trim() !== "" ? cfg.linkLabel.trim() : "Learn more";
  const dismissible = cfg.dismissible !== false; // default ON
  const dismissLabel =
    typeof cfg.dismissLabel === "string" && cfg.dismissLabel.trim() !== ""
      ? cfg.dismissLabel.trim()
      : "Dismiss announcement";
  const id =
    typeof cfg.id === "string" && cfg.id.trim() !== "" ? cfg.id.trim() : `t${hashText(text)}`;
  return {
    text,
    href: hasHref ? cfg.href.trim() : null,
    linkLabel,
    dismissible,
    dismissLabel,
    storageKey: `announcement-ack:${id}`,
  };
}

// A tiny, stable, dependency-free string hash (djb2), hex-encoded. Only used to
// derive a per-announcement dismissal key when the site gives no explicit id; it
// is not security-sensitive.
/** @param {string} s @returns {string} */
function hashText(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(16);
}

// The config strings the build-time claims-lint wall must check for this
// announcement: the text and, when present, the link label. Returns [] for an
// unconfigured announcement so the preflight has nothing to lint (a no-op).
/** @param {AnnouncementConfig | null | undefined} cfg @returns {{ path: string, value: string }[]} */
export function announcementLintTargets(cfg) {
  const resolved = resolveAnnouncement(cfg);
  if (!resolved) return [];
  const out = [{ path: "announcement.text", value: resolved.text }];
  if (resolved.href) out.push({ path: "announcement.linkLabel", value: resolved.linkLabel });
  return out;
}
