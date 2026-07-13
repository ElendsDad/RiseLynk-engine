// =============================================================================
// DoD proof for the blog governance check (site-engine R2).
//
//   node tools/blog-check.test.mjs
//
// Covers the R2 acceptance:
//   - the banned-phrase lint and the claims trace run over ARTICLE CONTENT (body, summary,
//     faqs, ...), not just scaffold strings;
//   - the check FAILS on a seeded bad article - both a banned phrase (copy discipline) and
//     an unattested claim (the claims wall) - and PASSES on a clean one;
//   - real elevator-demo article prose (the hydrated v0.4.0 bundle) passes cleanly;
//   - the blog gate reuses the SAME lint the hydrator runs (it can never drift);
//   - the claims trace records a per-article attestation surface (byline, date, result).
//
// Zero dependencies: node:assert only. Exit code is non-zero on any failure.
// =============================================================================

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { checkBlog, lintArticle, articlesFrom } from "./blog-check.mjs";
// Prove the blog gate rides the ONE shared lint implementation (no second regex set).
import { lintString as blogLintString } from "./lint-config.mjs";
import { lintString as hydrateLintString } from "./hydrate.mjs";
import { hydrate } from "./hydrate.mjs";

const here = dirname(fileURLToPath(import.meta.url));
// The v0.4.0 bundle carries real elevator-demo article prose (two valid articles, one draft).
const bundleDir = resolve(here, "../examples/elevator-demo/v0.4.0-bundle/summit-vertical/2026-07-10T183000Z");
const bundle = JSON.parse(readFileSync(join(bundleDir, "snapshot.json"), "utf8"));

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

// A minimally complete, claims-safe article. Its body hedges the one code question to the AHJ,
// exactly the shape the runbook requires. Reused as the clean baseline below.
const cleanArticle = {
  slug: "reading-your-service-history",
  title: "Reading your service history",
  description: "How to read the maintenance log, test records, and written program kept per unit.",
  eyebrow: "For building owners",
  date: "2026-07-10",
  author: "Summit Vertical Services",
  lede: "Your service history is three documents kept per unit. Here is how to read them.",
  summary: {
    label: "The short version",
    intro: "A well-kept program keeps three things together per unit:",
    ordered: false,
    points: [
      "A dated maintenance log of what was done on the unit.",
      "The records for the periodic safety tests it is due for.",
      "The written maintenance program document itself.",
    ],
  },
  body: [
    "## Three documents, one unit",
    "A dated maintenance log, the periodic test records, and the written program belong together per unit, so a question about one elevator can be answered in one step.",
    "Which tests apply, and how often, depends on what your jurisdiction has adopted. Your authority having jurisdiction and your contractor confirm what applies to your building.",
  ].join("\n\n"),
  faqs: [
    {
      q: "Do the records stay with my building?",
      a: "They should. The program describes your equipment, so it should travel with the building rather than disappear when a service contract ends.",
    },
  ],
};

// -----------------------------------------------------------------------------
// The lint + claims trace run over ARTICLE CONTENT.
// -----------------------------------------------------------------------------

test("scans article content, not just scaffold: body/summary/faqs strings are counted", () => {
  const lint = lintArticle(cleanArticle);
  assert.ok(lint.stringsScanned > 10, `expected the whole article walked, got ${lint.stringsScanned}`);
  // The paths are rooted at the article, and the body + a faq answer are among them.
  const strings = lint.violations; // clean -> none; use a dirty probe below for path shape
  assert.deepEqual(strings, [], "the clean article must produce no violations");
});

test("real elevator-demo article prose (hydrated v0.4.0 bundle) passes the blog check", () => {
  const { config } = hydrate(bundle, { bundleDir });
  assert.ok(config.blog.articles.length >= 2, "the bundle seeds real articles");
  const res = checkBlog(config);
  assert.equal(res.violations.length, 0, `real article prose must pass; got ${JSON.stringify(res.violations)}`);
  assert.ok(res.stringsScanned > 20, "the check walked real article strings");
  assert.equal(res.trace.articles.length, config.blog.articles.length, "every article is traced");
});

// -----------------------------------------------------------------------------
// FAILS on a seeded bad article: copy discipline AND the claims wall.
// -----------------------------------------------------------------------------

test("FAILS on a banned hype phrase in an article body (copy discipline)", () => {
  const bad = { ...cleanArticle, slug: "bad-hype", body: "We are the world-class name in elevator service." };
  const res = checkBlog({ blog: { articles: [bad] } });
  assert.ok(res.violations.length > 0, "a hype phrase in the body must fail the check");
  const v = res.violations.find((x) => x.rule.startsWith("hype:"));
  assert.ok(v, `expected a hype violation; got ${JSON.stringify(res.violations)}`);
  assert.equal(v.category, "copy-discipline", "hype is a copy-discipline slip");
  assert.match(v.path, /blog\.articles\[bad-hype\]\.body/, "the violation path points at the article body");
});

