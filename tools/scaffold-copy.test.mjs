// =============================================================================
// DoD proof for the scaffold-copy lint (feedback item #36's fix).
//
//   node tools/scaffold-copy.test.mjs
//
// Covers:
//   - the real engine tree (app/ + components/) is clean today, proving the checkout-success
//     regression this gate exists to catch cannot recur silently;
//   - extractCopyStrings pulls literal JSX text/attribute copy and skips config-bound
//     expressions, TS generics, and multi-line code fragments (the false-positive guard);
//   - checkScaffold reuses the SAME lintString the config and blog gates run (one rule set);
//   - the gate actually FIRES on a seeded violation (a gate that never fails is not a gate) -
//     proven directly against the historical bug string ("Thank you!").
//
// Zero dependencies: node:assert only. Exit code is non-zero on any failure.
// =============================================================================

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { checkScaffold, extractCopyStrings, looksLikeCopy, lintScaffoldFile } from "./scaffold-copy.mjs";
import { lintString as scaffoldLintString } from "./scaffold-copy.mjs";
import { lintString as hydrateLintString } from "./hydrate.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const ENGINE_ROOT = resolve(here, "..");

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

test("the real engine scaffold (app/ + components/) is lint-clean today", () => {
  const result = checkScaffold();
  assert.ok(result.fileCount > 10, `expected many .tsx files scanned, got ${result.fileCount}`);
  assert.ok(result.stringsScanned > 20, `expected many copy strings scanned, got ${result.stringsScanned}`);
  assert.deepEqual(result.violations, [], `scaffold copy must be clean; got ${JSON.stringify(result.violations)}`);
});

test("the historical bug (checkout success 'Thank you!') is gone from the tree", () => {
  const successFile = join(ENGINE_ROOT, "app", "success", "page.tsx");
  const { strings, violations } = lintScaffoldFile(successFile);
  assert.ok(strings.includes("Thank you."), "expected the corrected copy to be present");
  assert.ok(!strings.includes("Thank you!"), "the banned exclamation copy must not be present");
  assert.deepEqual(violations, [], "the success page must be lint-clean");
});

test("extractCopyStrings pulls literal JSX text and skips config-bound expressions", () => {
  const src = `
    export default function X() {
      return (
        <div>
          <h1>Back to home</h1>
          <p>{business.name}</p>
          <span aria-label="Call now">icon</span>
          <span aria-label={dynamicLabel}>icon2</span>
        </div>
      );
    }
  `;
  const strings = extractCopyStrings(src);
  assert.ok(strings.includes("Back to home"), "expected literal text node to be extracted");
  assert.ok(strings.includes("Call now"), "expected literal aria-label to be extracted");
  assert.ok(strings.includes("icon"), "expected the second literal text node to be extracted");
  assert.ok(!strings.some((s) => s.includes("business.name")), "a config-bound expression must be skipped");
  assert.ok(!strings.includes("dynamicLabel"), "a dynamic attribute expression must be skipped");
});

test("looksLikeCopy rejects code fragments (the false-positive guard)", () => {
  const rejects = [
    "useState<string>(\"idle\");",
    "(",
    "a, b) => (",
    "line one\r\nline two",
    "usEState", // camelCase-looking identifier with no space
  ];
  for (const s of rejects) assert.equal(looksLikeCopy(s), false, `expected to reject: ${JSON.stringify(s)}`);
});

test("looksLikeCopy accepts real prose", () => {
  const accepts = ["Back to home", "Call now", "Choose one...", "Something went wrong. Please call us."];
  for (const s of accepts) assert.equal(looksLikeCopy(s), true, `expected to accept: ${JSON.stringify(s)}`);
});

test("the gate actually FIRES on a seeded exclamation (negative proof)", () => {
  const src = `export default function X() { return (<h1>Thank you!</h1>); }`;
  const strings = extractCopyStrings(src);
  assert.ok(strings.includes("Thank you!"), "extractor must find the seeded string");
  const violations = strings.flatMap((s) => scaffoldLintString(s));
  assert.ok(violations.some((v) => v.rule === "exclamation"), "expected the exclamation rule to fire");
});

test("the gate actually FIRES on a seeded em dash (negative proof)", () => {
  const src = `export default function X() { return (<p>we do it — always</p>); }`;
  const strings = extractCopyStrings(src);
  const violations = strings.flatMap((s) => scaffoldLintString(s));
  assert.ok(violations.some((v) => v.rule === "dash"), "expected the dash rule to fire");
});

test("no drift: the scaffold gate uses the SAME lintString the hydrator and blog gates run", () => {
  assert.equal(scaffoldLintString, hydrateLintString, "lintString must be one function, imported two ways");
});

test("checkScaffold covers both app/ and components/", () => {
  const result = checkScaffold();
  assert.ok(result.perFile.some((f) => f.file.startsWith("app/")), "expected app/ files scanned");
  assert.ok(result.perFile.some((f) => f.file.startsWith("components/")), "expected components/ files scanned");
});

// -----------------------------------------------------------------------------
// runner
// -----------------------------------------------------------------------------

let failed = 0;
for (const { name, fn } of tests) {
  try {
    fn();
    console.log(`  PASS  ${name}`);
  } catch (err) {
    failed++;
    console.error(`  FAIL  ${name}`);
    console.error(`        ${err.message.split("\n").join("\n        ")}`);
  }
}
console.log(`\n${tests.length - failed}/${tests.length} passed`);
process.exit(failed ? 1 : 0);
