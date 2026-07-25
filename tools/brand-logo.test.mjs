// ============================================================
// site-engine - brand-logo resolution harness
//
//   node tools/brand-logo.test.mjs
//
// Proves the pure resolution logic in lib/brand-logo.mjs that components/Header.tsx and
// components/Footer.tsx turn into markup for the three logo-surface feedback items:
//   1) header logo-replaces-name (brand.logoReplacesName)
//   2) footer logo slot (footer.logoUrl), coherent with the header's replace-name flag
//   3) per-theme logo variant (brand.logoUrlDark / footer.logoUrlDark), gated on the site's
//      dual-theme block being enabled
//
// Covers every flag combination so a default/absent config is provably byte-for-byte
// unchanged (showImg false or a single plain image, alt="", name text intact), and every
// opted-in combination resolves the fields components/Header.tsx and components/Footer.tsx
// need without any surprising cross-talk (e.g. a footer with no logoUrl never blanks its name,
// a dark variant never appears on a theme-less site).
// ============================================================

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const MODULE_PATH = join(ROOT, "lib", "brand-logo.mjs");

const mod = await import("file://" + MODULE_PATH);
const { resolveHeaderLogo, resolveFooterLogo } = mod;

let passed = 0, failed = 0;
const ok = (name, cond) => { if (cond) { passed++; console.log("  ok  " + name); } else { failed++; console.log("FAIL  " + name); } };
const eq = (name, a, b) => ok(name + " (" + JSON.stringify(a) + ")", JSON.stringify(a) === JSON.stringify(b));

function testHeaderDefaults() {
  console.log("\n# resolveHeaderLogo: absent / default flags render byte-for-byte unchanged");
  // No brand at all.
  eq("no brand -> no image, no replace", resolveHeaderLogo(undefined, "Acme Co", false), {
    showImg: false, imgAlt: "", replacesName: false, showDarkVariant: false, logoUrl: undefined, logoUrlDark: undefined,
  });
  // logoUrl only (today's shape): image shown beside the name, alt="", no dark variant.
  eq(
    "logoUrl only -> single image, alt empty, name kept",
    resolveHeaderLogo({ logoUrl: "/logo.svg" }, "Acme Co", false),
    { showImg: true, imgAlt: "", replacesName: false, showDarkVariant: false, logoUrl: "/logo.svg", logoUrlDark: undefined },
  );
  // No logoUrl but logoReplacesName true: nothing to replace the name with, so name stays.
  eq(
    "logoReplacesName with no logoUrl -> no image, name kept (fails safe)",
    resolveHeaderLogo({ logoReplacesName: true }, "Acme Co", false),
    { showImg: false, imgAlt: "", replacesName: false, showDarkVariant: false, logoUrl: undefined, logoUrlDark: undefined },
  );
  // logoUrlDark with theme OFF: dark variant never appears on a theme-less site.
  eq(
    "logoUrlDark with themeOn=false -> single light image only",
    resolveHeaderLogo({ logoUrl: "/logo.svg", logoUrlDark: "/logo-dark.svg" }, "Acme Co", false),
    { showImg: true, imgAlt: "", replacesName: false, showDarkVariant: false, logoUrl: "/logo.svg", logoUrlDark: undefined },
  );
}

function testHeaderOptIns() {
  console.log("\n# resolveHeaderLogo: opted-in combinations");
  // logoReplacesName true + logoUrl set: image replaces the name, alt carries the business name.
  eq(
    "logoReplacesName true -> replacesName true, alt is the business name",
    resolveHeaderLogo({ logoUrl: "/logo.svg", logoReplacesName: true }, "Acme Co", false),
    { showImg: true, imgAlt: "Acme Co", replacesName: true, showDarkVariant: false, logoUrl: "/logo.svg", logoUrlDark: undefined },
  );
  // logoUrlDark + theme ON: both images resolve, dark variant carried through.
  eq(
    "logoUrlDark with themeOn=true -> dark variant resolves",
    resolveHeaderLogo({ logoUrl: "/logo.svg", logoUrlDark: "/logo-dark.svg" }, "Acme Co", true),
    { showImg: true, imgAlt: "", replacesName: false, showDarkVariant: true, logoUrl: "/logo.svg", logoUrlDark: "/logo-dark.svg" },
  );
  // All three flags together.
  eq(
    "logoReplacesName + logoUrlDark + themeOn -> replace name, alt set, dark variant resolves",
    resolveHeaderLogo({ logoUrl: "/logo.svg", logoUrlDark: "/logo-dark.svg", logoReplacesName: true }, "Acme Co", true),
    { showImg: true, imgAlt: "Acme Co", replacesName: true, showDarkVariant: true, logoUrl: "/logo.svg", logoUrlDark: "/logo-dark.svg" },
  );
  // themeOn true but no logoUrlDark supplied: still a single image, no dark variant to show.
  eq(
    "themeOn=true with no logoUrlDark -> still single image",
    resolveHeaderLogo({ logoUrl: "/logo.svg" }, "Acme Co", true),
    { showImg: true, imgAlt: "", replacesName: false, showDarkVariant: false, logoUrl: "/logo.svg", logoUrlDark: undefined },
  );
}

