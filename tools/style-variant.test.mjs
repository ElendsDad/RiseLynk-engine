// ============================================================
// site-engine - Section.style variant resolution harness
//
//   node tools/style-variant.test.mjs
//
// Proves the pure class-resolution logic in lib/style-variant.mjs that
// components/sections/Hero.tsx ("editorial") and components/sections/Services.tsx
// ("ribbon") turn into class names. The load-bearing contracts:
//   1) a section WITHOUT `style` resolves to null / an empty suffix, so appending
//      the suffix leaves the className string byte-identical (default OFF)
//   2) a variant is honored ONLY by the section types STYLE_HONORS lists for it;
//      every other type ignores the field safely (never an error, never a class)
//   3) unknown / malformed style values (typos, non-strings, prototype-chain key
//      names) resolve to nothing rather than throwing or leaking a class
// The variants' visuals themselves are pure CSS (app/globals.css) with no logic
// to unit test; the build proves those compile.
// ============================================================

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const MODULE_PATH = join(ROOT, "lib", "style-variant.mjs");

const mod = await import("file://" + MODULE_PATH);
const { STYLE_HONORS, styleVariantFor, styleSuffix } = mod;

let passed = 0, failed = 0;
const ok = (name, cond) => { if (cond) { passed++; console.log("  ok  " + name); } else { failed++; console.log("FAIL  " + name); } };
const eq = (name, a, b) => ok(name + " (" + JSON.stringify(a) + ")", JSON.stringify(a) === JSON.stringify(b));

function testHonorMap() {
  console.log("\n# STYLE_HONORS: the single source of truth for which types honor which variant");
  eq("ribbon is honored by the services feature-card section only", STYLE_HONORS.ribbon, ["services"]);
  eq("editorial is honored by the hero section only", STYLE_HONORS.editorial, ["hero"]);
  eq("collapse is honored by the faq section only", STYLE_HONORS.collapse, ["faq"]);
  eq("exactly the three shipped variants exist", Object.keys(STYLE_HONORS).sort(), ["collapse", "editorial", "ribbon"]);
}

function testDefaultsByteIdentical() {
  console.log("\n# absent / default: no style means no class, byte-identical markup");
  eq("undefined style resolves to null", styleVariantFor("hero", undefined), null);
  eq("undefined style yields empty suffix", styleSuffix("hero", undefined, "hero"), "");
  eq("null style yields empty suffix", styleSuffix("services", null, "grid"), "");
  eq("empty-string style yields empty suffix", styleSuffix("services", "", "grid"), "");
  ok("appending the empty suffix keeps the class string byte-identical",
    "hero" + styleSuffix("hero", undefined, "hero") === "hero");
}

function testHonoredCombos() {
  console.log("\n# honored combinations resolve to the modifier class the components emit");
  eq("hero + editorial resolves", styleVariantFor("hero", "editorial"), "editorial");
  eq("hero + editorial suffix", styleSuffix("hero", "editorial", "hero"), " hero--editorial");
  eq("services + ribbon resolves", styleVariantFor("services", "ribbon"), "ribbon");
  eq("services + ribbon suffix", styleSuffix("services", "ribbon", "grid"), " grid--ribbon");
  eq("faq + collapse resolves", styleVariantFor("faq", "collapse"), "collapse");
  eq("faq + collapse suffix", styleSuffix("faq", "collapse", "faq"), " faq--collapse");
  ok("composed className matches the rendered shape",
    "grid" + styleSuffix("services", "ribbon", "grid") === "grid grid--ribbon");
}

function testUnhonoredCombos() {
  console.log("\n# unhonored combinations: the wrong section type ignores the field safely");
  eq("hero does not honor ribbon", styleVariantFor("hero", "ribbon"), null);
  eq("services does not honor editorial", styleVariantFor("services", "editorial"), null);
  eq("about ignores ribbon", styleSuffix("about", "ribbon", "grid"), "");
  eq("pricing ignores editorial", styleSuffix("pricing", "editorial", "plans"), "");
  eq("cta ignores ribbon", styleSuffix("cta", "ribbon", "cta-banner"), "");
  eq("hero ignores collapse", styleSuffix("hero", "collapse", "hero"), "");
  eq("faq ignores ribbon", styleSuffix("faq", "ribbon", "faq"), "");
}

function testMalformedInputs() {
  console.log("\n# malformed style values: resolve to nothing, never throw, never leak a class");
  eq("unknown variant string", styleVariantFor("hero", "neon"), null);
  eq("unknown variant suffix", styleSuffix("hero", "neon", "hero"), "");
  eq("non-string style (number)", styleVariantFor("hero", 3), null);
  eq("non-string style (object)", styleVariantFor("services", { style: "ribbon" }), null);
  eq("non-string style (array)", styleVariantFor("services", ["ribbon"]), null);
  eq("prototype-chain key toString", styleVariantFor("hero", "toString"), null);
  eq("prototype-chain key constructor", styleVariantFor("hero", "constructor"), null);
  eq("prototype-chain key hasOwnProperty", styleVariantFor("services", "hasOwnProperty"), null);
  eq("prototype-chain key __proto__", styleVariantFor("services", "__proto__"), null);
  eq("unknown section type with a real variant", styleVariantFor("nope", "ribbon"), null);
}

testHonorMap();
testDefaultsByteIdentical();
testHonoredCombos();
testUnhonoredCombos();
testMalformedInputs();

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
