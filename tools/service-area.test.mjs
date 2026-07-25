// ============================================================
// site-engine - service-area collector + areaServed seam harness
//
//   node tools/service-area.test.mjs
//
// Proves the pure builders in lib/area-ld.mjs, which lib/seo.ts folds into the
// Organization/LocalBusiness and Service nodes and lib/llms.ts prints as the
// "Areas served" Contact line. Same shared-.mjs pattern as lib/rating-ld.mjs so
// the logic is unit-tested in plain Node (no TypeScript toolchain). The full
// end-to-end @graph is additionally proven by the rendered-output build check.
//
// Covers:
//   - areaServedLd: the back-compat seam. The legacy single-string path must
//     stringify byte-for-byte to the inline object lib/seo.ts carried before
//     ("@type" first, then "name"), asserted via JSON.stringify equality.
//   - areaServedLd: null when neither surface exists (claims wall: no invented
//     coverage); structured areas win over the string, in collected order.
//   - collectServiceAreas: walks pages and sections, dedupes by normalized name
//     (first wins), preserves order, ignores other section types and empty
//     serviceArea sections, and skips a draft page's sections entirely (engine
//     feedback #4, PageConfig.draft).
//   - areasLine: ", "-joined names; null for empty.
//   - A no-serviceArea-sections fixture through the seam matches the pre-change
//     shape exactly (the byte-identical contract for every existing config).
// ============================================================

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const MODULE_PATH = join(ROOT, "lib", "area-ld.mjs");

const mod = await import("file://" + MODULE_PATH);
const { collectServiceAreas, areaServedLd, areasLine } = mod;

let passed = 0, failed = 0;
const ok = (name, cond) => { if (cond) { passed++; console.log("  ok  " + name); } else { failed++; console.log("FAIL  " + name); } };
const eq = (name, a, b) => ok(name + " (" + JSON.stringify(a) + ")", a === b);

// ================= 1. areaServedLd: the legacy passthrough =================
function testLegacyPassthrough() {
  console.log("\n# areaServedLd: legacy single-string path, byte-for-byte (key order included)");
  // The exact stringification of the inline object lib/seo.ts carried before the seam:
  // { "@type": "Place", name: b.serviceArea }. Key order is part of the contract.
  eq(
    "legacy string stringifies to the pre-change bytes",
    JSON.stringify(areaServedLd("Serving King County", [])),
    '{"@type":"Place","name":"Serving King County"}',
  );
  eq(
    "areas omitted entirely behaves the same",
    JSON.stringify(areaServedLd("Serving King County")),
    '{"@type":"Place","name":"Serving King County"}',
  );
  ok("no string + no areas -> null", areaServedLd(undefined, []) === null);
  ok("no string + areas omitted -> null", areaServedLd(undefined) === null);
  ok("empty string -> null (nothing invented)", areaServedLd("", []) === null);
}

// ================= 2. areaServedLd: structured mode =================
function testStructuredMode() {
  console.log("\n# areaServedLd: structured areas -> one Place per area, in order; structured wins");
  const areas = [{ name: "Riverton" }, { name: "Fairview", note: "Same-day" }, { name: "Cedar Falls" }];
  const ld = areaServedLd(undefined, areas);
  ok("areas produce an array", Array.isArray(ld) && ld.length === 3);
  eq(
    "Place nodes carry the collected order and key order",
    JSON.stringify(ld),
    '[{"@type":"Place","name":"Riverton"},{"@type":"Place","name":"Fairview"},{"@type":"Place","name":"Cedar Falls"}]',
  );
  ok("notes never leak into the JSON-LD", !JSON.stringify(ld).includes("Same-day"));
  const both = areaServedLd("Serving King County", [{ name: "Riverton" }]);
  ok("structured wins over the string (no merge)", Array.isArray(both) && both.length === 1 && both[0].name === "Riverton");
}