function testFooterDefaults() {
  console.log("\n# resolveFooterLogo: absent footer / footer.logoUrl renders byte-for-byte unchanged");
  eq("no footer block -> no image, name kept", resolveFooterLogo({}, undefined, "Acme Co", false), {
    showImg: false, imgAlt: "", replacesName: false, showDarkVariant: false, logoUrl: undefined, logoUrlDark: undefined,
  });
  eq(
    "footer block with no logoUrl -> no image, name kept",
    resolveFooterLogo({}, { legalName: "Acme Co LLC" }, "Acme Co", false),
    { showImg: false, imgAlt: "", replacesName: false, showDarkVariant: false, logoUrl: undefined, logoUrlDark: undefined },
  );
  // Header's logoReplacesName true, but the footer has no logoUrl of its own: the coherence
  // rule keeps the footer name text (cannot replace text with an image that was never supplied).
  eq(
    "header logoReplacesName true + no footer.logoUrl -> footer name still kept",
    resolveFooterLogo({ logoReplacesName: true }, undefined, "Acme Co", false),
    { showImg: false, imgAlt: "", replacesName: false, showDarkVariant: false, logoUrl: undefined, logoUrlDark: undefined },
  );
}

function testFooterOptIns() {
  console.log("\n# resolveFooterLogo: opted-in combinations");
  // footer.logoUrl set, brand.logoReplacesName unset (or false): image AND name both render.
  eq(
    "footer.logoUrl only -> image shown, name kept, alt empty",
    resolveFooterLogo({}, { logoUrl: "/footer-logo.svg" }, "Acme Co", false),
    { showImg: true, imgAlt: "", replacesName: false, showDarkVariant: false, logoUrl: "/footer-logo.svg", logoUrlDark: undefined },
  );
  // footer.logoUrl set AND the header's logoReplacesName true: the coherence rule now DOES
  // replace the footer name (the footer finally has its own asset to replace it with).
  eq(
    "footer.logoUrl + header logoReplacesName true -> footer name replaced too",
    resolveFooterLogo({ logoReplacesName: true }, { logoUrl: "/footer-logo.svg" }, "Acme Co", false),
    { showImg: true, imgAlt: "Acme Co", replacesName: true, showDarkVariant: false, logoUrl: "/footer-logo.svg", logoUrlDark: undefined },
  );
  // The footer's own dark variant is independent of the header's logoUrlDark (a different
  // asset pair entirely); still gated on themeOn.
  eq(
    "footer.logoUrlDark with themeOn=false -> single light image only",
    resolveFooterLogo({}, { logoUrl: "/footer-logo.svg", logoUrlDark: "/footer-logo-dark.svg" }, "Acme Co", false),
    { showImg: true, imgAlt: "", replacesName: false, showDarkVariant: false, logoUrl: "/footer-logo.svg", logoUrlDark: undefined },
  );
  eq(
    "footer.logoUrlDark with themeOn=true -> dark variant resolves",
    resolveFooterLogo({}, { logoUrl: "/footer-logo.svg", logoUrlDark: "/footer-logo-dark.svg" }, "Acme Co", true),
    { showImg: true, imgAlt: "", replacesName: false, showDarkVariant: true, logoUrl: "/footer-logo.svg", logoUrlDark: "/footer-logo-dark.svg" },
  );
}

testHeaderDefaults();
testHeaderOptIns();
testFooterDefaults();
testFooterOptIns();

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
