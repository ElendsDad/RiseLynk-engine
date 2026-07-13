// ============================================================
// site-engine - review / rating JSON-LD builders (feature-backlog #2)
//
// Pure, dependency-free schema.org builders for AggregateRating and Review,
// shared by lib/seo.ts (which folds them into the Organization/LocalBusiness and
// Product nodes) and tools/seo-jsonld.test.mjs (which drives them in plain Node).
// This mirrors the lib/contact-intake.mjs shared-core pattern: one .mjs the app
// imports through TypeScript AND the Node harness imports directly, so the logic
// is unit-tested without a TypeScript toolchain.
//
// CLAIMS WALL: these builders emit ONLY what the config supplies. ratingIsValid()
// is the single gate every caller checks first, so a site with no real rating
// emits no AggregateRating and the engine never invents a star value or a review.
//
// Plain ESM (no TypeScript annotations); JSDoc gives the TS callers a signature.
// ============================================================

/** @typedef {{ ratingValue: number, reviewCount: number, bestRating?: number, worstRating?: number }} RatingFacts */
/** @typedef {{ author: string, rating: number, body?: string, date?: string, bestRating?: number }} ReviewItem */

// A rating is emittable only when it carries a finite average AND at least one
// counted review. A zero-count, missing, or non-numeric rating emits nothing, so
// a business that supplied no real rating never ships an AggregateRating.
/** @param {RatingFacts | undefined | null} rating @returns {boolean} */
export function ratingIsValid(rating) {
  return Boolean(
    rating &&
      Number.isFinite(rating.ratingValue) &&
      Number.isFinite(rating.reviewCount) &&
      rating.reviewCount > 0,
  );
}

// The AggregateRating sub-object. Caller must have passed ratingIsValid() first.
/** @param {RatingFacts} rating @returns {Record<string, unknown>} */
export function aggregateRatingLd(rating) {
  return {
    "@type": "AggregateRating",
    ratingValue: rating.ratingValue,
    reviewCount: rating.reviewCount,
    bestRating: rating.bestRating ?? 5,
    worstRating: rating.worstRating ?? 1,
  };
}

// One Review node from a real review item. Body and date are emitted only when
// the config supplies them (nothing invented).
/** @param {ReviewItem} review @returns {Record<string, unknown>} */
export function reviewLd(review) {
  /** @type {Record<string, unknown>} */
  const ld = {
    "@type": "Review",
    author: { "@type": "Person", name: review.author },
    reviewRating: {
      "@type": "Rating",
      ratingValue: review.rating,
      bestRating: review.bestRating ?? 5,
      worstRating: 1,
    },
  };
  if (review.body) ld.reviewBody = review.body;
  if (review.date) ld.datePublished = review.date;
  return ld;
}

// Fold aggregateRating + review[] onto a node object IN PLACE, but only for the
// facts the config actually provides. Returns the same node for chaining. The
// claims-wall guard lives here in ONE place, so the org and product builders in
// lib/seo.ts cannot drift from it. Only real review items become Review nodes.
/**
 * @param {Record<string, unknown>} node
 * @param {RatingFacts | undefined} [rating]
 * @param {ReviewItem[] | undefined} [reviews]
 * @returns {Record<string, unknown>}
 */
export function withRatingLd(node, rating, reviews) {
  if (ratingIsValid(rating)) node.aggregateRating = aggregateRatingLd(rating);
  if (Array.isArray(reviews) && reviews.length) node.review = reviews.map(reviewLd);
  return node;
}
