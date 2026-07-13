// =============================================================================
// BLOG GOVERNANCE CHECK (site-engine R2) - the article-content gate for the hosted blog.
//
//   node tools/blog-check.mjs <config.json | articles.json> [--trace out.json] [--quiet]
//
// A blog article is client-facing copy, so it is held to the SAME copy discipline as every
// scaffold string the engine emits, plus a per-article claims wall. Until R2 the banned-phrase
// lint only reached article prose incidentally, when an article was seeded THROUGH the hydrator
// (tools/hydrate.mjs runs lintConfig over the whole hydrated config). A hand-authored config
// (the Kitsap client-site path) or an article dropped straight into blog.articles[] was never
// gated. This module closes that gap: it applies the lint and a claims trace to ARTICLE BODIES
// specifically, as a first-class, named release gate, over any config shape.
//
// It reuses lintString / collectStrings from the blessed lint surface (tools/lint-config.mjs),
// which re-exports the one implementation in hydrate.mjs, so the blog gate can NEVER drift from
// the scaffold gate: one regex set, two entry points.
//
// TWO checks run over every article's string leaves (title, description, eyebrow, lede, author,
// summary.*, body, faqs.*):
//   1. COPY DISCIPLINE - no em/en dashes, no marketing hype. A violation FAILS the run.
//   2. THE CLAIMS WALL - no compliance claim ("compliant" / "certified" / "inspection-ready" /
//      "meets the standard"), no guarantee, and no code-requirement stated as settled fact
//      ("required by code", "up to code", ...). These are the assertions an article must not
//      make unless the business attests them and the copy hedges them to the authority having
//      jurisdiction; the engine treats them as unattested claims. A violation FAILS the run.
//
// It also writes a CLAIMS TRACE (blog-claims-trace.json): per article, the byline that stands
// behind it, its date, draft status, the count of strings scanned, and the wall result. That
// trace is the evidence an article cleared the wall, mirroring the hydrator's claims-trace.json.
//
// Drafts are scanned too: a draft carries noindex but stays reachable at its direct URL for
// review, so it must be just as claims-safe as a published article.
//
// Deterministic and dependency-free (node built-ins only), like the rest of tools/.
// =============================================================================

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, extname, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// The shared lint primitives. Importing from lint-config.mjs (not hydrate.mjs) keeps this on
// the blessed, stable surface; lint-config re-exports the hydrator's implementation verbatim.
import { lintString, collectStrings } from "./lint-config.mjs";

// -----------------------------------------------------------------------------
// Rule categories. Every rule lintString can emit is one of these two families, so a
// violation reports whether it is a copy-discipline slip or a claims-wall breach.
// -----------------------------------------------------------------------------

// The claims wall: compliance claims, guarantees, and unhedged code-requirement claims. These
// are factual assertions an article may not make unless attested and AHJ-hedged. Everything
// else lintString emits ("dash", "hype:*") is a copy-discipline slip; an unknown rule falls to
// copy-discipline too (fail-safe: still a violation, still fails the run).
function ruleCategory(rule) {
  if (rule.startsWith("banned-claim:") || rule.startsWith("code-claim:")) return "claims-wall";
  return "copy-discipline";
}

// -----------------------------------------------------------------------------
// Per-article lint. Walks the article's own string leaves (so the path is rooted at the
// article, e.g. blog.articles[my-slug].body) and lints each, tagging every violation with
// its category.
// -----------------------------------------------------------------------------

export function lintArticle(article) {
  const slug =
    article && typeof article.slug === "string" && article.slug.trim() ? article.slug.trim() : "(no slug)";
  const strings = collectStrings(article, `blog.articles[${slug}]`);
  const violations = [];
  for (const { path, value } of strings) {
    for (const v of lintString(value)) {
      violations.push({ path, rule: v.rule, match: v.match, category: ruleCategory(v.rule) });
    }
  }
  return { slug, stringsScanned: strings.length, violations };
}

