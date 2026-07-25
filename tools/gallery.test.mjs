// ============================================================
// site-engine - gallery model harness (feedback item #18)
//
//   node tools/gallery.test.mjs
//
// Proves the pure resolver in lib/gallery.mjs, which components/sections/Gallery.tsx
// leans on for the plain image grid (with optional per-image captions) and the
// brand-neutral before/after work-pair grid. Same shared-.mjs pattern as
// tools/story-graph.test.mjs / tools/hours-ld.test.mjs: the logic is unit tested in
// plain Node with no React renderer or TypeScript toolchain.
//
// Covers:
//   - Byte-identity precondition: a legacy section (images only, no caption field on
//     any item, no pairs) resolves items with caption undefined and an empty pairs
//     array, which is exactly what the component needs to render the pre-caption
//     markup unchanged.
//   - Captions render verbatim, item by item; a blank/non-string caption resolves to
//     undefined rather than an empty wrapper.
//   - An unusable image ref (missing/blank src or alt) is dropped from `items` without
//     affecting any other item.
//   - Malformed pairs are dropped one at a time (missing before, missing after.alt, a
//     non-object entry, null) while every valid pair in the same array survives, in
//     declaration order - the fail-safe (drop-the-pair) contract, not fail-closed.
//   - beforeLabel/afterLabel: absent resolves to the "Before"/"After" defaults; a real
//     override passes through verbatim; a blank/non-string override falls back to the
//     default rather than rendering empty.
//   - Absent images AND pairs resolves to the fully-empty model.
//   - A non-gallery / empty / malformed section (undefined, null, {}, a string) never
//     throws and resolves to the empty model.
// ============================================================

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const MODULE_PATH = join(ROOT, "lib", "gallery.mjs");

const mod = await import("file://" + MODULE_PATH);
const { resolveGalleryModel } = mod;

let passed = 0,
  failed = 0;
const ok = (name, cond) => {
  if (cond) {
    passed++;
    console.log("  ok  " + name);
  } else {
    failed++;
    console.log("FAIL  " + name);
  }
};
const eq = (name, a, b) => ok(name + " (" + JSON.stringify(a) + ")", JSON.stringify(a) === JSON.stringify(b));

// ================= 1. byte-identity precondition (legacy section) =================
function testLegacyByteIdentity() {
  console.log("\n# legacy section (images only, no captions, no pairs): byte-identity precondition");
  const model = resolveGalleryModel({
    type: "gallery",
    images: [
      { src: "/a.jpg", alt: "Job A" },
      { src: "/b.jpg", alt: "Job B" },
    ],
  });
  eq("two legacy items resolve", model.items.length, 2);
  ok("item 0 caption is undefined", model.items[0].caption === undefined);
  ok("item 1 caption is undefined", model.items[1].caption === undefined);
  eq("src/alt pass through verbatim", [model.items[0].src, model.items[0].alt], ["/a.jpg", "Job A"]);
  eq("pairs is empty", model.pairs, []);
  eq("beforeLabel defaults", model.beforeLabel, "Before");
  eq("afterLabel defaults", model.afterLabel, "After");
}

// ================= 2. captions render verbatim =================
function testCaptions() {
  console.log("\n# captions: verbatim pass-through, blank/non-string resolves to undefined");
  const model = resolveGalleryModel({
    images: [
      { src: "/a.jpg", alt: "Job A", caption: "New roof, Bremerton" },
      { src: "/b.jpg", alt: "Job B", caption: "" },
      { src: "/c.jpg", alt: "Job C", caption: "   " },
      { src: "/d.jpg", alt: "Job D", caption: 42 },
      { src: "/e.jpg", alt: "Job E" },
    ],
  });
  eq("all five usable images kept", model.items.length, 5);
  eq("real caption passes through verbatim", model.items[0].caption, "New roof, Bremerton");
  ok("empty-string caption resolves to undefined", model.items[1].caption === undefined);
  ok("whitespace-only caption resolves to undefined", model.items[2].caption === undefined);
  ok("non-string caption resolves to undefined", model.items[3].caption === undefined);
  ok("absent caption resolves to undefined", model.items[4].caption === undefined);
}

