// ============================================================
// site-engine - structured opening-hours seam harness (feedback #27)
//
//   node tools/hours-ld.test.mjs
//
// Proves the pure builders in lib/hours-ld.mjs, which lib/seo.ts folds into the
// LocalBusiness node (openingHoursSpecification + the emergency ContactPoint),
// lib/llms.ts prints as the Contact "Hours" / emergency lines, and the Contact
// section renders visibly. Same shared-.mjs pattern as lib/area-ld.mjs so the
// logic is unit-tested in plain Node (no TypeScript toolchain). The full
// end-to-end @graph is additionally proven by the rendered-output build check.
//
// Covers:
//   - normalizeOpeningHours: canonicalization (day dedupe + Monday-first sort,
//     time zero-padding, allDay expansion) and the FAIL-CLOSED rule: one
//     malformed item (unknown day, bad time, missing/conflicting fields,
//     zero-length window) withholds the ENTIRE schedule, never a partial week.
//   - openingHoursLd: byte-exact node shapes (key order included), dayOfWeek
//     always an array, overnight windows pass through, null passthrough.
//   - emergencyContactLd: the claims wall (flag + phone or nothing) and the
//     byte-exact ContactPoint shape.
//   - hoursLine: run compression (3+ consecutive days -> "Mon-Fri", shorter
//     runs listed), the allDay wording, "; " joining, null passthrough.
//   - Absent-field byte-identity: a config without openingHours gets null from
//     every builder, so every existing config's @graph, llms.txt, and Contact
//     section are unchanged.
// ============================================================

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const MODULE_PATH = join(ROOT, "lib", "hours-ld.mjs");

const mod = await import("file://" + MODULE_PATH);
const { normalizeOpeningHours, openingHoursLd, emergencyContactLd, hoursLine } = mod;

let passed = 0, failed = 0;
const ok = (name, cond) => { if (cond) { passed++; console.log("  ok  " + name); } else { failed++; console.log("FAIL  " + name); } };
const eq = (name, a, b) => ok(name + " (" + JSON.stringify(a) + ")", a === b);

const WEEKDAYS = { days: ["monday", "tuesday", "wednesday", "thursday", "friday"], opens: "08:00", closes: "17:00" };

// ================= 1. normalizeOpeningHours: canonicalization =================
function testNormalization() {
  console.log("\n# normalizeOpeningHours: canonical days, padded times, allDay expansion");
  const n = normalizeOpeningHours([
    { days: ["friday", " Monday ", "monday", "wednesday"], opens: "8:00", closes: "17:30" },
  ]);
  ok("valid input normalizes", Array.isArray(n) && n.length === 1);
  eq("days dedupe and sort Monday-first", JSON.stringify(n[0].days), '["monday","wednesday","friday"]');
  eq("times zero-pad to HH:MM", `${n[0].opens}-${n[0].closes}`, "08:00-17:30");
  const all = normalizeOpeningHours([{ days: ["saturday", "sunday"], allDay: true }]);
  eq("allDay expands to the schema.org 00:00-23:59 idiom", `${all[0].opens}-${all[0].closes}`, "00:00-23:59");
  ok("allDay flag rides along for the display wording", all[0].allDay === true);
  const overnight = normalizeOpeningHours([{ days: ["friday"], opens: "22:00", closes: "02:00" }]);
  ok("an overnight window (closes before opens) is valid", overnight !== null && overnight[0].closes === "02:00");
  const split = normalizeOpeningHours([
    { days: ["monday"], opens: "08:00", closes: "12:00" },
    { days: ["monday"], opens: "13:00", closes: "17:00" },
  ]);
  ok("a split schedule (same day in two entries) is valid", split !== null && split.length === 2);
}

// ================= 2. normalizeOpeningHours: fail-closed =================
function testFailClosed() {
  console.log("\n# normalizeOpeningHours: one malformed item withholds the WHOLE schedule");
  const bad = (name, items) => ok(name, normalizeOpeningHours(items) === null);
  bad("absent -> null", undefined);
  bad("empty array -> null", []);
  bad("unknown day name", [{ days: ["monday", "funday"], opens: "08:00", closes: "17:00" }]);
  bad("empty days list", [{ days: [], opens: "08:00", closes: "17:00" }]);
  bad("non-string day", [{ days: [1], opens: "08:00", closes: "17:00" }]);
  bad("bad time format (24:00)", [{ days: ["monday"], opens: "24:00", closes: "17:00" }]);
  bad("bad time format (8am)", [{ days: ["monday"], opens: "8am", closes: "17:00" }]);
  bad("bad minutes (08:60)", [{ days: ["monday"], opens: "08:60", closes: "17:00" }]);
  bad("missing closes", [{ days: ["monday"], opens: "08:00" }]);
  bad("missing opens", [{ days: ["monday"], closes: "17:00" }]);
  bad("zero-length window (opens === closes)", [{ days: ["monday"], opens: "08:00", closes: "8:00" }]);
  bad("allDay alongside opens/closes is a conflict", [{ days: ["monday"], allDay: true, opens: "08:00", closes: "17:00" }]);
  bad("allDay: false is a malformed statement", [{ days: ["monday"], allDay: false }]);
  bad("non-object item", ["monday"]);
  // The fail-closed rule proper: a VALID item cannot rescue a malformed sibling.
  bad("one bad item withholds the valid one too", [WEEKDAYS, { days: ["someday"], opens: "08:00", closes: "17:00" }]);
}

