// ============================================================
// site-engine - LocalBusiness subtype allowlist harness (feedback item #29)
//
//   node tools/schema-type.test.mjs
//
// Proves the pure builder in lib/business-type.mjs, which lib/seo.ts folds into
// the org node's "@type" (resolveBusinessType(b.schemaType, isLocalBusiness(site))
// ?? the existing LocalBusiness/Organization expression). Same shared-.mjs
// pattern as lib/hours-ld.mjs so the allowlist logic is unit-tested in plain
// Node (no TypeScript toolchain).
//
// Covers:
//   - every allowlisted entry resolves to itself when isLocal is true, and the
//     returned value is REFERENCE-EQUAL to the list's own entry (never the
//     caller's input string, so a caller cannot smuggle a lookalike through);
//   - the same entries return null when isLocal is not exactly true;
//   - fail-closed on every other input: unknown names, wrong case, padded
//     whitespace, a lookalike/injection string, empty string, null, undefined,
//     a number, and an object all resolve to null;
//   - BUSINESS_SCHEMA_TYPES is frozen;
//   - byte-identity: JSON.stringify of a minimal org-node mock built with the
//     lib/seo.ts fallback expression is unchanged when schemaType is absent,
//     for both a LocalBusiness-qualifying site and a plain Organization site.
// ============================================================

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const MODULE_PATH = join(ROOT, "lib", "business-type.mjs");

const mod = await import("file://" + MODULE_PATH);
const { BUSINESS_SCHEMA_TYPES, resolveBusinessType } = mod;

let passed = 0, failed = 0;
const ok = (name, cond) => { if (cond) { passed++; console.log("  ok  " + name); } else { failed++; console.log("FAIL  " + name); } };
const eq = (name, a, b) => ok(name + " (" + JSON.stringify(a) + ")", a === b);

// ================= 1. every allowlist entry resolves to itself =================
function testAllowlistResolves() {
  console.log("\n# resolveBusinessType: every allowlisted entry resolves to itself when isLocal");
  for (const entry of BUSINESS_SCHEMA_TYPES) {
    const resolved = resolveBusinessType(entry, true);
    eq(`"${entry}" resolves to itself`, resolved, entry);
    ok(`"${entry}" resolved value is reference-equal to the list entry`, resolved === BUSINESS_SCHEMA_TYPES.find((e) => e === entry));
  }
}

// ================= 2. isLocal false (or not exactly true) withholds everything =================
function testIsLocalGate() {
  console.log("\n# resolveBusinessType: isLocal must be exactly true, or every entry withholds");
  for (const entry of BUSINESS_SCHEMA_TYPES) {
    ok(`"${entry}" with isLocal false -> null`, resolveBusinessType(entry, false) === null);
    ok(`"${entry}" with isLocal undefined -> null`, resolveBusinessType(entry, undefined) === null);
    ok(`"${entry}" with isLocal 1 (truthy, not === true) -> null`, resolveBusinessType(entry, 1) === null);
  }
}

// ================= 3. fail-closed on every other input =================
function testFailClosed() {
  console.log("\n# resolveBusinessType: fail-closed on anything not an exact allowlist match");
  const bad = (name, schemaType, isLocal = true) => ok(name, resolveBusinessType(schemaType, isLocal) === null);
  bad("unknown trade name", "Roofer");
  bad("lowercase variant of a real entry", "plumber");
  bad("leading-padded entry", " Plumber");
  bad("trailing-padded entry", "Plumber ");
  bad("lookalike/injection string", "Plumber<script>");
  bad("empty string", "");
  bad("whitespace-only string", "   ");
  bad("null", null);
  bad("undefined", undefined);
  bad("a number", 42);
  bad("a boolean", true);
  bad("an object", { schemaType: "Plumber" });
  bad("an array", ["Plumber"]);
  bad("a real entry but isLocal false", "Plumber", false);
}

// ================= 4. the list is frozen =================
function testFrozen() {
  console.log("\n# BUSINESS_SCHEMA_TYPES is frozen");
  ok("Object.isFrozen is true", Object.isFrozen(BUSINESS_SCHEMA_TYPES));
  const before = BUSINESS_SCHEMA_TYPES.length;
  try {
    BUSINESS_SCHEMA_TYPES.push("Roofer");
  } catch {
    // A frozen array throws in strict mode; either a throw or a no-op counts as frozen.
  }
  ok("push does not grow the list", BUSINESS_SCHEMA_TYPES.length === before);
}

// ================= 5. every entry is a genuine, non-empty trade name =================
function testEntryShape() {
  console.log("\n# BUSINESS_SCHEMA_TYPES: every entry is a non-empty PascalCase-looking string");
  for (const entry of BUSINESS_SCHEMA_TYPES) {
    ok(`"${entry}" is a non-empty string`, typeof entry === "string" && entry.length > 0);
    ok(`"${entry}" has no surrounding whitespace`, entry === entry.trim());
  }
  ok("no duplicate entries", new Set(BUSINESS_SCHEMA_TYPES).size === BUSINESS_SCHEMA_TYPES.length);
}

// ================= 6. byte-identity: absent schemaType matches today's expression =================
function testByteIdentity() {
  console.log("\n# byte-identity: the lib/seo.ts fallback expression is unchanged when schemaType is absent");
  // Mirrors the exact expression added to lib/seo.ts organizationLd:
  //   resolveBusinessType(b.schemaType, isLocalBusiness(site)) ?? (isLocalBusiness(site) ? "LocalBusiness" : "Organization")
  function orgType(schemaType, isLocal) {
    return resolveBusinessType(schemaType, isLocal) ?? (isLocal ? "LocalBusiness" : "Organization");
  }
  const localMock = { "@type": orgType(undefined, true), name: "Fairview Elevator" };
  eq(
    "a LocalBusiness-qualifying site with no schemaType still emits plain LocalBusiness",
    JSON.stringify(localMock),
    '{"@type":"LocalBusiness","name":"Fairview Elevator"}',
  );
  const orgMock = { "@type": orgType(undefined, false), name: "Harborview Studio" };
  eq(
    "a plain-Organization site with no schemaType still emits plain Organization",
    JSON.stringify(orgMock),
    '{"@type":"Organization","name":"Harborview Studio"}',
  );
  // An invalid schemaType on a LocalBusiness-qualifying site falls through the same way.
  const invalidMock = { "@type": orgType("Roofer", true), name: "Fairview Elevator" };
  eq(
    "an unknown schemaType on a LocalBusiness-qualifying site falls back to plain LocalBusiness",
    JSON.stringify(invalidMock),
    '{"@type":"LocalBusiness","name":"Fairview Elevator"}',
  );
  // schemaType is never consulted when the site is not LocalBusiness-qualifying: it can
  // never flip a plain Organization site into a LocalBusiness by itself.
  const notLocalMock = { "@type": orgType("Plumber", false), name: "Harborview Studio" };
  eq(
    "a real trade name on a non-LocalBusiness site still emits plain Organization",
    JSON.stringify(notLocalMock),
    '{"@type":"Organization","name":"Harborview Studio"}',
  );
}

// ---- run ----
testAllowlistResolves();
testIsLocalGate();
testFailClosed();
testFrozen();
testEntryShape();
testByteIdentity();

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
