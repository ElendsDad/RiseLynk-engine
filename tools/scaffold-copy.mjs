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

// The engine's own scaffold lives in these two trees. examples/ and lib/ are deliberately
// excluded: examples/ is fixture/demo content (already covered by the hydrate/blog gates
// where it matters), and lib/ has no JSX.
const SCAFFOLD_DIRS = ["app", "components"];

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

// Whole-scaffold check over app/ + components/. Returns { fileCount, stringsScanned, violations }.
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
  return { fileCount: files.length, stringsScanned, violations, perFile };
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
