// =============================================================================
// site-engine - per-service detail-page Service JSON-LD harness (feedback item #19)
//
//   node tools/service-page.test.mjs
//
// Proves the pure builder in lib/service-page-ld.mjs, which app/[slug]/page.tsx and
// app/page.tsx wire in when a page carries a PageConfig.service block: a page-level
// Service node identified by the page's OWN URL, distinct from the sitewide
// per-ServiceLine Service nodes lib/seo.ts siteGraphLd already emits without an @id (the
// two coexist by construction, see that module's doc comment).
//
// Covers:
//   - byte-exact node shape (stable key order) for a full input and a minimal one;
//   - the url gate: a falsy url (a domain-less preview build) returns null;
//   - the claims wall, via withRatingLd's own guard: no rating, or a rating with
//     reviewCount 0 or a non-finite value, emits NO aggregateRating key;
//   - reviews fold as Review items only when they are real (a non-empty array);
//   - serviceType is omitted when the input carries no key;
//   - areaServed is omitted when the input passes null (the areaServedLd claims-wall
//     return value for a business with no serviceArea and no serviceArea sections).
// =============================================================================

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const MODULE_PATH = join(ROOT, "lib", "service-page-ld.mjs");

const mod = await import("file://" + MODULE_PATH);
const { servicePageLd } = mod;

let passed = 0, failed = 0;
const ok = (name, cond) => { if (cond) { passed++; console.log("  ok  " + name); } else { failed++; console.log("FAIL  " + name); } };
const eq = (name, a, b) => ok(name + " (" + JSON.stringify(a) + ")", a === b);

const FULL_INPUT = {
  url: "https://fairviewelevator.example.com/services/periodic-testing",
  orgId: "https://fairviewelevator.example.com/#organization",
  name: "Periodic Testing",
  description: "State-mandated periodic testing for passenger and freight units.",
  serviceType: "periodicTesting",
  areaServed: [{ "@type": "Place", name: "Kitsap County" }],
  rating: { ratingValue: 4.9, reviewCount: 21 },
  reviews: [{ author: "R. Alvarez", rating: 5, body: "On time, thorough." }],
};

// ================= 1. full input: byte-exact shape, key order included =================
function testFullShape() {
  console.log("\n# servicePageLd: byte-exact shape for a full input, key order included");
  const ld = servicePageLd(FULL_INPUT);
  eq(
    "the node matches byte-for-byte",
    JSON.stringify(ld),
    '{"@context":"https://schema.org","@type":"Service","@id":"https://fairviewelevator.example.com/services/periodic-testing#service","name":"Periodic Testing","description":"State-mandated periodic testing for passenger and freight units.","url":"https://fairviewelevator.example.com/services/periodic-testing","provider":{"@id":"https://fairviewelevator.example.com/#organization"},"serviceType":"periodicTesting","areaServed":[{"@type":"Place","name":"Kitsap County"}],"aggregateRating":{"@type":"AggregateRating","ratingValue":4.9,"reviewCount":21,"bestRating":5,"worstRating":1},"review":[{"@type":"Review","author":{"@type":"Person","name":"R. Alvarez"},"reviewRating":{"@type":"Rating","ratingValue":5,"bestRating":5,"worstRating":1},"reviewBody":"On time, thorough."}]}',
  );
}

// ================= 2. minimal input: only the required fields =================
function testMinimalShape() {
  console.log("\n# servicePageLd: minimal input omits every optional key");
  const ld = servicePageLd({
    url: "https://example.com/services/repair",
    orgId: "https://example.com/#organization",
    name: "Repair",
  });
  eq(
    "no description, serviceType, areaServed, aggregateRating, or review key",
    JSON.stringify(ld),
    '{"@context":"https://schema.org","@type":"Service","@id":"https://example.com/services/repair#service","name":"Repair","url":"https://example.com/services/repair","provider":{"@id":"https://example.com/#organization"}}',
  );
  ok("no aggregateRating key", !("aggregateRating" in ld));
  ok("no review key", !("review" in ld));
  ok("no serviceType key", !("serviceType" in ld));
  ok("no areaServed key", !("areaServed" in ld));
  ok("no description key", !("description" in ld));
}

// ================= 3. the url gate =================
function testUrlGate() {
  console.log("\n# servicePageLd: a falsy url (domain-less preview build) emits nothing");
  ok("undefined url -> null", servicePageLd({ ...FULL_INPUT, url: undefined }) === null);
  ok("empty-string url -> null", servicePageLd({ ...FULL_INPUT, url: "" }) === null);
}

// ================= 4. the claims wall (via withRatingLd's own guard) =================
function testClaimsWall() {
  console.log("\n# servicePageLd: no aggregateRating without a real, config-supplied rating");
  const noRating = servicePageLd({ ...FULL_INPUT, rating: undefined, reviews: undefined });
  ok("no rating supplied -> no aggregateRating key", !("aggregateRating" in noRating));
  ok("no rating supplied -> no review key (no reviews either)", !("review" in noRating));

  const zeroCount = servicePageLd({ ...FULL_INPUT, rating: { ratingValue: 4.9, reviewCount: 0 } });
  ok("reviewCount 0 -> no aggregateRating key", !("aggregateRating" in zeroCount));

  const nonFinite = servicePageLd({ ...FULL_INPUT, rating: { ratingValue: NaN, reviewCount: 21 } });
  ok("non-finite ratingValue -> no aggregateRating key", !("aggregateRating" in nonFinite));

  const infiniteCount = servicePageLd({ ...FULL_INPUT, rating: { ratingValue: 4.9, reviewCount: Infinity } });
  ok("non-finite reviewCount -> no aggregateRating key", !("aggregateRating" in infiniteCount));
}

// ================= 5. reviews fold only when real =================
function testReviews() {
  console.log("\n# servicePageLd: review[] folds only from a real, non-empty reviews array");
  const noReviews = servicePageLd({ ...FULL_INPUT, reviews: undefined });
  ok("reviews absent -> no review key", !("review" in noReviews));
  const emptyReviews = servicePageLd({ ...FULL_INPUT, reviews: [] });
  ok("reviews empty -> no review key", !("review" in emptyReviews));
  const withReviews = servicePageLd(FULL_INPUT);
  ok("real reviews -> review[] present with the same length", Array.isArray(withReviews.review) && withReviews.review.length === 1);
}

// ================= 6. serviceType / areaServed omission =================
function testOptionalFieldOmission() {
  console.log("\n# servicePageLd: serviceType omitted when absent, areaServed omitted when null");
  const noServiceType = servicePageLd({ ...FULL_INPUT, serviceType: undefined });
  ok("no serviceType -> key absent", !("serviceType" in noServiceType));
  const nullAreaServed = servicePageLd({ ...FULL_INPUT, areaServed: null });
  ok("null areaServed (the areaServedLd claims-wall return) -> key absent", !("areaServed" in nullAreaServed));
}

// ---- run ----
testFullShape();
testMinimalShape();
testUrlGate();
testClaimsWall();
testReviews();
testOptionalFieldOmission();

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
