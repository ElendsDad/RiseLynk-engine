// ============================================================
// site-engine - visible star-rating model (local-trades conversion batch, deliverable 2)
//
// Pure, dependency-free helpers behind the visible reviews surface: the star row
// (components/StarRating.tsx) and the business-reviews block in
// components/sections/Testimonials.tsx. Same shared-.mjs pattern as lib/rating-ld.mjs:
// the TypeScript app imports this module AND tools/stars.test.mjs drives it in plain
// Node, so the logic is unit-tested without a TypeScript toolchain.
//
// CLAIMS WALL: stars render ONLY a value the config supplied. starModel() returns
// null for anything that is not a real positive rating, so the engine never draws a
// default or invented star. ratingSummaryLine() gates on ratingIsValid() from
// ./rating-ld.mjs, so the one claims-wall gate covers the JSON-LD AND the visible
// surface.
//
// Plain ESM (no TypeScript annotations); JSDoc gives the TS callers a signature.
// ============================================================

import { ratingIsValid } from "./rating-ld.mjs";

/** @typedef {import("./rating-ld.mjs").RatingFacts} RatingFacts */
/** @typedef {{ value: number, best: number, full: number, half: number, empty: number }} StarModel */

// The draw plan for a star row: the supplied value clamped to [0, best] and quantized
// to half-star steps, rounding half up (4.24 shows 4 full, 4.25 gains the half, 4.75
// rounds to the next full). `value` stays the clamped as-supplied number (what the
// accessible label reads); full/half/empty is the quantized render, and
// full + half + empty === best. Claims wall: a non-finite value, a non-positive or
// non-finite best, or a value <= 0 returns null (no stars for data the config did
// not supply).
/** @param {number} value @param {number} [best] @returns {StarModel | null} */
export function starModel(value, best = 5) {
  if (!Number.isFinite(value) || value <= 0) return null;
  if (!Number.isFinite(best) || best <= 0) return null;
  const clamped = Math.min(Math.max(value, 0), best);
  const halves = Math.round(clamped * 2); // half-star steps, round half up
  const full = Math.floor(halves / 2);
  const half = halves % 2;
  return { value: clamped, best, full, half, empty: best - full - half };
}

// The accessible text for a star row, e.g. "Rated 4.8 out of 5". Reads the clamped
// as-supplied value (never the quantized draw), and null-guards through starModel so
// an invalid rating yields no label either.
/** @param {number} value @param {number} [best] @returns {string | null} */
export function starAriaLabel(value, best = 5) {
  const model = starModel(value, best);
  return model ? `Rated ${model.value} out of ${model.best}` : null;
}

// The one-line visible summary of a business rating, e.g. "4.8 out of 5 from 63
// reviews". Gated on ratingIsValid (the same claims wall the JSON-LD passes
// through): a missing, zero-count, or non-finite rating yields null and no line.
/** @param {RatingFacts | undefined | null} rating @returns {string | null} */
export function ratingSummaryLine(rating) {
  if (!ratingIsValid(rating)) return null;
  const best = rating.bestRating ?? 5;
  const noun = rating.reviewCount === 1 ? "review" : "reviews";
  return `${rating.ratingValue} out of ${best} from ${rating.reviewCount} ${noun}`;
}
