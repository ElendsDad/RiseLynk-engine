// =============================================================================
// SCAFFOLD-COPY LINT - the banned-phrase lint's blind spot, closed (feedback item #36).
//
//   node tools/scaffold-copy.mjs
//
// Every other copy gate lints STRINGS THAT PASS THROUGH A CONFIG: the hydrator lints a
// hydrated config, tools/lint-config.mjs lints a hand-authored one, tools/blog-check.mjs
// lints article bodies. None of them ever see the engine's OWN hardcoded UI copy - the
// literal JSX text in app/ and components/ (labels, error strings, the checkout success
// page) - because that copy never flows through a config object. Item #36 was exactly
// this: the checkout-success page shipped "Thank you!" and no gate could have caught it,
// because no gate ever looked at that file.
//
// This module closes the gap with a lightweight, dependency-free JSX-text-node scan (no
// TS/JSX parser; a regex heuristic tuned against the real tree - see the false-positive
// notes below) over app/ and components/, reusing the SAME lintString the config and blog
// gates use, so scaffold copy is held to the identical banned-phrase / no-dash /
// no-exclamation discipline. A violation FAILS the run.
//
// v0.26.0: also covers customer-facing STRING EMITTERS in lib/ (llms.ts, trust.mjs
// defaults, announcement.mjs defaults). The old "lib/ has no JSX" exclusion let
// lib/llms.ts ship elevator-vertical copy into every trade site's /llms.txt. A second
// pass extracts prose-looking string literals from those emitters and runs lintString,
// plus a vertical-term ban on generic emitters (elevator/escalator/plumber/... must not
// appear as hardcoded engine copy in a trade-neutral emitter).
//
// Deliberately narrow: it extracts only text that LOOKS like literal prose (a JSX text
// node or a literal aria-label/placeholder/title attribute with no embedded expression),
// not every character between two angle brackets - see looksLikeCopy() - so it does not
// choke on TypeScript generics (Record<string, string>), JSX arrow/comparison syntax, or
// multi-line code fragments the naive >...< scan would otherwise pick up.
// =============================================================================

import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { lintString } from "./hydrate.mjs";
export { lintString };

const HERE = dirname(fileURLToPath(import.meta.url));
const ENGINE_ROOT = resolve(HERE, "..");

// The engine's own JSX scaffold lives in these two trees. examples/ stays excluded
// (fixture/demo content, already covered by hydrate/blog gates where it matters).
const SCAFFOLD_DIRS = ["app", "components"];

// Customer-facing string emitters in lib/. Not every lib file: only modules that emit
// visitor-visible or AI-consumed prose from hardcoded literals. Audit note (2026-07-24):
// peers checked and NOT listed (no visitor prose of their own, or structural labels only):
// area-ld, hours-ld (day abbreviations), seo/rating/offer/service-page-ld (JSON-LD keys),
// contact-intake, delivery-guard, csp, content-gate, celebrate, stars, gallery, brand-logo,
// inline-links, jsonld-escape, business-type, theme*, story-graph, section-id, read-time,
// social-icons, icons, style-variant, services. hydrate.mjs elevator copy is intentional
// RiseLynk-tenant hydration (config output), not a generic runtime emitter.
export const LIB_EMITTER_FILES = [
  "lib/llms.ts",
  "lib/trust.mjs",
  "lib/announcement.mjs",
];

// Generic emitters that must stay trade-neutral. Vertical nouns in hardcoded strings
// here are the exact class of leak that put "stopped elevator" on plumber llms.txt.
export const GENERIC_EMITTER_FILES = ["lib/llms.ts", "lib/trust.mjs", "lib/announcement.mjs"];

export const VERTICAL_TERMS = [
  { term: "elevator", re: /\belevators?\b/i },
  { term: "escalator", re: /\bescalators?\b/i },
  { term: "plumber", re: /\bplumbers?\b/i },
  { term: "plumbing", re: /\bplumbing\b/i },
  { term: "hvac", re: /\bhvac\b/i },
  { term: "roofer", re: /\broofers?\b/i },
  { term: "roofing", re: /\broofing\b/i },
];

function walkTsxFiles(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walkTsxFiles(full, acc);
    else if (entry.endsWith(".tsx")) acc.push(full);
  }
  return acc;
}

// A JSX text node: everything between a `>` and the next `<` with no nested tag or brace
// (a brace means it is an expression, e.g. {business.name} or {trust.label}, not literal
// copy - skip it rather than mis-lint half a config-driven string).
const TEXT_NODE_RE = />([^<>{}]+)</g;

// A literal attribute value on the three attributes that carry visible/announced copy.
// title/placeholder/alt on a config-bound value use {...} and never match this pattern.
const ATTR_RE = /\b(?:aria-label|placeholder|title)="([^"{}]+)"/g;

// Reject anything that reads like code rather than prose: multi-line spans (the naive scan
// crossing a real tag boundary), stray punctuation-only fragments, and bare identifier-style
// tokens (camelCase with no space, e.g. a leaked `useState` fragment).
export function looksLikeCopy(raw) {
  const t = raw.trim();
  if (!t) return false;
  if (/[\r\n]/.test(t)) return false;
  if (t.length < 2 || t.length > 200) return false;
  if (/[(){}\\;]/.test(t)) return false;
  if (!/\s/.test(t) && /[a-z][A-Z]/.test(t)) return false;
  return true;
}

