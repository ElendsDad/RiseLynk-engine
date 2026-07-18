// ============================================================
// site-engine - built-in social icon set + platform-detection harness
//
//   node tools/social-icons.test.mjs
//
// Proves the pure data/logic in lib/social-icons.mjs, which components/SocialIcon.tsx draws
// from and components/Footer.tsx drives off business.socials. Same shared-.mjs pattern as
// tools/icons.test.mjs: plain Node, no TypeScript toolchain. The full end-to-end render (the
// Footer icon row + the Organization sameAs JSON-LD lib/seo.ts folds business.socials into)
// is additionally proven by the rendered-output build check on the demos (the v0.5.0 release
// practice), same as every other JSON-LD builder here.
//
// Covers:
//   - every entry in SOCIAL_ICONS is well-formed: a non-empty array of non-empty SVG path
//     "d" strings, each starting with an absolute moveto (M), so nothing malformed can reach
//     the SVG components/SocialIcon.tsx renders.
//   - socialPlatform: label match wins first (a hand-authored placeholder like
//     { label: "Facebook", href: "#" } still resolves), then href hostname (including a
//     "www." prefix and known aliases like twitter.com/youtu.be), then the generic "link"
//     fallback for anything unrecognized. Never throws on a malformed/relative href.
//   - socialPlatform never resolves a prototype-member label (toString, constructor, ...) to
//     an inherited value (fail-safe, mirrors lib/icons.mjs's hostile-name contract).
//   - socialIconPaths: a known platform returns its real path data; anything else (including
//     a non-string) falls back to the generic "link" glyph, never null, never a throw.
// ============================================================

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const MODULE_PATH = join(ROOT, "lib", "social-icons.mjs");

const mod = await import("file://" + MODULE_PATH);
const { SOCIAL_ICONS, SOCIAL_ICON_NAMES, socialPlatform, socialIconPaths } = mod;

let passed = 0, failed = 0;
const ok = (name, cond) => { if (cond) { passed++; console.log("  ok  " + name); } else { failed++; console.log("FAIL  " + name); } };
const eq = (name, a, b) => ok(name + " (" + JSON.stringify(a) + ")", JSON.stringify(a) === JSON.stringify(b));

function testRegistry() {
  console.log("\n# lib/social-icons.mjs: registry shape");
  ok("the set is not empty", SOCIAL_ICON_NAMES.length > 0);
  eq("SOCIAL_ICON_NAMES matches Object.keys(SOCIAL_ICONS)", SOCIAL_ICON_NAMES, Object.keys(SOCIAL_ICONS));
  ok("the generic fallback glyph exists", Object.hasOwn(SOCIAL_ICONS, "link"));
  for (const name of SOCIAL_ICON_NAMES) {
    const paths = SOCIAL_ICONS[name];
    ok(`${name}: paths is a non-empty array`, Array.isArray(paths) && paths.length > 0);
    for (const d of paths) {
      ok(`${name}: path "d" is a non-empty string`, typeof d === "string" && d.trim().length > 0);
      ok(`${name}: path "d" starts with an absolute moveto (M)`, /^M/.test(d.trim()));
    }
  }
}

function testSocialPlatform() {
  console.log("\n# socialPlatform: label-first, then href-hostname, then generic fallback");
  // Label wins even over a placeholder href (the site-demo fixture's real shape).
  eq("label match wins over a placeholder href", socialPlatform({ label: "Facebook", href: "#" }), "facebook");
  eq("label match is case-insensitive", socialPlatform({ label: "LinkedIn", href: "" }), "linkedin");
  eq("twitter label aliases to x", socialPlatform({ label: "Twitter", href: "" }), "x");
  // Hostname resolves when the label does not match a known platform.
  eq(
    "linkedin.com hostname resolves",
    socialPlatform({ label: "Follow us", href: "https://www.linkedin.com/company/riselynk/" }),
    "linkedin",
  );
  eq(
    "instagram.com hostname resolves",
    socialPlatform({ label: "Follow us", href: "https://www.instagram.com/rise_lynk/" }),
    "instagram",
  );
  eq(
    "facebook.com hostname resolves",
    socialPlatform({ label: "Follow us", href: "https://www.facebook.com/people/RiseLynk/61591563653973/" }),
    "facebook",
  );
  eq("youtu.be alias resolves to youtube", socialPlatform({ label: "Watch", href: "https://youtu.be/abc123" }), "youtube");
  eq("twitter.com hostname aliases to x", socialPlatform({ label: "Follow", href: "https://twitter.com/riselynk" }), "x");
  // Unrecognized and malformed hrefs fall back to the generic glyph, never throw.
  eq("an unrecognized platform falls back to link", socialPlatform({ label: "Live demo", href: "https://demo.app.riselynk.com" }), "link");
  eq("a relative placeholder href falls back to link", socialPlatform({ label: "Somewhere", href: "#" }), "link");
  eq("a missing href falls back to link", socialPlatform({ label: "Somewhere" }), "link");
  eq("an empty object falls back to link", socialPlatform({}), "link");
  // Prototype-pollution guard on the label lookup (mirrors lib/icons.mjs's hostile-name contract).
  for (const hostile of ["constructor", "toString", "hasOwnProperty", "__proto__"]) {
    eq(`a prototype-member label ("${hostile}") falls back to link, never an inherited value`, socialPlatform({ label: hostile, href: "" }), "link");
  }
}

function testSocialIconPaths() {
  console.log("\n# socialIconPaths: known platform resolves, unknown/non-string falls back to link");
  ok("a known platform returns its path data", socialIconPaths("linkedin") === SOCIAL_ICONS.linkedin);
  for (const name of SOCIAL_ICON_NAMES) {
    ok(`socialIconPaths("${name}") resolves to a real array`, Array.isArray(socialIconPaths(name)) && socialIconPaths(name).length > 0);
  }
  eq("an unknown platform falls back to the link glyph", socialIconPaths("not-a-real-platform"), SOCIAL_ICONS.link);
  eq("undefined falls back to the link glyph", socialIconPaths(undefined), SOCIAL_ICONS.link);
  eq("a non-string value falls back to the link glyph", socialIconPaths(42), SOCIAL_ICONS.link);
  for (const hostile of ["constructor", "toString", "hasOwnProperty", "__proto__"]) {
    eq(`a prototype-member platform ("${hostile}") falls back to link, never an inherited value`, socialIconPaths(hostile), SOCIAL_ICONS.link);
  }
}

testRegistry();
testSocialPlatform();
testSocialIconPaths();

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
