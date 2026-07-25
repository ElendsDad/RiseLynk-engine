// ============================================================
// site-engine - addons (add-on / priced-menu) section harness (feedback item 7)
//
//   node tools/addons.test.mjs
//
// Proves the two pure, dependency-free pieces components/sections/Addons.tsx and
// lib/seo.ts's softwareApplicationLd rely on:
//
//   1) lib/section-id.mjs resolveSectionId - the DOM-id mechanism that lets a page
//      render more than one addons section without a duplicate id: an explicit
//      Section.id wins verbatim, and an omitted id gets a deterministic
//      auto-suffix computed from the page's own section list (never random, never
//      time-based), counted by position among SAME-TYPE sections only.
//
//   2) lib/offer-ld.mjs collectPricingTiers - the Offer/AggregateOffer collector
//      lib/seo.ts's softwareApplicationLd feeds. It is type-gated on
//      `section.type === "pricing"` ONLY, so an addons section's items (a
//      DIFFERENT field, `addonItems`, never `tiers`) can never reach the
//      SoftwareApplication Offer JSON-LD - proven here both for the normal case
//      and for an adversarial config that smuggles a `tiers` array under
//      `type: "addons"` (the gate must key off the TYPE, not merely the absence
//      of a `tiers` field).
// ============================================================

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

const sectionIdMod = await import("file://" + join(ROOT, "lib", "section-id.mjs"));
const { resolveSectionId } = sectionIdMod;

const offerMod = await import("file://" + join(ROOT, "lib", "offer-ld.mjs"));
const { collectPricingTiers, pricingOffersLd } = offerMod;

let passed = 0, failed = 0;
const ok = (name, cond) => { if (cond) { passed++; console.log("  ok  " + name); } else { failed++; console.log("FAIL  " + name); } };
const eq = (name, a, b) => ok(name + " (" + JSON.stringify(a) + ")", JSON.stringify(a) === JSON.stringify(b));

// ================= 1. resolveSectionId: explicit id path =================
function testExplicitId() {
  console.log("\n# resolveSectionId: an explicit Section.id wins verbatim");
  const sections = [{ type: "addons", id: "service-addons" }];
  eq("explicit id used verbatim", resolveSectionId(sections, 0, "addons"), "service-addons");

  const withWhitespace = [{ type: "addons", id: "  padded-id  " }];
  eq("explicit id is trimmed", resolveSectionId(withWhitespace, 0, "addons"), "padded-id");

  const emptyId = [{ type: "addons", id: "" }, { type: "addons", id: "   " }];
  eq("an empty-string id falls back to auto (first occurrence)", resolveSectionId(emptyId, 0, "addons"), "addons");
  eq("a whitespace-only id falls back to auto (second occurrence)", resolveSectionId(emptyId, 1, "addons"), "addons-2");
}

// ================= 2. resolveSectionId: auto-suffix path =================
function testAutoSuffixSingle() {
  console.log("\n# resolveSectionId: a single section of a type gets the plain base slug");
  const sections = [{ type: "hero" }, { type: "addons" }, { type: "about" }];
  eq("the only addons section gets the base slug, no suffix", resolveSectionId(sections, 1, "addons"), "addons");
}

function testAutoSuffixMultiple() {
  console.log("\n# resolveSectionId: two addons sections on one page get unique ids automatically");
  const sections = [
    { type: "hero" },
    { type: "addons" },
    { type: "services" },
    { type: "addons" },
  ];
  eq("first addons section: base slug", resolveSectionId(sections, 1, "addons"), "addons");
  eq("second addons section: auto-suffixed -2", resolveSectionId(sections, 3, "addons"), "addons-2");
  ok(
    "the two resolved ids are actually distinct",
    resolveSectionId(sections, 1, "addons") !== resolveSectionId(sections, 3, "addons"),
  );
}

function testAutoSuffixInterleavedAndThreeOrMore() {
  console.log("\n# resolveSectionId: interleaved other-type sections and 3+ occurrences");
  const sections = [
    { type: "addons" }, // 0: addons -> "addons"
    { type: "pricing" }, // 1: unrelated type, does not affect the count
    { type: "hero" }, // 2: unrelated type
    { type: "addons" }, // 3: addons -> "addons-2"
    { type: "addons" }, // 4: addons -> "addons-3"
  ];
  eq("occurrence 1", resolveSectionId(sections, 0, "addons"), "addons");
  eq("occurrence 2 (unaffected by interleaved pricing/hero)", resolveSectionId(sections, 3, "addons"), "addons-2");
  eq("occurrence 3", resolveSectionId(sections, 4, "addons"), "addons-3");
  const ids = [0, 3, 4].map((i) => resolveSectionId(sections, i, "addons"));
  eq("all three ids in order", ids, ["addons", "addons-2", "addons-3"]);
  ok("all three ids are unique", new Set(ids).size === 3);
}

