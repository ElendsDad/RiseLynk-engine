// ============================================================
// site-engine - review / rating JSON-LD harness (feature-backlog #2)
//
//   node tools/seo-jsonld.test.mjs
//
// Proves the pure review/rating builders in lib/rating-ld.mjs, which lib/seo.ts folds
// into the Organization/LocalBusiness and Product nodes. Same shared-.mjs pattern as
// lib/contact-intake.mjs so the logic is unit-tested in plain Node (no TypeScript
// toolchain). The full end-to-end @graph is additionally proven by the rendered-output
// build check on both demos (the v0.5.0 release practice).
//
// Covers:
//   - ratingIsValid: the claims-wall gate (finite value + at least one counted review).
//   - aggregateRatingLd / reviewLd: correct schema.org shape, sane defaults.
//   - withRatingLd: folds AggregateRating + Review onto a node ONLY from real config,
//     and leaves a node untouched when there is no rating (no invented stars).
// ============================================================

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const MODULE_PATH = join(ROOT, "lib", "rating-ld.mjs");

const mod = await import("file://" + MODULE_PATH);
const { ratingIsValid, aggregateRatingLd, reviewLd, withRatingLd } = mod;

// G3/G4: the software-product + pricing-offer builders (lib/offer-ld.mjs), driven here in
// plain Node the same way. Covers the SoftwareApplication + Offer/AggregateOffer shapes and
// their claims wall (no Offer without a real numeric price, no rating without a real rating).
const OFFER_PATH = join(ROOT, "lib", "offer-ld.mjs");
const offerMod = await import("file://" + OFFER_PATH);
const { tierHasPrice, offerLd, pricingOffersLd, softwareApplicationLd } = offerMod;

let passed = 0, failed = 0;
const ok = (name, cond) => { if (cond) { passed++; console.log("  ok  " + name); } else { failed++; console.log("FAIL  " + name); } };
const eq = (name, a, b) => ok(name + " (" + JSON.stringify(a) + ")", a === b);

// ================= 1. ratingIsValid (the claims-wall gate) =================
function testRatingIsValid() {
  console.log("\n# ratingIsValid: only a real rating (finite value + counted reviews) passes");
  ok("a real rating passes", ratingIsValid({ ratingValue: 4.8, reviewCount: 63 }));
  ok("undefined fails", !ratingIsValid(undefined));
  ok("null fails", !ratingIsValid(null));
  ok("zero reviewCount fails (nothing to average)", !ratingIsValid({ ratingValue: 5, reviewCount: 0 }));
  ok("missing reviewCount fails", !ratingIsValid({ ratingValue: 5 }));
  ok("non-numeric ratingValue fails", !ratingIsValid({ ratingValue: "great", reviewCount: 10 }));
  ok("NaN ratingValue fails", !ratingIsValid({ ratingValue: NaN, reviewCount: 10 }));
}

// ================= 2. aggregateRatingLd shape =================
function testAggregateShape() {
  console.log("\n# aggregateRatingLd: correct schema.org shape + defaults");
  const ld = aggregateRatingLd({ ratingValue: 4.7, reviewCount: 18 });
  eq("type is AggregateRating", ld["@type"], "AggregateRating");
  eq("ratingValue carried", ld.ratingValue, 4.7);
  eq("reviewCount carried", ld.reviewCount, 18);
  eq("bestRating defaults to 5", ld.bestRating, 5);
  eq("worstRating defaults to 1", ld.worstRating, 1);
  const ld2 = aggregateRatingLd({ ratingValue: 4, reviewCount: 9, bestRating: 10, worstRating: 0 });
  eq("bestRating override honored", ld2.bestRating, 10);
  eq("worstRating override honored", ld2.worstRating, 0);
}

// ================= 3. reviewLd shape =================
function testReviewShape() {
  console.log("\n# reviewLd: Review node with Rating, optional body/date");
  const ld = reviewLd({ author: "Dana R.", rating: 5, body: "Great work.", date: "2026-05-14" });
  eq("type is Review", ld["@type"], "Review");
  eq("author is a Person", ld.author["@type"], "Person");
  eq("author name carried", ld.author.name, "Dana R.");
  eq("reviewRating type", ld.reviewRating["@type"], "Rating");
  eq("reviewRating value", ld.reviewRating.ratingValue, 5);
  eq("reviewRating bestRating default", ld.reviewRating.bestRating, 5);
  eq("reviewBody carried", ld.reviewBody, "Great work.");
  eq("datePublished carried", ld.datePublished, "2026-05-14");

  // Optional fields are omitted when not supplied (nothing invented).
  const bare = reviewLd({ author: "Anon", rating: 4 });
  ok("no reviewBody when body absent", !("reviewBody" in bare));
  ok("no datePublished when date absent", !("datePublished" in bare));
}