test("FAILS on an em dash in an article body (copy discipline)", () => {
  const bad = { ...cleanArticle, slug: "bad-dash", lede: "We do it right — every time." };
  const res = checkBlog([bad]);
  const v = res.violations.find((x) => x.rule === "dash");
  assert.ok(v, "an em dash must fail the check");
  assert.equal(v.category, "copy-discipline");
});

test("FAILS on an unattested compliance claim in an article body (claims wall)", () => {
  const bad = { ...cleanArticle, slug: "bad-claim", body: "Our work always meets the standard for your building." };
  const res = checkBlog({ blog: { articles: [bad] } });
  const v = res.violations.find((x) => x.rule === "banned-claim:meets-the-standard");
  assert.ok(v, `expected the claims wall to fire; got ${JSON.stringify(res.violations)}`);
  assert.equal(v.category, "claims-wall", "a compliance claim is a claims-wall breach");
});

test("FAILS on an unhedged code-requirement claim in an article body (claims wall)", () => {
  const bad = { ...cleanArticle, slug: "bad-code", body: "This upgrade is required by code, so schedule it now." };
  const res = checkBlog([bad]);
  const v = res.violations.find((x) => x.rule.startsWith("code-claim:"));
  assert.ok(v, "an unhedged code claim must fire the wall");
  assert.equal(v.category, "claims-wall");
});

test("FAILS on a claim buried in a FAQ answer (the whole article surface is walled)", () => {
  const bad = {
    ...cleanArticle,
    slug: "bad-faq",
    faqs: [{ q: "Are your technicians qualified?", a: "Yes, our technicians are certified for every job." }],
  };
  const res = checkBlog([bad]);
  const v = res.violations.find((x) => x.rule === "banned-claim:certified");
  assert.ok(v, "a claim in a faq answer must fail");
  assert.match(v.path, /faqs\[0\]\.a/, "the path locates the faq answer");
});

// -----------------------------------------------------------------------------
// PASSES on a clean article, and the claims trace records the attestation surface.
// -----------------------------------------------------------------------------

test("PASSES on a clean, AHJ-hedged article and records the claims trace", () => {
  const res = checkBlog([cleanArticle]);
  assert.equal(res.violations.length, 0, "the clean article must pass");
  assert.equal(res.trace.articles.length, 1);
  const t = res.trace.articles[0];
  assert.equal(t.slug, "reading-your-service-history");
  assert.equal(t.byline, "Summit Vertical Services", "the trace records who stands behind the article");
  assert.equal(t.date, "2026-07-10", "the trace records the article date");
  assert.equal(t.claimsWall, "clean");
  assert.equal(t.copyDiscipline, "clean");
  assert.ok(t.stringsScanned > 10, "the trace records how many strings were walled");
});

test("a draft article is scanned too (reachable at its URL, so still walled)", () => {
  const draftBad = { ...cleanArticle, slug: "draft-bad", draft: true, body: "A certified, world-class draft." };
  const res = checkBlog([draftBad]);
  assert.ok(res.violations.length >= 2, "a draft is not exempt from the wall");
  assert.equal(res.trace.articles[0].draft, true, "the trace marks it a draft");
});

// -----------------------------------------------------------------------------
// The blog gate cannot drift from the scaffold gate: one shared lint implementation.
// -----------------------------------------------------------------------------

test("no drift: the blog gate uses the SAME lintString the hydrator runs", () => {
  assert.equal(blogLintString, hydrateLintString, "lintString must be one function, imported two ways");
});

// -----------------------------------------------------------------------------
// Input shapes + guards.
// -----------------------------------------------------------------------------

test("articlesFrom accepts a config, an { articles } object, and a bare array", () => {
  assert.equal(articlesFrom({ blog: { articles: [cleanArticle] } }).length, 1);
  assert.equal(articlesFrom({ articles: [cleanArticle, cleanArticle] }).length, 2);
  assert.equal(articlesFrom([cleanArticle]).length, 1);
  assert.throws(() => articlesFrom({ nope: true }), /no blog\.articles/);
});

test("an empty blog is clean (no articles, no violations)", () => {
  const res = checkBlog({ blog: { articles: [] } });
  assert.equal(res.articleCount, 0);
  assert.equal(res.violations.length, 0);
  assert.equal(res.trace.articles.length, 0);
});

// -----------------------------------------------------------------------------
// runner
// -----------------------------------------------------------------------------

let failed = 0;
for (const { name, fn } of tests) {
  try {
    fn();
    console.log(`  PASS  ${name}`);
  } catch (err) {
    failed++;
    console.error(`  FAIL  ${name}`);
    console.error(`        ${err.message.split("\n").join("\n        ")}`);
  }
}
console.log(`\n${tests.length - failed}/${tests.length} passed`);
process.exit(failed ? 1 : 0);