// ================= 3. unusable image refs are dropped =================
function testUnusableImagesDropped() {
  console.log("\n# items: an unusable image ref is dropped without affecting the others");
  const model = resolveGalleryModel({
    images: [
      { src: "/a.jpg", alt: "Job A" },
      { src: "", alt: "Missing src" },
      { src: "/c.jpg", alt: "" },
      { alt: "No src field" },
      { src: "/e.jpg" },
      null,
      "not an object",
      { src: "/f.jpg", alt: "Job F" },
    ],
  });
  eq("only the two usable refs survive", model.items.length, 2);
  eq("survivors keep declaration order", [model.items[0].alt, model.items[1].alt], ["Job A", "Job F"]);
}

// ================= 4. malformed pairs are dropped one at a time =================
function testMalformedPairsDropped() {
  console.log("\n# pairs: malformed pairs dropped individually, valid pairs survive in order");
  const good1 = { before: { src: "/b1.jpg", alt: "Before 1" }, after: { src: "/a1.jpg", alt: "After 1" } };
  const missingBefore = { after: { src: "/a2.jpg", alt: "After 2" } };
  const missingAfterAlt = {
    before: { src: "/b3.jpg", alt: "Before 3" },
    after: { src: "/a3.jpg", alt: "" },
  };
  const nonObject = "not a pair";
  const nullEntry = null;
  const good2 = {
    before: { src: "/b2.jpg", alt: "Before 2" },
    after: { src: "/a2.jpg", alt: "After 2" },
    caption: "Deck rebuild",
    note: "Completed June 2026",
  };
  const model = resolveGalleryModel({
    pairs: [good1, missingBefore, missingAfterAlt, nonObject, nullEntry, good2],
  });
  eq("only the two valid pairs survive", model.pairs.length, 2);
  eq("survivors keep declaration order", [model.pairs[0].before.alt, model.pairs[1].before.alt], [
    "Before 1",
    "Before 2",
  ]);
  ok("a valid pair with no caption/note resolves both to undefined", model.pairs[0].caption === undefined && model.pairs[0].note === undefined);
  eq("caption on a valid pair passes through verbatim", model.pairs[1].caption, "Deck rebuild");
  eq("note on a valid pair passes through verbatim", model.pairs[1].note, "Completed June 2026");
}

// ================= 5. label defaults and overrides =================
function testLabels() {
  console.log("\n# beforeLabel/afterLabel: defaults, verbatim overrides, blank/non-string fallback");
  eq("absent labels default", [resolveGalleryModel({}).beforeLabel, resolveGalleryModel({}).afterLabel], [
    "Before",
    "After",
  ]);
  const overridden = resolveGalleryModel({ beforeLabel: "Start", afterLabel: "Finish" });
  eq("real overrides pass through verbatim", [overridden.beforeLabel, overridden.afterLabel], ["Start", "Finish"]);
  const blank = resolveGalleryModel({ beforeLabel: "   ", afterLabel: 7 });
  eq("blank/non-string overrides fall back to the default", [blank.beforeLabel, blank.afterLabel], [
    "Before",
    "After",
  ]);
}

// ================= 6. absent images and pairs => fully empty model =================
function testFullyEmpty() {
  console.log("\n# absent images AND pairs resolve to the fully-empty model");
  const model = resolveGalleryModel({ type: "gallery", heading: "Our work" });
  eq("items is empty", model.items, []);
  eq("pairs is empty", model.pairs, []);
}

// ================= 7. never throws on a malformed section =================
function testNeverThrows() {
  console.log("\n# a non-gallery / malformed section never throws and resolves to the empty model");
  for (const bad of [undefined, null, {}, "a string", 42, [], { images: "not an array" }, { pairs: "not an array" }]) {
    let threw = false;
    let model = null;
    try {
      model = resolveGalleryModel(bad);
    } catch {
      threw = true;
    }
    ok("no throw for " + JSON.stringify(bad), !threw);
    ok("resolves to empty model for " + JSON.stringify(bad), model && model.items.length === 0 && model.pairs.length === 0);
  }
}

testLegacyByteIdentity();
testCaptions();
testUnusableImagesDropped();
testMalformedPairsDropped();
testLabels();
testFullyEmpty();
testNeverThrows();

console.log(`\n${passed}/${passed + failed} pass`);
if (failed > 0) process.exit(1);
