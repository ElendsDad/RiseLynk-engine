// ============================================================
// site-engine - built-in icon set harness (feedback-v0.5.0 item 12, cosmetic)
//
//   node tools/icons.test.mjs
//
// Proves the pure data in lib/icons.mjs, which components/Icon.tsx draws from. Same
// shared-.mjs pattern as tools/stars.test.mjs: plain Node, no TypeScript toolchain.
//
// Covers:
//   - iconPaths: a known name returns real path data; an unknown/misspelled name (or a
//     non-string) returns null, fail-safe by design (never a broken icon, never a throw).
//   - every entry in the set is well-formed: a non-empty array of non-empty SVG path
//     "d" strings, each starting with an absolute moveto (M), so nothing malformed can
//     reach the SVG the component renders.
//   - ICON_NAMES stays in sync with the ICONS registry (the allowlist config docs point
//     a site author at is never stale).
// ============================================================

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const MODULE_PATH = join(ROOT, "lib", "icons.mjs");

const mod = await import("file://" + MODULE_PATH);
const { ICONS, ICON_NAMES, iconPaths } = mod;

let passed = 0, failed = 0;
const ok = (name, cond) => { if (cond) { passed++; console.log("  ok  " + name); } else { failed++; console.log("FAIL  " + name); } };
const eq = (name, a, b) => ok(name + " (" + JSON.stringify(a) + ")", JSON.stringify(a) === JSON.stringify(b));

function testRegistry() {
  console.log("\n# lib/icons.mjs: registry shape");
  ok("the set is not empty", ICON_NAMES.length > 0);
  eq("ICON_NAMES matches Object.keys(ICONS)", ICON_NAMES, Object.keys(ICONS));
  for (const name of ICON_NAMES) {
    const paths = ICONS[name];
    ok(`${name}: paths is a non-empty array`, Array.isArray(paths) && paths.length > 0);
    for (const d of paths) {
      ok(`${name}: path "d" is a non-empty string`, typeof d === "string" && d.trim().length > 0);
      ok(`${name}: path "d" starts with an absolute moveto (M)`, /^M/.test(d.trim()));
    }
  }
}

function testIconPaths() {
  console.log("\n# iconPaths: known name resolves, unknown name/type fails safe");
  ok("a known name returns its path data", iconPaths("wrench") === ICONS.wrench);
  for (const name of ICON_NAMES) {
    ok(`iconPaths("${name}") resolves`, Array.isArray(iconPaths(name)));
  }
  eq("an unknown name returns null (fail-safe, never a throw)", iconPaths("not-a-real-icon"), null);
  eq("empty string returns null", iconPaths(""), null);
  eq("undefined returns null", iconPaths(undefined), null);
  eq("a non-string value returns null", iconPaths(42), null);

  // Object.prototype members must NOT resolve to an inherited value: a bare property read
  // would hand back a truthy Function and crash the build at components/Icon.tsx paths.map().
  // Each must return null (and Array.isArray proves it is not the inherited non-array).
  for (const hostile of ["toString", "constructor", "hasOwnProperty", "valueOf", "__proto__", "isPrototypeOf"]) {
    eq(`a prototype-member name ("${hostile}") returns null, never an inherited value`, iconPaths(hostile), null);
    ok(`iconPaths("${hostile}") is never a truthy non-array`, !Array.isArray(iconPaths(hostile)) && iconPaths(hostile) === null);
  }
}

testRegistry();
testIconPaths();

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
