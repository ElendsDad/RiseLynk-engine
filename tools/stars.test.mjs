// ============================================================
// site-engine - visible star-rating harness (local-trades conversion batch, deliverable 2)
//
//   node tools/stars.test.mjs
//
// Proves the pure star model in lib/stars.mjs, which components/StarRating.tsx and
// the business-reviews block in components/sections/Testimonials.tsx render from.
// Same shared-.mjs pattern as tools/seo-jsonld.test.mjs, so the logic is unit-tested
// in plain Node (no TypeScript toolchain).
//
// Covers:
//   - starModel: clamp to [0, best], half-star quantize (round half up), and the
//     claims wall (no model for a non-finite value, a non-positive best, or
//     value <= 0: the engine never draws a default or invented star).
//   - the invariant full + half + empty === best (a star row is always `best` glyphs).
//   - starAriaLabel: exact accessible strings, including a non-default best.
//   - ratingSummaryLine: exact visible strings for a valid rating; null through the
//     ratingIsValid claims wall otherwise.
// ============================================================

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const MODULE_PATH = join(ROOT, "lib", "stars.mjs");

const mod = await import("file://" + MODULE_PATH);
const { starModel, starAriaLabel, ratingSummaryLine } = mod;

let passed = 0, failed = 0;
const ok = (name, cond) => { if (cond) { passed++; console.log("  ok  " + name); } else { failed++; console.log("FAIL  " + name); } };
const eq = (name, a, b) => ok(name + " (" + JSON.stringify(a) + ")", a === b);

// ================= 1. starModel: clamp + half-star quantize =================
function testQuantize() {
  console.log("\n# starModel: clamp to [0, best], quantize to half-star steps (round half up)");
  const below = starModel(4.24);
  eq("4.24 -> 4 full", below.full, 4);
  eq("4.24 -> 0 half", below.half, 0);
  eq("4.24 -> 1 empty", below.empty, 1);
  eq("4.24 keeps the as-supplied value", below.value, 4.24);

  const at = starModel(4.25);
  eq("4.25 -> 4 full", at.full, 4);
  eq("4.25 -> 1 half (half up at the .25 boundary)", at.half, 1);
  eq("4.25 -> 0 empty", at.empty, 0);

  const mid = starModel(4.5);
  eq("4.5 -> 4 full", mid.full, 4);
  eq("4.5 -> 1 half", mid.half, 1);

  const up = starModel(4.75);
  eq("4.75 -> 5 full (half up at the .75 boundary to the next full)", up.full, 5);
  eq("4.75 -> 0 half", up.half, 0);
  eq("4.75 -> 0 empty", up.empty, 0);

  const over = starModel(6, 5);
  eq("6 with best 5 clamps -> 5 full", over.full, 5);
  eq("6 with best 5 clamps the value too", over.value, 5);
  eq("6 with best 5 -> 0 empty", over.empty, 0);

  ok("0 -> null (claims wall: no zero-star row)", starModel(0) === null);
  ok("negative -> null", starModel(-1) === null);
}

// ================= 2. starModel: invalid input (claims wall) =================
function testInvalid() {
  console.log("\n# starModel: invalid input yields null, never a default star");
  ok("undefined -> null", starModel(undefined) === null);
  ok("NaN -> null", starModel(NaN) === null);
  ok("Infinity -> null", starModel(Infinity) === null);
  ok("best 0 -> null", starModel(4.8, 0) === null);
  ok("negative best -> null", starModel(4.8, -3) === null);
  ok("non-finite best -> null", starModel(4.8, NaN) === null);
}

// ================= 3. total star count is always best =================
function testTotal() {
  console.log("\n# starModel: full + half + empty === best, always");
  for (const v of [0.3, 1, 2.5, 3.7, 4.24, 4.25, 4.75, 5]) {
    const m = starModel(v);
    eq("value " + v + " totals 5", m.full + m.half + m.empty, 5);
  }
  const ten = starModel(7.2, 10);
  eq("value 7.2 with best 10 totals 10", ten.full + ten.half + ten.empty, 10);
}

// ================= 4. starAriaLabel: exact accessible strings =================
function testAriaLabel() {
  console.log("\n# starAriaLabel: exact strings, null through the same claims wall");
  eq("default best", starAriaLabel(4.8), "Rated 4.8 out of 5");
  eq("non-default best", starAriaLabel(9, 10), "Rated 9 out of 10");
  eq("over-best value reads the clamped value", starAriaLabel(6), "Rated 5 out of 5");
  ok("invalid value -> null", starAriaLabel(NaN) === null);
  ok("zero -> null", starAriaLabel(0) === null);
  ok("best 0 -> null", starAriaLabel(4.8, 0) === null);
}

// ================= 5. ratingSummaryLine: claims-walled visible summary =================
function testSummaryLine() {
  console.log("\n# ratingSummaryLine: exact string for a valid rating, null otherwise");
  eq("valid rating", ratingSummaryLine({ ratingValue: 4.8, reviewCount: 63 }), "4.8 out of 5 from 63 reviews");
  eq("one review is singular", ratingSummaryLine({ ratingValue: 5, reviewCount: 1 }), "5 out of 5 from 1 review");
  eq("bestRating carried", ratingSummaryLine({ ratingValue: 4, reviewCount: 12, bestRating: 10 }), "4 out of 10 from 12 reviews");
  ok("missing rating -> null", ratingSummaryLine(undefined) === null);
  ok("null rating -> null", ratingSummaryLine(null) === null);
  ok("zero reviewCount -> null (nothing to average)", ratingSummaryLine({ ratingValue: 5, reviewCount: 0 }) === null);
  ok("missing reviewCount -> null", ratingSummaryLine({ ratingValue: 5 }) === null);
  ok("non-finite value -> null", ratingSummaryLine({ ratingValue: NaN, reviewCount: 10 }) === null);
}

// ---- run ----
testQuantize();
testInvalid();
testTotal();
testAriaLabel();
testSummaryLine();

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