// ================= 3. openingHoursLd: byte-exact node shapes =================
function testOpeningHoursLd() {
  console.log("\n# openingHoursLd: byte-exact OpeningHoursSpecification nodes");
  eq(
    "weekday window, key order included",
    JSON.stringify(openingHoursLd([WEEKDAYS])),
    '[{"@type":"OpeningHoursSpecification","dayOfWeek":["Monday","Tuesday","Wednesday","Thursday","Friday"],"opens":"08:00","closes":"17:00"}]',
  );
  eq(
    "a single day is still an array (deterministic shape)",
    JSON.stringify(openingHoursLd([{ days: ["saturday"], opens: "9:00", closes: "13:00" }])),
    '[{"@type":"OpeningHoursSpecification","dayOfWeek":["Saturday"],"opens":"09:00","closes":"13:00"}]',
  );
  eq(
    "allDay emits the 00:00-23:59 idiom",
    JSON.stringify(openingHoursLd([{ days: ["sunday"], allDay: true }])),
    '[{"@type":"OpeningHoursSpecification","dayOfWeek":["Sunday"],"opens":"00:00","closes":"23:59"}]',
  );
  ok("two entries -> two nodes", openingHoursLd([WEEKDAYS, { days: ["saturday"], opens: "09:00", closes: "13:00" }]).length === 2);
  ok("absent -> null (key never emitted)", openingHoursLd(undefined) === null);
  ok("withheld (fail-closed) -> null", openingHoursLd([{ days: ["funday"], opens: "08:00", closes: "17:00" }]) === null);
}

// ================= 4. emergencyContactLd: claims wall + shape =================
function testEmergencyContact() {
  console.log("\n# emergencyContactLd: flag + phone or nothing; byte-exact ContactPoint");
  ok("no flag -> null", emergencyContactLd("(360) 555-0100", undefined) === null);
  ok("flag false -> null", emergencyContactLd("(360) 555-0100", false) === null);
  ok("truthy non-true flag -> null (attestation is explicit)", emergencyContactLd("(360) 555-0100", 1) === null);
  ok("flag without a phone -> null (nothing invented)", emergencyContactLd(undefined, true) === null);
  ok("flag with an empty phone -> null", emergencyContactLd("", true) === null);
  eq(
    "flag + phone -> the ContactPoint, key order included",
    JSON.stringify(emergencyContactLd("(360) 555-0100", true)),
    '{"@type":"ContactPoint","contactType":"emergency","telephone":"(360) 555-0100","hoursAvailable":{"@type":"OpeningHoursSpecification","dayOfWeek":["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],"opens":"00:00","closes":"23:59"}}',
  );
}

// ================= 5. hoursLine: display formatting =================
function testHoursLine() {
  console.log('\n# hoursLine: run compression, allDay wording, "; " joining');
  eq("3+ consecutive days compress to a range", hoursLine([WEEKDAYS]), "Mon-Fri 08:00-17:00");
  eq(
    "a two-day run lists individually",
    hoursLine([{ days: ["saturday", "sunday"], opens: "09:00", closes: "13:00" }]),
    "Sat, Sun 09:00-13:00",
  );
  eq(
    "non-consecutive days list individually",
    hoursLine([{ days: ["monday", "wednesday", "friday"], opens: "09:00", closes: "13:00" }]),
    "Mon, Wed, Fri 09:00-13:00",
  );
  eq(
    "a run and a stray day combine",
    hoursLine([{ days: ["monday", "tuesday", "wednesday", "friday"], opens: "09:00", closes: "13:00" }]),
    "Mon-Wed, Fri 09:00-13:00",
  );
  eq(
    'entries join with "; " and allDay reads "open 24 hours"',
    hoursLine([WEEKDAYS, { days: ["saturday"], opens: "9:00", closes: "13:00" }, { days: ["sunday"], allDay: true }]),
    "Mon-Fri 08:00-17:00; Sat 09:00-13:00; Sun open 24 hours",
  );
  ok("absent -> null (the legacy hours string renders instead)", hoursLine(undefined) === null);
  ok("withheld (fail-closed) -> null", hoursLine([{ days: ["monday"], opens: "8am", closes: "17:00" }]) === null);
  const line = hoursLine([WEEKDAYS]);
  ok("no em or en dash in the line (copy discipline)", !/[–—]/.test(line));
}

// ================= 6. absent-field byte-identity =================
function testByteIdentity() {
  console.log("\n# absent openingHours: every builder null, existing configs unchanged");
  // A fixture shaped like an existing config's business block: the legacy free-form
  // string only. lib/seo.ts, lib/llms.ts, and Contact.tsx all feed these builders the
  // (absent) structured fields, so null here IS the byte-identical contract.
  const b = { name: "Fairview Elevator", email: "office@example.com", hours: "Mon-Fri 8-5" };
  ok("openingHoursLd -> null", openingHoursLd(b.openingHours) === null);
  ok("hoursLine -> null (llms.txt and Contact fall back to the string)", hoursLine(b.openingHours) === null);
  ok("emergencyContactLd -> null", emergencyContactLd(b.phone, b.emergency247) === null);
}

// ---- run ----
testNormalization();
testFailClosed();
testOpeningHoursLd();
testEmergencyContact();
testHoursLine();
testByteIdentity();

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