// A trace record for one article: the attestation surface that exists (byline + date), the
// draft flag, how many strings were scanned, and the wall result. No schema change is needed;
// the trace reads the article's existing fields. It is evidence the article cleared the wall.
function traceForArticle(article, lint) {
  const claimsWall = lint.violations.filter((v) => v.category === "claims-wall");
  const copyDiscipline = lint.violations.filter((v) => v.category === "copy-discipline");
  return {
    slug: lint.slug,
    title: typeof article.title === "string" ? article.title : null,
    draft: article.draft === true,
    byline: typeof article.author === "string" && article.author.trim() ? article.author.trim() : null,
    date: typeof article.date === "string" && article.date.trim() ? article.date.trim() : null,
    stringsScanned: lint.stringsScanned,
    claimsWall: claimsWall.length ? "FAIL" : "clean",
    copyDiscipline: copyDiscipline.length ? "FAIL" : "clean",
    violations: lint.violations,
  };
}

// -----------------------------------------------------------------------------
// Whole-blog check. Pulls the article list out of whatever shape it was handed (a full site
// config, a { articles: [...] } object, or a bare array), lints every article, and assembles
// the claims trace. Returns { articleCount, stringsScanned, violations, trace }.
// -----------------------------------------------------------------------------

export function articlesFrom(input) {
  if (Array.isArray(input)) return input;
  if (input && typeof input === "object") {
    if (input.blog && Array.isArray(input.blog.articles)) return input.blog.articles;
    if (Array.isArray(input.articles)) return input.articles;
  }
  throw new Error("no blog.articles[] found (pass a site config, a { articles: [...] } object, or an array)");
}

export function checkBlog(input) {
  const articles = articlesFrom(input);
  const violations = [];
  const traceArticles = [];
  let stringsScanned = 0;

  articles.forEach((article, i) => {
    const a = article && typeof article === "object" ? article : {};
    const lint = lintArticle(a);
    stringsScanned += lint.stringsScanned;
    const label = lint.slug === "(no slug)" ? `#${i}` : lint.slug;
    for (const v of lint.violations) violations.push({ article: label, ...v });
    traceArticles.push(traceForArticle(a, lint));
  });

  return {
    articleCount: articles.length,
    stringsScanned,
    violations,
    trace: {
      generatedAt: new Date().toISOString(),
      articleCount: articles.length,
      stringsScanned,
      violationCount: violations.length,
      articles: traceArticles,
    },
  };
}

// -----------------------------------------------------------------------------
// CLI.
// -----------------------------------------------------------------------------

function loadInput(file) {
  const abs = resolve(file);
  const ext = extname(abs).toLowerCase();
  if (ext !== ".json") {
    throw new Error(
      `unsupported input "${ext}". Pass a .json config / articles file, or import { checkBlog } ` +
        `from tools/blog-check.mjs and call it on a config object your TypeScript pipeline loaded.`,
    );
  }
  return JSON.parse(readFileSync(abs, "utf8"));
}

function runCli(argv) {
  const positional = argv.filter((a) => !a.startsWith("--"));
  const flags = new Set(argv.filter((a) => a.startsWith("--")));
  const traceIdx = argv.indexOf("--trace");
  const traceOut = traceIdx >= 0 ? argv[traceIdx + 1] : null;
  const quiet = flags.has("--quiet");

  const file = positional[0];
  if (!file) {
    console.error("Usage: node tools/blog-check.mjs <config.json | articles.json> [--trace out.json] [--quiet]");
    process.exit(2);
  }

  let result;
  try {
    result = checkBlog(loadInput(file));
  } catch (err) {
    console.error(`blog-check: ${err.message}`);
    process.exit(2);
  }

  // Write the claims trace alongside the input (or to --trace), so the run leaves evidence.
  const tracePath = traceOut ? resolve(traceOut) : join(dirname(resolve(file)), "blog-claims-trace.json");
  writeFileSync(tracePath, JSON.stringify(result.trace, null, 2) + "\n", "utf8");

  if (result.violations.length) {
    console.error(
      `\nBLOG GOVERNANCE CHECK FAILED (${result.violations.length} violation(s) across ` +
        `${result.stringsScanned} article strings in ${result.articleCount} article(s)):`,
    );
    for (const v of result.violations) {
      console.error(`  - [${v.category}: ${v.rule}] "${v.match}" at ${v.path}`);
    }
    console.error(`  claims trace -> ${tracePath}`);
    process.exit(1);
  }

  if (!quiet) {
    console.log(
      `blog check clean: ${result.articleCount} article(s), ${result.stringsScanned} strings, 0 violations`,
    );
    console.log(`  claims trace -> ${tracePath}`);
  }
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) runCli(process.argv.slice(2));