function testAutoSuffixMixedWithExplicit() {
  console.log("\n# resolveSectionId: an explicit id on one occurrence does not break the others' count");
  const sections = [
    { type: "addons", id: "featured-addons" }, // occurrence 1, explicit
    { type: "addons" }, // occurrence 2, auto
    { type: "addons" }, // occurrence 3, auto
  ];
  eq("explicit first section keeps its own id", resolveSectionId(sections, 0, "addons"), "featured-addons");
  eq("second section still counts as occurrence 2 (by type, not by id presence)", resolveSectionId(sections, 1, "addons"), "addons-2");
  eq("third section counts as occurrence 3", resolveSectionId(sections, 2, "addons"), "addons-3");
}

// ================= 3. resolveSectionId: edge cases =================
function testEdgeCases() {
  console.log("\n# resolveSectionId: malformed / missing inputs resolve to the base slug, never throw");
  eq("empty sections array", resolveSectionId([], 0, "addons"), "addons");
  eq("undefined sections", resolveSectionId(undefined, 0, "addons"), "addons");
  eq("null sections", resolveSectionId(null, 0, "addons"), "addons");
  eq("out-of-range index (past the end)", resolveSectionId([{ type: "addons" }], 5, "addons"), "addons");
  eq("negative index", resolveSectionId([{ type: "addons" }], -1, "addons"), "addons");
  eq("non-array sections (a stray object)", resolveSectionId({ 0: { type: "addons" } }, 0, "addons"), "addons");
}

// ================= 4. collectPricingTiers: the Offer decoupling =================
function testAddonsNeverReachPricingCollector() {
  console.log("\n# collectPricingTiers: an addons section's items never reach the Offer collector");
  const pages = [
    {
      sections: [
        { type: "pricing", tiers: [{ name: "Standard", price: "$39", priceValue: 39, features: [] }] },
        {
          type: "addons",
          addonItems: [
            { name: "Rush scheduling", price: "$25" },
            { name: "Extended checkup", price: "Included" },
          ],
        },
        // Adversarial: an addons-typed section that ALSO carries a `tiers` array
        // (a config mistake, or a future refactor gone wrong). The collector must
        // gate on the SECTION TYPE, not merely on the presence of a `tiers` field,
        // so this must never leak into the Offer either.
        {
          type: "addons",
          tiers: [{ name: "Smuggled", price: "$1", priceValue: 1, features: [] }],
        },
      ],
    },
  ];
  const tiers = collectPricingTiers(pages);
  eq("only the ONE real pricing tier is collected", tiers.length, 1);
  eq("the collected tier is the pricing section's own tier", tiers[0].name, "Standard");
  ok("no addonItems name leaked into the collector", !tiers.some((t) => t.name === "Rush scheduling" || t.name === "Extended checkup"));
  ok("the smuggled tiers[] under type:addons never leaked (type-gated, not field-gated)", !tiers.some((t) => t.name === "Smuggled"));
}

function testEmptySiteAndAddonsOnlySite() {
  console.log("\n# collectPricingTiers: a site with only addons sections (no pricing at all) collects nothing");
  const pages = [
    { sections: [{ type: "addons", addonItems: [{ name: "Rush scheduling", price: "$25" }] }] },
    { sections: [{ type: "hero" }, { type: "addons", addonItems: [{ name: "Extended checkup", price: "$40" }] }] },
  ];
  eq("collects nothing (no pricing section anywhere)", collectPricingTiers(pages), []);
  eq("absent pages resolves to nothing, never throws", collectPricingTiers(undefined), []);
}

// ================= 5. end to end: no new JSON-LD from an addons section =================
function testNoNewJsonLdFromAddons() {
  console.log("\n# pricingOffersLd end to end: addons items never turn into an Offer, even indirectly");
  const pages = [
    {
      sections: [
        { type: "pricing", tiers: [{ name: "Standard", price: "$39", priceValue: 39, features: [] }] },
        { type: "addons", addonItems: [{ name: "Rush scheduling", price: "$25" }] },
      ],
    },
  ];
  const tiers = collectPricingTiers(pages);
  const offer = pricingOffersLd(tiers, "usd");
  eq("a single Offer, for the pricing tier only", offer && offer.name, "Standard");
  ok("no addon name anywhere in the emitted Offer JSON-LD", !JSON.stringify(offer).includes("Rush scheduling"));

  const noPricingPages = [
    { sections: [{ type: "addons", addonItems: [{ name: "Rush scheduling", price: "$25" }] }] },
  ];
  eq(
    "a page with ONLY an addons section emits no Offer at all (undefined, not an empty object)",
    pricingOffersLd(collectPricingTiers(noPricingPages), "usd"),
    undefined,
  );
}

testExplicitId();
testAutoSuffixSingle();
testAutoSuffixMultiple();
testAutoSuffixInterleavedAndThreeOrMore();
testAutoSuffixMixedWithExplicit();
testEdgeCases();
testAddonsNeverReachPricingCollector();
testEmptySiteAndAddonsOnlySite();
testNoNewJsonLdFromAddons();

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
