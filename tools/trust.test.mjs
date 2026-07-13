// ============================================================
// site-engine - trust-strip + click-to-call harness (brand-neutral generalization)
//
//   node tools/trust.test.mjs
//
// Proves the pure helpers in lib/trust.mjs, which the TrustBar section and the CallBar
// import. Same shared-.mjs pattern as tools/seo-jsonld.test.mjs: the logic is unit-tested in
// plain Node (no TypeScript toolchain), and the full render is additionally proven by the
// rendered-output build check on the demos.
//
// Covers:
//   - trustBarFacts: the claims wall (nothing in => nothing out; only supplied facts render),
//     the typed convenience facts, the fully config-driven custom items, and ordering.
//   - trustBarHasContent: renders when there is a fact OR a verify link, else not.
//   - telHref: strips display formatting to a dialable tel: target, keeps a leading +.
//   - callBarLabel: brand-neutral default (NO trade-specific copy), routed nuance, override.
// ============================================================

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const MODULE_PATH = join(ROOT, "lib", "trust.mjs");

const mod = await import("file://" + MODULE_PATH);
const { trustBarFacts, trustBarHasContent, telHref, callBarLabel, callBarRegionLabel } = mod;

let passed = 0, failed = 0;
const ok = (name, cond) => { if (cond) { passed++; console.log("  ok  " + name); } else { failed++; console.log("FAIL  " + name); } };
const eq = (name, a, b) => ok(name + " (" + JSON.stringify(a) + ")", JSON.stringify(a) === JSON.stringify(b));

// ================= 1. trustBarFacts: claims wall =================
function testClaimsWall() {
  console.log("\n# trustBarFacts: nothing supplied => nothing rendered (claims wall)");
  eq("undefined => []", trustBarFacts(undefined), []);
  eq("null => []", trustBarFacts(null), []);
  eq("empty object => []", trustBarFacts({}), []);
  // A registry link alone is not a fact row; it does not fabricate a fact.
  eq("registryUrl alone => no facts", trustBarFacts({ registryUrl: "https://x.example" }), []);
}

// ================= 2. trustBarFacts: typed convenience facts =================
function testTypedFacts() {
  console.log("\n# trustBarFacts: typed convenience facts, only when supplied");
  eq("license default label", trustBarFacts({ licenseNumber: "AB-12" }), [{ label: "License", value: "AB-12" }]);
  eq("license custom label", trustBarFacts({ licenseNumber: "AB-12", licenseLabel: "State contractor license" }),
    [{ label: "State contractor license", value: "AB-12" }]);
  eq("bonded only", trustBarFacts({ bonded: true }), [{ label: "Coverage", value: "Bonded" }]);
  eq("insured only", trustBarFacts({ insured: true }), [{ label: "Coverage", value: "Insured" }]);
  eq("bonded and insured", trustBarFacts({ bonded: true, insured: true }), [{ label: "Coverage", value: "Bonded and Insured" }]);
  eq("years in business", trustBarFacts({ yearsInBusiness: 12 }), [{ label: "Experience", value: "12 years in business" }]);
  eq("since (fallback)", trustBarFacts({ since: 2004 }), [{ label: "Experience", value: "Serving since 2004" }]);
  eq("yearsInBusiness wins over since", trustBarFacts({ yearsInBusiness: 8, since: 2000 }),
    [{ label: "Experience", value: "8 years in business" }]);
  eq("brands joined", trustBarFacts({ brands: ["Carrier", "Trane"] }), [{ label: "Brands served", value: "Carrier, Trane" }]);
  eq("empty brands array => nothing", trustBarFacts({ brands: [] }), []);
}

// ================= 3. trustBarFacts: fully config-driven custom items =================
function testCustomItems() {
  console.log("\n# trustBarFacts: custom items are fully site-provided (brand-neutral)");
  eq("family owned + free estimates", trustBarFacts({ items: [
    { label: "Ownership", value: "Family owned" },
    { label: "Estimates", value: "Free" },
  ] }), [
    { label: "Ownership", value: "Family owned" },
    { label: "Estimates", value: "Free" },
  ]);
  eq("item href preserved as proof link", trustBarFacts({ items: [
    { label: "BBB", value: "A+ rated", href: "https://bbb.example/profile" },
  ] }), [{ label: "BBB", value: "A+ rated", href: "https://bbb.example/profile" }]);
  // An item missing a label or a value is dropped, never rendered half-empty.
  eq("item missing value dropped", trustBarFacts({ items: [{ label: "X" }, { value: "Y" }, { label: "Ok", value: "Yes" }] }),
    [{ label: "Ok", value: "Yes" }]);
}

// ================= 4. trustBarFacts: ordering =================
function testOrdering() {
  console.log("\n# trustBarFacts: license, coverage, experience, brands, then custom items");
  const facts = trustBarFacts({
    licenseNumber: "L-1", bonded: true, insured: true, yearsInBusiness: 5,
    brands: ["Otis"], items: [{ label: "Ownership", value: "Family owned" }],
  });
  eq("labels in order", facts.map((f) => f.label), ["License", "Coverage", "Experience", "Brands served", "Ownership"]);
}

// ================= 5. trustBarHasContent =================
function testHasContent() {
  console.log("\n# trustBarHasContent: fact OR verify link");
  ok("no content when empty", !trustBarHasContent({}));
  ok("no content when undefined", !trustBarHasContent(undefined));
  ok("content from a fact", trustBarHasContent({ insured: true }));
  ok("content from a verify link alone", trustBarHasContent({ registryUrl: "https://x.example" }));
}

// ================= 6. telHref =================
function testTelHref() {
  console.log("\n# telHref: dialable target, formatting stripped, leading + kept");
  eq("US formatting stripped", telHref("(555) 012-3400"), "tel:5550123400");
  eq("leading + preserved", telHref("+1 (206) 555-0100"), "tel:+12065550100");
  eq("letters and spaces stripped", telHref("call 206-555-0100 now"), "tel:2065550100");
}

// ================= 7. callBarLabel: brand-neutral =================
function testCallBarLabel() {
  console.log("\n# callBarLabel: brand-neutral default, routed nuance, site override");
  const def = callBarLabel({});
  const routed = callBarLabel({ dispatchRouted: true });
  ok("default is non-empty", typeof def === "string" && def.length > 0);
  ok("default carries NO elevator/trade copy", !/elevator|stuck|dispatch/i.test(def));
  ok("routed carries NO elevator/trade copy", !/elevator|stuck/i.test(routed));
  ok("routed differs from plain default", routed !== def);
  eq("site label always wins", callBarLabel({ label: "Talk to a plumber today", dispatchRouted: true }), "Talk to a plumber today");
  ok("undefined cfg still yields a neutral default", typeof callBarLabel(undefined) === "string");
}

// ================= 8. callBarRegionLabel: brand-neutral landmark name =================
function testCallBarRegionLabel() {
  console.log("\n# callBarRegionLabel: neutral default, site override, no trade copy in default");
  const def = callBarRegionLabel({});
  eq("default is neutral", def, "Call us");
  ok("default carries NO trade/elevator copy", !/elevator|emergency|stuck|dispatch/i.test(def));
  eq("site regionLabel wins", callBarRegionLabel({ regionLabel: "Emergency service line" }), "Emergency service line");
  ok("undefined cfg yields the neutral default", callBarRegionLabel(undefined) === "Call us");
}

testClaimsWall();
testTypedFacts();
testCustomItems();
testOrdering();
testHasContent();
testTelHref();
testCallBarLabel();
testCallBarRegionLabel();

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
