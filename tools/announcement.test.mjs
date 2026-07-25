// =============================================================================
// site-engine - sitewide announcement bar gate (feature-backlog #26)
//
//   node tools/announcement.test.mjs
//
// Unit-tests lib/announcement.mjs directly (pure, dependency-free): the window
// math (parseBound, hasValidWindow, announcementActive), the configured/fail-
// closed gate, resolveAnnouncement's defaults and per-announcement dismissal key,
// and announcementLintTargets. It ALSO proves the claims-wall integration by
// running the engine's canonical lintString (tools/hydrate.mjs) over the lint
// targets the way next.config.ts does at build time: a banned phrase in an
// announcement produces violations (the build would FAIL), clean copy does not.
//
// Zero dependencies: node:assert only. Exit code is non-zero on any failure.
// =============================================================================

import assert from "node:assert/strict";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const {
  parseBound,
  hasValidWindow,
  announcementConfigured,
  announcementActive,
  resolveAnnouncement,
  announcementLintTargets,
} = await import("file://" + resolve(here, "../lib/announcement.mjs"));
const { lintString } = await import("file://" + resolve(here, "./hydrate.mjs"));

let passed = 0;
const ok = (name, cond) => {
  if (cond) { passed++; console.log("  ok  " + name); }
  else { console.log("FAIL  " + name); process.exitCode = 1; }
};

// A well-formed, currently-open window fixture and a timestamp inside it.
const WINDOW = { text: "Fall service special this month", startDate: "2026-09-01", endDate: "2026-09-30" };
const MID = Date.parse("2026-09-15T12:00:00Z");
const BEFORE = Date.parse("2026-08-31T23:59:59Z");
const AFTER = Date.parse("2026-10-01T00:00:01Z");

console.log("\n# parseBound: ISO shapes and fail-closed");
ok("YYYY-MM-DD start pins to 00:00:00Z", parseBound("2026-09-01", false) === Date.parse("2026-09-01T00:00:00.000Z"));
ok("YYYY-MM-DD end pins to 23:59:59.999Z", parseBound("2026-09-30", true) === Date.parse("2026-09-30T23:59:59.999Z"));
ok("a full ISO timestamp parses", parseBound("2026-09-15T08:30:00Z", false) === Date.parse("2026-09-15T08:30:00Z"));
ok("a non-string is null", parseBound(20260901, false) === null);
ok("an empty string is null", parseBound("   ", false) === null);
ok("garbage is null", parseBound("not-a-date", false) === null);

console.log("\n# hasValidWindow");
ok("both bounds parse and start <= end -> valid", hasValidWindow(WINDOW) === true);
ok("inverted window (start > end) -> invalid", hasValidWindow({ startDate: "2026-09-30", endDate: "2026-09-01" }) === false);
ok("same-day window -> valid", hasValidWindow({ startDate: "2026-09-01", endDate: "2026-09-01" }) === true);
ok("missing endDate -> invalid", hasValidWindow({ startDate: "2026-09-01" }) === false);
ok("malformed date -> invalid", hasValidWindow({ startDate: "2026-13-99", endDate: "2026-09-30" }) === false);
ok("null cfg -> invalid", hasValidWindow(null) === false);

console.log("\n# announcementConfigured: fail-closed gate");
ok("a full block is configured", announcementConfigured(WINDOW) === true);
ok("absent (undefined) -> not configured", announcementConfigured(undefined) === false);
ok("enabled:false -> not configured", announcementConfigured({ ...WINDOW, enabled: false }) === false);
ok("enabled:true is honored", announcementConfigured({ ...WINDOW, enabled: true }) === true);
ok("blank text -> not configured", announcementConfigured({ ...WINDOW, text: "   " }) === false);
ok("missing text -> not configured", announcementConfigured({ startDate: "2026-09-01", endDate: "2026-09-30" }) === false);
ok("bad window -> not configured even with text", announcementConfigured({ text: "hi", startDate: "x", endDate: "y" }) === false);

console.log("\n# announcementActive: inclusive window against the viewer clock");
ok("inside the window -> active", announcementActive(WINDOW, MID) === true);
ok("before the window -> inactive", announcementActive(WINDOW, BEFORE) === false);
ok("after the window -> inactive (auto-hide at view time)", announcementActive(WINDOW, AFTER) === false);
ok("exactly at start (00:00:00Z) -> active", announcementActive(WINDOW, Date.parse("2026-09-01T00:00:00.000Z")) === true);
ok("exactly at end (23:59:59.999Z) -> active", announcementActive(WINDOW, Date.parse("2026-09-30T23:59:59.999Z")) === true);
ok("one ms past end -> inactive", announcementActive(WINDOW, Date.parse("2026-10-01T00:00:00.000Z")) === false);
ok("unconfigured -> never active", announcementActive(undefined, MID) === false);

