// ============================================================
// site-engine - CTABanner multi-CTA resolution harness
//
//   node tools/cta-banner.test.mjs
//
// Proves the additive Section.cta[] seam for the closing CTA band:
//   1. Absent / empty / malformed cta[] -> mode "legacy" (byte-identity
//      precondition: the component keeps the ctaLabel/ctaHref markup).
//   2. Non-empty cta[] -> mode "multi" with defaults (variant primary,
//      href /contact), variant allow-list, and a 6-item cap.
//   3. Source contract: CTABanner.tsx still contains the legacy
//      btn--accent + ctaHref ?? "/contact" branch (not rewritten through
//      the multi mapper), so an unchanged config cannot drift.
// ============================================================

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const MODULE_PATH = join(ROOT, "lib", "cta-banner.mjs");
const COMPONENT_PATH = join(ROOT, "components", "sections", "CTABanner.tsx");

const mod = await import("file://" + MODULE_PATH);
const { resolveCtaBannerMode, CTA_BANNER_MAX } = mod;

let passed = 0, failed = 0;
const ok = (name, cond) => { if (cond) { passed++; console.log("  ok  " + name); } else { failed++; console.log("FAIL  " + name); } };
const eq = (name, a, b) => ok(name + " (" + JSON.stringify(a) + ")", JSON.stringify(a) === JSON.stringify(b));

function testLegacyByteIdentityPrecondition() {
  console.log("\n# absent / empty / malformed cta[] -> legacy (byte-identity precondition)");
  eq("undefined section", resolveCtaBannerMode(undefined), { mode: "legacy" });
  eq("no cta field", resolveCtaBannerMode({ ctaLabel: "Contact us", ctaHref: "/contact" }), { mode: "legacy" });
  eq("empty array", resolveCtaBannerMode({ cta: [] }), { mode: "legacy" });
  eq("null cta", resolveCtaBannerMode({ cta: null }), { mode: "legacy" });
  eq("all-empty labels fail closed to legacy", resolveCtaBannerMode({
    cta: [{ label: "   " }, { label: "" }, {}],
    ctaLabel: "Contact us",
  }), { mode: "legacy" });
}

function testMultiCta() {
  console.log("\n# non-empty cta[] -> multi with defaults, variants, and cap");
  eq(
    "single item defaults variant+href",
    resolveCtaBannerMode({ cta: [{ label: "Contact us" }] }),
    { mode: "multi", items: [{ label: "Contact us", href: "/contact", variant: "primary" }] },
  );
  eq(
    "four exits (the landing parity case)",
    resolveCtaBannerMode({
      cta: [
        { label: "Contact us", href: "/contact", variant: "accent" },
        { label: "See a live demo", href: "https://demo.example.com", variant: "ghost" },
        { label: "See pricing", href: "/#pricing", variant: "ghost" },
        { label: "Read the pitch deck", href: "/pitch.pdf", variant: "ghost" },
      ],
    }),
    {
      mode: "multi",
      items: [
        { label: "Contact us", href: "/contact", variant: "accent" },
        { label: "See a live demo", href: "https://demo.example.com", variant: "ghost" },
        { label: "See pricing", href: "/#pricing", variant: "ghost" },
        { label: "Read the pitch deck", href: "/pitch.pdf", variant: "ghost" },
      ],
    },
  );
  const many = Array.from({ length: CTA_BANNER_MAX + 3 }, (_, i) => ({ label: "Go " + i, href: "/" + i }));
  const capped = resolveCtaBannerMode({ cta: many });
  ok("mode is multi when over cap", capped.mode === "multi");
  eq("caps at CTA_BANNER_MAX", capped.mode === "multi" ? capped.items.length : -1, CTA_BANNER_MAX);
  eq(
    "unknown variant falls back to primary",
    resolveCtaBannerMode({ cta: [{ label: "X", variant: "neon" }] }),
    { mode: "multi", items: [{ label: "X", href: "/contact", variant: "primary" }] },
  );
  eq(
    "blank href falls back to /contact",
    resolveCtaBannerMode({ cta: [{ label: "X", href: "  " }] }),
    { mode: "multi", items: [{ label: "X", href: "/contact", variant: "primary" }] },
  );
}

function testComponentKeepsLegacyBranch() {
  console.log("\n# CTABanner.tsx keeps the legacy single-button branch byte-stable");
  const src = readFileSync(COMPONENT_PATH, "utf8");
  ok("imports resolveCtaBannerMode", /resolveCtaBannerMode/.test(src));
  ok("legacy branch still keys off section.ctaLabel", /section\.ctaLabel\s*\|\|\s*review/.test(src));
  ok("legacy button stays btn--accent", /className="btn btn--accent"/.test(src));
  ok("legacy href fallback is ctaHref ?? \"/contact\"", /section\.ctaHref\s*\?\?\s*["']\/contact["']/.test(src));
  ok("multi path is gated on mode === \"multi\"", /ctaMode\.mode\s*===\s*["']multi["']/.test(src));
  // The multi path must NOT rewrite the legacy accent class through the mapper when
  // cta[] is absent — proven by the resolve helper returning legacy for that case above,
  // plus the component still containing the dedicated legacy JSX branch.
  ok(
    "legacy and multi are separate branches (ternary, not a shared map over ctaLabel)",
    /ctaMode\.mode\s*===\s*["']multi["']\s*\?/.test(src) && /section\.ctaLabel\s*\?/.test(src),
  );
}

testLegacyByteIdentityPrecondition();
testMultiCta();
testComponentKeepsLegacyBranch();

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
