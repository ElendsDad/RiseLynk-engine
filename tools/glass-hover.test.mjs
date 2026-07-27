// =============================================================================
// Gate: glassHover compositor invariants (overflow + where blur may live).
//
//   npm run test:glass-hover
//
// Confirmed Chromium footgun (teardown 2026-07-24): the SAME element must not
// carry both `overflow: hidden` and `backdrop-filter` — that drops glass and can
// corrupt compositor state until reload. Blur stays on ::after; cards force
// overflow:visible.
//
// 2026-07-25 recheck: a hover `transform: translateY(-2px)` on the card was
// hypothesized to create a Backdrop Root that neuters ::after's blur. Stripe
// fixtures in Chromium + Edge did not reproduce that; the lift stays on
// transform. This gate still forbids putting `backdrop-filter` (or overflow:
// hidden) on the glass card element itself — the ancestor of the blur pseudo —
// which is the regression class that has actually bitten twice via overflow.
// =============================================================================

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const CSS_PATH = join(ROOT, "app", "globals.css");

let passed = 0;
let failed = 0;
function ok(name, cond) {
  if (cond) {
    passed++;
    console.log("  PASS  " + name);
  } else {
    failed++;
    console.log("  FAIL  " + name);
  }
}

function extractGlassBlock(css) {
  const start = css.indexOf("/* --- glassHover");
  if (start < 0) return "";
  const endMarkers = ["/* --- gradient hot-plan", "/* --- aurora", "/* --- magnetic"];
  let end = -1;
  for (const marker of endMarkers) {
    const i = css.indexOf(marker, start + 1);
    if (i > start && (end < 0 || i < end)) end = i;
  }
  if (end < 0) end = css.length;
  return css.slice(start, end);
}

function walkRules(css, out = []) {
  const noComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
  let i = 0;
  while (i < noComments.length) {
    while (i < noComments.length && /\s/.test(noComments[i])) i++;
    if (i >= noComments.length) break;
    const open = noComments.indexOf("{", i);
    if (open < 0) break;
    const selector = noComments.slice(i, open).trim();
    let depth = 1;
    let j = open + 1;
    while (j < noComments.length && depth > 0) {
      if (noComments[j] === "{") depth++;
      else if (noComments[j] === "}") depth--;
      j++;
    }
    const body = noComments.slice(open + 1, j - 1);
    if (/^@(?:media|supports)\b/.test(selector)) walkRules(body, out);
    else if (selector) out.push({ selector, body });
    i = j;
  }
  return out;
}

/** Glass card surface selector that is NOT ::before / ::after (the blur ancestor). */
function isGlassCardElementSelector(selector) {
  if (!/\[data-craft~=["']glass["']\]/.test(selector)) return false;
  if (/::(?:before|after)\b/.test(selector)) return false;
  return /\.(?:card|quote|product|blogcard|records__item|svc-card|mod)\b/.test(selector);
}

/**
 * Violations: backdrop-filter or overflow:hidden on the glass card element
 * (ancestor of the blur pseudo). Empty = pass.
 */
function findGlassCardElementViolations(css) {
  const block = extractGlassBlock(css);
  if (!block) return ["glassHover block not found"];
  const violations = [];
  for (const rule of walkRules(block)) {
    if (!isGlassCardElementSelector(rule.selector)) continue;
    if (/(?:^|[;{])\s*(?:backdrop-filter|-webkit-backdrop-filter)\s*:/m.test(rule.body)) {
      violations.push(
        `backdrop-filter on glass card element (must live on ::after): ${rule.selector.replace(/\s+/g, " ").slice(0, 96)}`,
      );
    }
    if (/(?:^|[;{])\s*overflow\s*:\s*hidden\s*;/m.test(rule.body)) {
      violations.push(
        `overflow:hidden on glass card element: ${rule.selector.replace(/\s+/g, " ").slice(0, 96)}`,
      );
    }
  }
  return violations;
}

function testLiveCss() {
  console.log("\n# globals.css glassHover compositor invariants");
  const css = readFileSync(CSS_PATH, "utf8");
  const block = extractGlassBlock(css);
  ok("glassHover block present", block.length > 0);
  ok("glass blur still on ::after", /::after[\s\S]*backdrop-filter:\s*blur\(12px\)/.test(block));
  ok("glass cards force overflow:visible", /overflow:\s*visible/.test(block));
  ok(
    "glass block does not set overflow:hidden",
    !/(?:^|[;{])\s*overflow:\s*hidden\s*;/m.test(block),
  );
  ok("hover lift still uses transform translateY", /transform:\s*translateY\(\s*-2px\s*\)/.test(block));
  ok(
    "doc comment records the transform Backdrop Root recheck",
    /TRANSFORM \(rechecked|translateY\(-2px\)/.test(block) && /Backdrop Root/.test(block),
  );

  const violations = findGlassCardElementViolations(css);
  ok("no backdrop-filter/overflow:hidden on glass card elements", violations.length === 0);
  if (violations.length) {
    for (const v of violations) console.log("    · " + v);
  }
}

function testCheckerCatchesBadInput() {
  console.log("\n# checker fails on synthetic bad card-element blur / overflow");
  const base = `
/* --- glassHover: synthetic --- */
[data-craft~="glass"] .card {
  position: relative;
  overflow: visible;
}
[data-craft~="glass"] .card::after {
  content: "";
  backdrop-filter: blur(12px) saturate(1.4);
}
@media (hover: hover) and (pointer: fine) {
  [data-craft~="glass"] .card:hover::after { opacity: 1; }
  [data-craft~="glass"] .card:hover {
    transform: translateY(-2px);
    background: transparent;
  }
}
/* --- gradient hot-plan --- */
`;
  ok(
    "good synthetic (blur on ::after, transform lift) is accepted",
    findGlassCardElementViolations(base).length === 0,
  );

  const badBlurOnCard = base.replace(
    "transform: translateY(-2px);\n    background: transparent;",
    "transform: translateY(-2px);\n    backdrop-filter: blur(12px);\n    background: transparent;",
  );
  const blurViolations = findGlassCardElementViolations(badBlurOnCard);
  ok("synthetic backdrop-filter on .card:hover is rejected", blurViolations.length >= 1);
  ok(
    "rejection names backdrop-filter on the card element",
    blurViolations.some((v) => /backdrop-filter on glass card element/i.test(v)),
  );

  const badOverflow = `
/* --- glassHover: synthetic --- */
[data-craft~="glass"] .card {
  position: relative;
  overflow: hidden;
}
[data-craft~="glass"] .card::after {
  backdrop-filter: blur(12px);
}
/* --- gradient hot-plan --- */
`;
  ok(
    "synthetic overflow:hidden on .card is rejected",
    findGlassCardElementViolations(badOverflow).length >= 1,
  );

  // ::after may carry backdrop-filter — that is the leaf, not a violation.
  const afterOnly = `
/* --- glassHover: synthetic --- */
[data-craft~="glass"] .card:hover::after {
  opacity: 1;
  backdrop-filter: blur(12px);
}
[data-craft~="glass"] .card:hover { transform: translateY(-2px); }
/* --- gradient hot-plan --- */
`;
  ok(
    "::after backdrop-filter is not treated as a card-element violation",
    findGlassCardElementViolations(afterOnly).length === 0,
  );
}

testLiveCss();
testCheckerCatchesBadInput();

console.log("\n" + (failed ? "FAILED " + failed + " / " : "PASSED all ") + (passed + failed) + " checks");
process.exit(failed ? 1 : 0);