console.log("\n# resolveAnnouncement: defaults, link gate, dismissal key");
{
  const r = resolveAnnouncement(WINDOW);
  ok("resolves to an object", r && typeof r === "object");
  ok("text is trimmed verbatim", r.text === "Fall service special this month");
  ok("no href -> href null", r.href === null);
  ok("linkLabel defaults to 'Learn more'", r.linkLabel === "Learn more");
  ok("dismissible defaults ON", r.dismissible === true);
  ok("dismissLabel default", r.dismissLabel === "Dismiss announcement");
  ok("storageKey is prefixed + hashed from text", /^announcement-ack:t[0-9a-f]+$/.test(r.storageKey));
}
{
  const r = resolveAnnouncement({ ...WINDOW, href: "/promo", linkLabel: "See the deal", id: "fall2026", dismissible: false });
  ok("href is carried when set", r.href === "/promo");
  ok("linkLabel override honored", r.linkLabel === "See the deal");
  ok("explicit id keys the dismissal", r.storageKey === "announcement-ack:fall2026");
  ok("dismissible:false honored", r.dismissible === false);
}
ok("unconfigured -> null (byte-identity precondition)", resolveAnnouncement(undefined) === null);
ok("enabled:false -> null", resolveAnnouncement({ ...WINDOW, enabled: false }) === null);
{
  // Different text -> different dismissal key, so replacing an announcement re-shows it.
  const a = resolveAnnouncement({ ...WINDOW, text: "Promo A" });
  const b = resolveAnnouncement({ ...WINDOW, text: "Promo B" });
  ok("distinct copy -> distinct dismissal key", a.storageKey !== b.storageKey);
}

console.log("\n# announcementLintTargets: what the build-time claims wall checks");
{
  const t = announcementLintTargets(WINDOW);
  ok("unlinked announcement -> just the text", t.length === 1 && t[0].path === "announcement.text");
}
{
  const t = announcementLintTargets({ ...WINDOW, href: "/promo", linkLabel: "See the deal" });
  ok("linked announcement -> text + linkLabel", t.length === 2);
  ok("linkLabel is a lint target when href set", t.some((x) => x.path === "announcement.linkLabel" && x.value === "See the deal"));
}
ok("unconfigured -> no targets (preflight no-op)", announcementLintTargets(undefined).length === 0);
{
  // The DEFAULT 'Learn more' label without an href is not a rendered link, so it is not linted.
  const t = announcementLintTargets({ ...WINDOW, linkLabel: "Learn more" });
  ok("no href -> label never reaches the wall", t.length === 1);
}

console.log("\n# claims-wall integration: lintString over the targets (as next.config.ts does)");
const lintAll = (cfg) => announcementLintTargets(cfg).flatMap((t) => lintString(t.value).map((v) => ({ path: t.path, ...v })));
ok("clean copy -> zero violations (build passes)", lintAll(WINDOW).length === 0);
ok("an em dash in the text -> a violation (build FAILs)", lintAll({ ...WINDOW, text: "Fall special — book now" }).some((v) => v.rule === "dash"));
ok("an exclamation mark -> a violation", lintAll({ ...WINDOW, text: "Book today" }).length === 0 && lintAll({ ...WINDOW, text: "Book today!" }).some((v) => v.rule === "exclamation"));
ok("a banned compliance claim -> a violation", lintAll({ ...WINDOW, text: "We are fully certified" }).some((v) => v.rule === "banned-claim:certified"));
ok("a guarantee -> a violation", lintAll({ ...WINDOW, text: "Results guaranteed" }).some((v) => v.rule === "banned-claim:guarantee"));
ok("hype -> a violation", lintAll({ ...WINDOW, text: "World-class service" }).some((v) => v.rule.startsWith("hype:")));
ok("a violation in the LINK LABEL is caught too", lintAll({ ...WINDOW, href: "/x", linkLabel: "Certified pros" }).some((v) => v.path === "announcement.linkLabel"));

console.log(`\n${passed} checks passed`);
if (process.exitCode) { console.log("SOME CHECKS FAILED"); }