// Extract the deduplicated set of literal copy strings from one file's source.
export function extractCopyStrings(content) {
  const out = new Set();
  let m;
  TEXT_NODE_RE.lastIndex = 0;
  while ((m = TEXT_NODE_RE.exec(content))) {
    const t = m[1].trim();
    if (looksLikeCopy(t)) out.add(t);
  }
  ATTR_RE.lastIndex = 0;
  while ((m = ATTR_RE.exec(content))) {
    const t = m[1].trim();
    if (looksLikeCopy(t)) out.add(t);
  }
  return [...out];
}

// Pull prose-looking string / template literals from a .ts/.mjs emitter. Skips import
// paths, short tokens, and template chunks that are only interpolation glue.
const LIB_STRING_RE = /(["'`])((?:\\.|(?!\1)[^\\])*)\1/g;

export function looksLikeLibCopy(raw) {
  const t = raw.trim();
  if (!t) return false;
  if (t.length < 12 || t.length > 300) return false;
  if (!/[a-zA-Z]/.test(t)) return false;
  // Need at least one space (prose) or a sentence-ending punctuation run.
  if (!/\s/.test(t) && !/[.!?]$/.test(t)) return false;
  // Skip paths, URLs, and code-shaped tokens.
  if (/^[\w./@${}-]+$/.test(t) && !/\s/.test(t)) return false;
  if (/^(node:|https?:|application\/|text\/|image\/)/i.test(t)) return false;
  if (/\$\{/.test(t) && t.replace(/\$\{[^}]*\}/g, "").trim().length < 8) return false;
  return true;
}

export function extractLibCopyStrings(content) {
  const out = new Set();
  // Strip block and line comments so doc examples do not trip the gate.
  const stripped = content
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
  let m;
  LIB_STRING_RE.lastIndex = 0;
  while ((m = LIB_STRING_RE.exec(stripped))) {
    const raw = m[2].replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\'/g, "'");
    // Drop template interpolations for the prose check; keep the surrounding words.
    const forCheck = raw.replace(/\$\{[^}]*\}/g, "…");
    if (looksLikeLibCopy(forCheck)) out.add(forCheck.replace(/\s+/g, " ").trim());
  }
  return [...out];
}

export function lintVerticalTerms(string, file) {
  if (!GENERIC_EMITTER_FILES.includes(file)) return [];
  const hits = [];
  for (const v of VERTICAL_TERMS) {
    if (v.re.test(string)) hits.push({ string, rule: `vertical-term:${v.term}`, match: v.term });
  }
  return hits;
}

// Lint one file; returns { file, strings, violations: [{ match: string, rule, matchedText }] }.
export function lintScaffoldFile(absPath) {
  const content = readFileSync(absPath, "utf8");
  const strings = extractCopyStrings(content);
  const violations = [];
  for (const s of strings) {
    for (const v of lintString(s)) violations.push({ string: s, rule: v.rule, match: v.match });
  }
  return { file: relative(ENGINE_ROOT, absPath).split(sep).join("/"), strings, violations };
}

export function lintLibEmitterFile(absPath, root = ENGINE_ROOT) {
  const content = readFileSync(absPath, "utf8");
  const rel = relative(root, absPath).split(sep).join("/");
  const strings = extractLibCopyStrings(content);
  const violations = [];
  for (const s of strings) {
    for (const v of lintString(s)) violations.push({ string: s, rule: v.rule, match: v.match });
    for (const v of lintVerticalTerms(s, rel)) violations.push(v);
  }
  return { file: rel, strings, violations };
}

// Whole-scaffold check over app/ + components/ + lib emitters.
export function checkScaffold(root = ENGINE_ROOT) {
  const files = SCAFFOLD_DIRS.flatMap((d) => walkTsxFiles(join(root, d)));
  const violations = [];
  let stringsScanned = 0;
  const perFile = [];
  for (const f of files) {
    const result = lintScaffoldFile(f);
    stringsScanned += result.strings.length;
    for (const v of result.violations) violations.push({ file: result.file, ...v });
    perFile.push(result);
  }
  for (const rel of LIB_EMITTER_FILES) {
    const abs = join(root, ...rel.split("/"));
    const result = lintLibEmitterFile(abs, root);
    stringsScanned += result.strings.length;
    for (const v of result.violations) violations.push({ file: result.file, ...v });
    perFile.push(result);
  }
  return { fileCount: files.length + LIB_EMITTER_FILES.length, stringsScanned, violations, perFile };
}

function runCli() {
  const result = checkScaffold();
  if (result.violations.length) {
    console.error(
      `\nSCAFFOLD COPY LINT FAILED (${result.violations.length} violation(s) across ` +
        `${result.stringsScanned} strings in ${result.fileCount} file(s)):`,
    );
    for (const v of result.violations) console.error(`  - [${v.rule}] "${v.match}" in ${v.file}: "${v.string}"`);
    process.exit(1);
  }
  console.log(
    `scaffold copy lint clean: ${result.fileCount} file(s), ${result.stringsScanned} strings, 0 violations`,
  );
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) runCli();