// ================= 4. withRatingLd: emit only from real config =================
function testWithRating() {
  console.log("\n# withRatingLd: folds nodes ONLY from real ratings (claims wall)");
  // A node WITH a real rating + reviews gets both.
  const node = { "@type": "LocalBusiness", name: "Northgate" };
  withRatingLd(node, { ratingValue: 4.8, reviewCount: 63 }, [
    { author: "Dana R.", rating: 5, body: "On time.", date: "2026-05-14" },
    { author: "Marcus T.", rating: 5 },
  ]);
  ok("aggregateRating attached", Boolean(node.aggregateRating));
  eq("aggregateRating value", node.aggregateRating.ratingValue, 4.8);
  ok("review array attached", Array.isArray(node.review) && node.review.length === 2);
  eq("first review author", node.review[0].author.name, "Dana R.");

  // A node with NO rating and NO reviews is left untouched: no invented stars.
  const empty = { "@type": "Organization", name: "No Ratings Co" };
  withRatingLd(empty, undefined, undefined);
  ok("no aggregateRating when none supplied", !("aggregateRating" in empty));
  ok("no review when none supplied", !("review" in empty));

  // A zero-count rating (not real) does NOT emit an aggregate, even if reviews exist.
  const partial = { "@type": "Organization", name: "Edge Co" };
  withRatingLd(partial, { ratingValue: 5, reviewCount: 0 }, [{ author: "Solo", rating: 5 }]);
  ok("zero-count rating emits no aggregateRating", !("aggregateRating" in partial));
  ok("but real review items still emit", Array.isArray(partial.review) && partial.review.length === 1);

  // Same node returned for chaining.
  const chained = { "@type": "Product" };
  ok("returns the same node", withRatingLd(chained, undefined, undefined) === chained);
}

// ================= 5. tierHasPrice (the offer claims-wall gate) =================
function testTierHasPrice() {
  console.log("\n# tierHasPrice: only a tier with a finite numeric priceValue is offerable");
  ok("a priced tier passes", tierHasPrice({ name: "Standard", priceValue: 39 }));
  ok("a real zero-price plan passes", tierHasPrice({ name: "Free", priceValue: 0 }));
  ok("undefined fails", !tierHasPrice(undefined));
  ok("a Custom / quote plan (no priceValue) fails", !tierHasPrice({ name: "Enterprise", price: "Custom" }));
  ok("non-numeric priceValue fails", !tierHasPrice({ name: "X", priceValue: "39" }));
  ok("NaN priceValue fails", !tierHasPrice({ name: "X", priceValue: NaN }));
}

// ================= 6. offerLd shape =================
function testOfferShape() {
  console.log("\n# offerLd: Offer node with a 2-dp price, currency, optional url");
  const ld = offerLd({ name: "Pro", priceValue: 59, url: "https://x/contact" }, "usd");
  eq("type is Offer", ld["@type"], "Offer");
  eq("name carried", ld.name, "Pro");
  eq("price is a 2-dp string", ld.price, "59.00");
  eq("currency defaulted + uppercased", ld.priceCurrency, "USD");
  eq("url carried", ld.url, "https://x/contact");
  const eur = offerLd({ name: "Pro", priceValue: 10, priceCurrency: "eur" }, "usd");
  eq("tier currency overrides the default", eur.priceCurrency, "EUR");
  const bare = offerLd({ name: "Solo", priceValue: 5 });
  ok("no url when absent", !("url" in bare));
  eq("currency falls back to USD with no default", bare.priceCurrency, "USD");
}