// ================= 3. collectServiceAreas =================
function testCollector() {
  console.log("\n# collectServiceAreas: walks pages, dedupes by normalized name, first wins");
  const site = {
    pages: [
      {
        sections: [
          { type: "hero", heading: "H" },
          { type: "serviceArea", areas: [{ name: "Riverton" }, { name: "Fairview", note: "Same-day" }] },
          { type: "services", items: [{ title: "T", body: "B" }] },
        ],
      },
      {
        sections: [
          { type: "serviceArea", areas: [{ name: "  riverton " }, { name: "Cedar Falls" }] },
          { type: "serviceArea" }, // no areas: ignored
          { type: "serviceArea", areas: [] }, // empty: ignored
        ],
      },
    ],
  };
  const areas = collectServiceAreas(site);
  eq("dedupes by normalized name, first wins, order preserved",
    JSON.stringify(areas.map((a) => a.name)),
    '["Riverton","Fairview","Cedar Falls"]',
  );
  ok("the note rides along on the collected entry", areas[1].note === "Same-day");
  ok("no sections at all -> empty", collectServiceAreas({ pages: [{ sections: [{ type: "hero" }] }] }).length === 0);
  ok("no pages -> empty", collectServiceAreas({ pages: [] }).length === 0);
}

// ================= 3b. collectServiceAreas skips draft pages (PageConfig.draft) =================
function testCollectorSkipsDraftPages() {
  console.log("\n# collectServiceAreas: a draft page's serviceArea sections never leak in");
  const site = {
    pages: [
      { sections: [{ type: "serviceArea", areas: [{ name: "Riverton" }] }] },
      { draft: true, sections: [{ type: "serviceArea", areas: [{ name: "Secret Falls" }] }] },
    ],
  };
  const areas = collectServiceAreas(site);
  eq("only the non-draft page's area is collected", JSON.stringify(areas.map((a) => a.name)), '["Riverton"]');
  ok("the draft page's area name never appears", !areas.some((a) => a.name === "Secret Falls"));
  ok(
    "absent draft flag (undefined): unaffected, same as before this flag existed",
    collectServiceAreas({ pages: [{ sections: [{ type: "serviceArea", areas: [{ name: "Fairview" }] }] }] }).length === 1,
  );
}

// ================= 4. areasLine =================
function testAreasLine() {
  console.log('\n# areasLine: ", "-joined names for llms.txt; null for empty');
  eq("joins names with a comma and space",
    areasLine([{ name: "Riverton" }, { name: "Fairview" }, { name: "Cedar Falls" }]),
    "Riverton, Fairview, Cedar Falls",
  );
  eq("single area is just the name", areasLine([{ name: "Riverton" }]), "Riverton");
  ok("empty -> null", areasLine([]) === null);
  ok("undefined -> null", areasLine(undefined) === null);
}

// ================= 5. the pre-change shape for an existing config =================
function testExistingConfigShape() {
  console.log("\n# no-serviceArea-sections fixture: the seam reproduces the pre-change shape");
  // A fixture shaped like an existing config: a serviceArea STRING, sections of other
  // types, and NO serviceArea sections. lib/seo.ts feeds the seam exactly like this
  // (areaServedLd(b.serviceArea, collectServiceAreas(site))), so this equality is the
  // byte-identical contract for every existing config's areaServed value.
  const site = {
    business: { serviceArea: "Serving Kitsap County" },
    pages: [
      { sections: [{ type: "hero" }, { type: "services", items: [{ title: "T", body: "B" }] }] },
      { sections: [{ type: "testimonials", quotes: [] }, { type: "contact" }] },
    ],
  };
  const collected = collectServiceAreas(site);
  ok("nothing collected from an existing config", collected.length === 0);
  eq(
    "areaServed matches the pre-change inline object byte-for-byte",
    JSON.stringify(areaServedLd(site.business.serviceArea, collected)),
    '{"@type":"Place","name":"Serving Kitsap County"}',
  );
  ok("no llms line for an existing config", areasLine(collected) === null);
  // And a config with NEITHER surface (site-demo has no serviceArea string on some
  // configs): the seam stays null so the key is never emitted.
  ok("no string + nothing collected -> null (key never emitted)",
    areaServedLd(undefined, collected) === null);
}

// ---- run ----
testLegacyPassthrough();
testStructuredMode();
testCollector();
testCollectorSkipsDraftPages();
testAreasLine();
testExistingConfigShape();

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
