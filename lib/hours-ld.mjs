// ============================================================
// site-engine - structured opening-hours seam (feedback item #27)
//
// Pure, dependency-free builders for the openingHoursSpecification value on the
// LocalBusiness node, the emergency-line ContactPoint, and the human-readable
// hours line shared by lib/llms.ts and the Contact section. Same shared-.mjs
// pattern as lib/area-ld.mjs: one module feeds every surface (JSON-LD, llms.txt,
// the visible Contact line), so they cannot drift, and the logic is unit-tested
// in plain Node (tools/hours-ld.test.mjs) without a TypeScript toolchain.
//
// CLAIMS WALL: hours are config-supplied facts, rendered verbatim after
// canonicalization. The engine never invents a schedule: with no
// business.openingHours every builder returns null and nothing is emitted, and
// the emergency ContactPoint exists only when the config attests the flag AND
// supplies a phone number.
//
// FAIL-CLOSED: one malformed item (unknown day, bad time, a missing or
// conflicting field) withholds the ENTIRE schedule from every surface, never a
// partial week. A half-published schedule is a wrong claim ("closed Sunday"
// implied by omission), so a config typo produces nothing rather than
// something authoritative-looking and wrong. The legacy free-form
// business.hours string is the fallback surface in that case.
//
// Plain ESM (no TypeScript annotations); JSDoc gives the TS callers a signature.
// ============================================================

/** @typedef {{ days: string[], opens?: string, closes?: string, allDay?: boolean }} OpeningHoursItem */

// Canonical week order. Keys are the config's lowercase day names; label is the
// schema.org enumeration member (https://schema.org/Monday et al., emitted as
// the bare label per common practice); short is the display abbreviation.
const WEEK = [
  { key: "monday", label: "Monday", short: "Mon" },
  { key: "tuesday", label: "Tuesday", short: "Tue" },
  { key: "wednesday", label: "Wednesday", short: "Wed" },
  { key: "thursday", label: "Thursday", short: "Thu" },
  { key: "friday", label: "Friday", short: "Fri" },
  { key: "saturday", label: "Saturday", short: "Sat" },
  { key: "sunday", label: "Sunday", short: "Sun" },
];
const DAY_INDEX = new Map(WEEK.map((d, i) => [d.key, i]));

// "H:MM" or "HH:MM", 24-hour. Returns the zero-padded canonical form, or null.
function canonicalTime(value) {
  if (typeof value !== "string") return null;
  const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  if (!m) return null;
  return `${m[1].padStart(2, "0")}:${m[2]}`;
}

// Validate and canonicalize the config's openingHours array. Returns the
// canonical items (days deduped and sorted Monday-first; times zero-padded;
// allDay expanded to the schema.org 00:00-23:59 idiom) or null when the input
// is absent, empty, or contains ANY malformed item (see FAIL-CLOSED above).
// An item is exactly one of: { days, allDay: true } or { days, opens, closes }.
// opens === closes is rejected (a zero-length window is a typo, not a schedule);
// closes BEFORE opens is valid and means an overnight window (e.g. 22:00-02:00),
// per the schema.org convention.
/**
 * @param {OpeningHoursItem[] | undefined} items
 * @returns {{ days: string[], opens: string, closes: string, allDay: boolean }[] | null}
 */
export function normalizeOpeningHours(items) {
  if (!Array.isArray(items) || !items.length) return null;
  const out = [];
  for (const item of items) {
    if (!item || typeof item !== "object" || !Array.isArray(item.days) || !item.days.length) return null;
    const seen = new Set();
    for (const day of item.days) {
      if (typeof day !== "string") return null;
      const key = day.trim().toLowerCase();
      if (!DAY_INDEX.has(key)) return null;
      seen.add(key);
    }
    const days = [...seen].sort((a, b) => DAY_INDEX.get(a) - DAY_INDEX.get(b));
    if (item.allDay === true) {
      // allDay is a complete statement; a stray opens/closes alongside it is a
      // conflicting item, and a conflict is a config error, not a preference.
      if (item.opens !== undefined || item.closes !== undefined) return null;
      out.push({ days, opens: "00:00", closes: "23:59", allDay: true });
      continue;
    }
    if (item.allDay !== undefined) return null; // allDay: false is also a malformed statement
    const opens = canonicalTime(item.opens);
    const closes = canonicalTime(item.closes);
    if (!opens || !closes || opens === closes) return null;
    out.push({ days, opens, closes, allDay: false });
  }
  return out;
}

// The openingHoursSpecification value for the LocalBusiness node: one
// OpeningHoursSpecification per config item, dayOfWeek always an array (a
// deterministic shape; schema.org accepts both). Null when the schedule is
// absent or withheld, so the key is never emitted for an existing config.
/**
 * @param {OpeningHoursItem[] | undefined} items
 * @returns {Record<string, unknown>[] | null}
 */
export function openingHoursLd(items) {
  const normalized = normalizeOpeningHours(items);
  if (!normalized) return null;
  return normalized.map((item) => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek: item.days.map((d) => WEEK[DAY_INDEX.get(d)].label),
    opens: item.opens,
    closes: item.closes,
  }));
}

// The emergency-line ContactPoint (the feedback's emergency flag). Emitted only
// when the config BOTH attests the flag and supplies a phone number: the
// around-the-clock hoursAvailable is the business's own attested statement (the
// same statement callBar.dispatchRouted has always worded as "any hour"), never
// an engine inference, and a flag with no number produces nothing. The phone is
// the same verbatim business.phone the org node's `telephone` already carries.
/**
 * @param {string | undefined} phone
 * @param {boolean | undefined} emergency247
 * @returns {Record<string, unknown> | null}
 */
export function emergencyContactLd(phone, emergency247) {
  if (emergency247 !== true || !phone) return null;
  return {
    "@type": "ContactPoint",
    contactType: "emergency",
    telephone: phone,
    hoursAvailable: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: WEEK.map((d) => d.label),
      opens: "00:00",
      closes: "23:59",
    },
  };
}

// The human-readable hours line for llms.txt and the visible Contact detail,
// e.g. "Mon-Fri 08:00-17:00; Sat 09:00-13:00; Sun open 24 hours". A run of
// three or more consecutive days compresses to a range ("Mon-Fri"); shorter
// runs list individually ("Sat, Sun"). Null when the schedule is absent or
// withheld, so both callers fall back to the legacy business.hours string.
/**
 * @param {OpeningHoursItem[] | undefined} items
 * @returns {string | null}
 */
export function hoursLine(items) {
  const normalized = normalizeOpeningHours(items);
  if (!normalized) return null;
  const parts = normalized.map((item) => {
    const idx = item.days.map((d) => DAY_INDEX.get(d));
    const runs = [];
    for (const i of idx) {
      const run = runs[runs.length - 1];
      if (run && i === run[run.length - 1] + 1) run.push(i);
      else runs.push([i]);
    }
    const daysPart = runs
      .map((run) =>
        run.length >= 3
          ? `${WEEK[run[0]].short}-${WEEK[run[run.length - 1]].short}`
          : run.map((i) => WEEK[i].short).join(", "),
      )
      .join(", ");
    const timePart = item.allDay ? "open 24 hours" : `${item.opens}-${item.closes}`;
    return `${daysPart} ${timePart}`;
  });
  return parts.join("; ");
}