// ================= 7. pricingOffersLd (claims wall + single / aggregate) =================
function testPricingOffers() {
  console.log("\n# pricingOffersLd: claims-walled Offer / AggregateOffer from tiers");
  const std = { name: "Standard", priceValue: 39, url: "https://x/contact" };
  const pro = { name: "Pro", priceValue: 59 };
  const ent = { name: "Enterprise", price: "Custom" }; // no priceValue -> never an Offer

  // No priced tier -> undefined (invent nothing).
  ok("no offers when nothing is priced", pricingOffersLd([ent], "usd") === undefined);
  ok("no offers for an empty list", pricingOffersLd([], "usd") === undefined);
  ok("no offers for undefined", pricingOffersLd(undefined, "usd") === undefined);

  // Exactly one priced tier -> a single Offer (not an AggregateOffer).
  const one = pricingOffersLd([std, ent], "usd");
  eq("single priced tier -> Offer", one["@type"], "Offer");
  eq("single Offer price", one.price, "39.00");

  // Two or more priced tiers -> AggregateOffer with low/high/offerCount + offers[].
  const agg = pricingOffersLd([std, pro, ent], "usd");
  eq("multiple priced tiers -> AggregateOffer", agg["@type"], "AggregateOffer");
  eq("lowPrice is the cheapest", agg.lowPrice, "39.00");
  eq("highPrice is the dearest", agg.highPrice, "59.00");
  eq("offerCount is the total plan count", agg.offerCount, 3);
  ok("offers[] carries only priced tiers (Custom excluded)", Array.isArray(agg.offers) && agg.offers.length === 2);
  eq("currency carried on the aggregate", agg.priceCurrency, "USD");
}

// ================= 8. softwareApplicationLd shape =================
function testSoftwareApplication() {
  console.log("\n# softwareApplicationLd: SoftwareApplication node shape + defaults");
  const offers = pricingOffersLd([{ name: "Standard", priceValue: 39 }, { name: "Pro", priceValue: 59 }], "usd");
  const ld = softwareApplicationLd({
    id: "https://x/#software",
    name: "RiseLynk",
    description: "Offline-first maintenance software.",
    url: "https://x",
    providerId: "https://x/#organization",
    offers,
  });
  eq("type is SoftwareApplication", ld["@type"], "SoftwareApplication");
  eq("@id carried", ld["@id"], "https://x/#software");
  eq("name carried", ld.name, "RiseLynk");
  eq("applicationCategory defaults to BusinessApplication", ld.applicationCategory, "BusinessApplication");
  eq("operatingSystem defaults to Web", ld.operatingSystem, "Web");
  eq("description carried", ld.description, "Offline-first maintenance software.");
  eq("url carried", ld.url, "https://x");
  eq("provider is an @id ref back to the org", ld.provider["@id"], "https://x/#organization");
  eq("offers attached (AggregateOffer)", ld.offers["@type"], "AggregateOffer");

  // Overrides honored, and a minimal node stays minimal (nothing invented).
  const ov = softwareApplicationLd({ name: "X", applicationCategory: "WebApplication", operatingSystem: "iOS, Android" });
  eq("applicationCategory override", ov.applicationCategory, "WebApplication");
  eq("operatingSystem override", ov.operatingSystem, "iOS, Android");
  ok("no offers key when none supplied", !("offers" in ov));
  ok("no provider when none supplied", !("provider" in ov));
  ok("no description when none supplied", !("description" in ov));
}

// ================= 9. software node claims wall (no Offer / no rating without config) =========
function testSoftwareClaimsWall() {
  console.log("\n# SoftwareApplication + withRatingLd: no Offer and no rating without config");
  // No priced tier -> no offers on the node.
  const noPrice = softwareApplicationLd({ name: "RiseLynk", offers: pricingOffersLd([{ name: "Enterprise", price: "Custom" }], "usd") });
  ok("no offers when no tier is priced", !("offers" in noPrice));

  // withRatingLd folds NO AggregateRating when the product has no real rating.
  const node = softwareApplicationLd({ name: "RiseLynk" });
  withRatingLd(node, undefined, undefined);
  ok("no aggregateRating without a real rating", !("aggregateRating" in node));

  // The positive case: a real rating IS folded on.
  const rated = softwareApplicationLd({ name: "RiseLynk" });
  withRatingLd(rated, { ratingValue: 4.8, reviewCount: 40 }, undefined);
  ok("a real rating is emitted", Boolean(rated.aggregateRating) && rated.aggregateRating.ratingValue === 4.8);
}

// ---- run ----
testRatingIsValid();
testAggregateShape();
testReviewShape();
testWithRating();
testTierHasPrice();
testOfferShape();
testPricingOffers();
testSoftwareApplication();
testSoftwareClaimsWall();

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
