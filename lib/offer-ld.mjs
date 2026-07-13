// ============================================================
// site-engine - software-product + offer JSON-LD builders (G3/G4)
//
// Pure, dependency-free schema.org builders for the SoftwareApplication node and
// its Offer / AggregateOffer, shared by lib/seo.ts (which folds them into the site
// @graph for the software-product archetype) and tools/seo-jsonld.test.mjs (which
// drives them in plain Node). Same shared-.mjs pattern as lib/rating-ld.mjs and
// lib/contact-intake.mjs: one .mjs the app imports through TypeScript AND the Node
// harness imports directly, so the claims-wall logic is unit-tested without a
// TypeScript toolchain.
//
// CLAIMS WALL: an Offer is emitted ONLY for a pricing tier that supplies a real,
// finite numeric price (priceValue). A tier priced "Custom" (Enterprise, a quote
// plan) carries no priceValue and emits no Offer, so the engine never invents a
// price it cannot honor. The AggregateRating for the product is walled the same
// way, through withRatingLd in lib/rating-ld.mjs (emit only a real config rating).
//
// Plain ESM (no TypeScript annotations); JSDoc gives the TS callers a signature.
// ============================================================

/** @typedef {{ name: string, price?: string, priceValue?: number, priceCurrency?: string, url?: string }} OfferTier */

// A tier is offerable in structured data only when it carries a finite numeric
// price. The display `price` string ("From $39", "Custom") is never parsed for a
// number: a tier that wants an Offer supplies an explicit priceValue.
/** @param {OfferTier | undefined | null} tier @returns {boolean} */
export function tierHasPrice(tier) {
  return Boolean(tier && Number.isFinite(tier.priceValue));
}

// One Offer node from a tier that passed tierHasPrice(). priceCurrency falls back
// to the passed default (the site's commerce currency), then "USD".
/** @param {OfferTier} tier @param {string} [defaultCurrency] @returns {Record<string, unknown>} */
export function offerLd(tier, defaultCurrency) {
  const currency = (tier.priceCurrency ?? defaultCurrency ?? "usd").toUpperCase();
  /** @type {Record<string, unknown>} */
  const ld = {
    "@type": "Offer",
    name: tier.name,
    price: Number(tier.priceValue).toFixed(2),
    priceCurrency: currency,
  };
  if (tier.url) ld.url = tier.url;
  return ld;
}

// Build the SoftwareApplication's offers from its pricing tiers. Claims-walled:
//   - undefined when NO tier carries a real numeric price (invent nothing)
//   - a single Offer when exactly one tier is priced
//   - an AggregateOffer (lowPrice / highPrice / offerCount + offers[]) for 2+
//     priced tiers. offerCount is the total plan count from config (a real fact:
//     how many plans the site lists), and offers[] carries only the priced ones.
/** @param {OfferTier[] | undefined} tiers @param {string} [defaultCurrency] @returns {Record<string, unknown> | undefined} */
export function pricingOffersLd(tiers, defaultCurrency) {
  const all = Array.isArray(tiers) ? tiers : [];
  const priced = all.filter(tierHasPrice);
  if (!priced.length) return undefined;
  const offers = priced.map((t) => offerLd(t, defaultCurrency));
  if (offers.length === 1) return offers[0];
  const currency = (priced[0].priceCurrency ?? defaultCurrency ?? "usd").toUpperCase();
  const prices = priced.map((t) => Number(t.priceValue));
  return {
    "@type": "AggregateOffer",
    priceCurrency: currency,
    lowPrice: Math.min(...prices).toFixed(2),
    highPrice: Math.max(...prices).toFixed(2),
    offerCount: all.length,
    offers,
  };
}

// The SoftwareApplication node itself, assembled from plain inputs so the pure
// shape is testable in Node. name is required; applicationCategory defaults to
// "BusinessApplication" and operatingSystem to "Web" (a web app). description,
// url, provider (@id ref back to the Organization node), and offers attach only
// when supplied. The AggregateRating is folded on separately by the caller through
// withRatingLd (claims wall), so it is never invented here.
/**
 * @param {{ id?: string, name: string, applicationCategory?: string, operatingSystem?: string, description?: string, url?: string, providerId?: string, offers?: Record<string, unknown> }} input
 * @returns {Record<string, unknown>}
 */
export function softwareApplicationLd(input) {
  /** @type {Record<string, unknown>} */
  const ld = {
    "@type": "SoftwareApplication",
    ...(input.id ? { "@id": input.id } : {}),
    name: input.name,
    applicationCategory: input.applicationCategory ?? "BusinessApplication",
    operatingSystem: input.operatingSystem ?? "Web",
  };
  if (input.description) ld.description = input.description;
  if (input.url) ld.url = input.url;
  if (input.providerId) ld.provider = { "@id": input.providerId };
  if (input.offers) ld.offers = input.offers;
  return ld;
}
