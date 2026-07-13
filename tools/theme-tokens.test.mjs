// ============================================================
// site-engine - dual-theme token-parity + WCAG harness (G1 toggle + G2 palette).
//
//   node tools/theme-tokens.test.mjs
//
// Proves the pure logic in lib/theme-tokens.mjs (the module lib/theme.ts and the
// build consume), the SAME shared-.mjs pattern as tools/trust.test.mjs and
// tools/seo-jsonld.test.mjs. Plain Node, no TypeScript toolchain; the full render is
// additionally proven by the rendered-output build check on the theme demo.
//
// Covers:
//   - deriveTokens: pinned anchors (so the zero-config derive cannot silently drift) +
//     the WCAG-AA lightness clamp (P1) on BOTH the derived light and dark surfaces.
//   - resolveTheme: an explicit palette is used VERBATIM (byte-match); a HYBRID derives
//     the omitted side.
//   - tokenSheetCss: the P0 fixes are structurally enforced - NO --line self-alias, the
//     grain opacity is NOT bridged onto the craft --grain-opacity, the three theme
//     selectors and the prefers-color-scheme media query are all emitted.
//   - boot / toggle scripts: set data-theme, key off rl_theme, swap the contract meta.
//   - ssrThemeAttr: a "system" default emits NO SSR data-theme (P2).
//   - TOKEN-PARITY on globals.css: the [data-craft~="one-light"]:not([data-theme])
//     back-compat rule is present (release gate) and NO bare unconditional one-light
//     remap survives (so a craft-only demo still renders dark, and a theme site does not
//     double-apply).
// ============================================================

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFileSync } from "node:fs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const MODULE_PATH = join(ROOT, "lib", "theme-tokens.mjs");

const m = await import("file://" + MODULE_PATH);
const {
  SCALAR_TOKEN_KEYS,
  ALIAS_BRIDGE,
  STATUS_KEYS,
  deriveTokens,
  deriveGroupTokens,
  resolveTheme,
  tokenSheetCss,
  bootScript,
  toggleScript,
  ssrThemeAttr,
  metaColorFor,
  contrastRatio,
  mixHex,
  META_LIGHT,
  META_DARK,
} = m;

let passed = 0, failed = 0;
const ok = (name, cond) => { if (cond) { passed++; console.log("  ok  " + name); } else { failed++; console.log("FAIL  " + name); } };
const eq = (name, a, b) => ok(name + " (" + JSON.stringify(a) + ")", JSON.stringify(a) === JSON.stringify(b));

// A fixed brand for pinning the derive (two colors, an explicit bg + text).
const BRAND = { colors: { primary: "#12324a", accent: "#0c6b52", bg: "#fafaf8", text: "#141a17" } };

// ================= 1. color math sanity =================
function testColorMath() {
  console.log("\n# color math: mixHex + contrastRatio");
  eq("mixHex 100% a => a", mixHex("#ffffff", "#000000", 100), "#ffffff");
  eq("mixHex 0% a => b", mixHex("#ffffff", "#000000", 0), "#000000");
  ok("contrast white/black == 21", Math.round(contrastRatio("#ffffff", "#000000")) === 21);
  ok("contrast is symmetric", contrastRatio("#0e1f19", "#fafaf7") === contrastRatio("#fafaf7", "#0e1f19"));
}

// ================= 2. deriveTokens: pinned anchors =================
function testDeriveAnchors() {
  console.log("\n# deriveTokens: pinned anchors (guards against silent drift)");
  const l = deriveTokens(BRAND, "light");
  const d = deriveTokens(BRAND, "dark");
  // Every scalar key is present in both modes (no undefined leaks into the sheet).
  eq("light emits every scalar key", SCALAR_TOKEN_KEYS.filter((k) => l[k] == null), []);
  eq("dark emits every scalar key", SCALAR_TOKEN_KEYS.filter((k) => d[k] == null), []);
  // Concrete contrast-critical anchors are pinned exactly.
  eq("light.bg", l.bg, "#fafaf8");
  eq("light.ink", l.ink, "#141a17");
  eq("light.green == brand accent", l.green, "#0c6b52");
  eq("light.onGreen", l.onGreen, "#ffffff");
  eq("light.grainOpacity", l.grainOpacity, "0.03");
  eq("dark.bg", d.bg, "#0c1314");
  eq("dark.ink", d.ink, "#e7efea");
  eq("dark.green", d.green, "#72a99b");
  eq("dark.onGreen", d.onGreen, "#062018");
  eq("dark.grainOpacity", d.grainOpacity, "0.05");
}

// ================= 3. deriveTokens: the WCAG-AA clamp (P1) =================
function testDeriveWcag() {
  console.log("\n# deriveTokens: WCAG-AA clamp on the derived surfaces (P1)");
  const l = deriveTokens(BRAND, "light");
  const d = deriveTokens(BRAND, "dark");
  ok("derived light ink clears AA (4.5:1) on its bg", contrastRatio(l.ink, l.bg) >= 4.5);
  ok("derived dark ink clears AA (4.5:1) on its bg", contrastRatio(d.ink, d.bg) >= 4.5);
  // A brand whose text is far too light for its bg gets clamped up to AA, not passed through.
  const bad = { colors: { primary: "#12324a", accent: "#0c6b52", bg: "#ffffff", text: "#eeeeee" } };
  const bl = deriveTokens(bad, "light");
  ok("a too-light brand text is clamped to AA (not passed through)", contrastRatio(bl.ink, bl.bg) >= 4.5);
  ok("the clamp actually changed the ink", bl.ink !== "#eeeeee");
}

// ================= 4. resolveTheme: verbatim palette + hybrid derive =================
function testResolve() {
  console.log("\n# resolveTheme: explicit palette VERBATIM, hybrid derives the missing side");
  const theme = { enabled: true, default: "light", palette: { light: { bg: "#fafaf7", ink: "#0e1f19" }, dark: { bg: "#0f1412", ink: "#e7efea" } } };
  const { light, dark } = resolveTheme(theme, BRAND);
  eq("explicit light.bg used verbatim", light.bg, "#fafaf7");
  eq("explicit dark.bg used verbatim", dark.bg, "#0f1412");
  // Keys the palette omitted are completed by the derive (no undefined).
  eq("omitted keys are derived, none missing", SCALAR_TOKEN_KEYS.filter((k) => light[k] == null || dark[k] == null), []);
  // Hybrid: dark supplied, light omitted => light derives.
  const hybrid = { enabled: true, palette: { dark: { bg: "#0f1412" } } };
  const r = resolveTheme(hybrid, BRAND);
  eq("hybrid dark.bg verbatim", r.dark.bg, "#0f1412");
  eq("hybrid light.bg derived", r.light.bg, "#fafaf8");
}

// ================= 5. tokenSheetCss: the P0 fixes, structurally =================
function testSheet() {
  console.log("\n# tokenSheetCss: P0 fixes + selector coverage");
  const css = tokenSheetCss(resolveTheme({ enabled: true, palette: { light: { line: "#e4e7e1" }, dark: { line: "#2c3d35" } } }, BRAND));
  // P0: no --line self-alias anywhere (the bug that killed every border).
  ok("no --line self-alias (--line:var(--line))", !/--line\s*:\s*var\(--line\)/.test(css));
  ok("--line is fed from --rl-line", css.includes("--line:var(--rl-line)"));
  // P0: the grain opacity is never bridged onto the craft --grain-opacity.
  ok("no --grain-opacity in the alias bridge", !/--grain-opacity\s*:/.test(css));
  ok("grain opacity rides --rl-grain-opacity", css.includes("--rl-grain-opacity:"));
  // Accent = single-hue green: both engine aliases map to --rl-green.
  ok("--color-accent maps to --rl-green", css.includes("--color-accent:var(--rl-green)"));
  ok("--color-primary maps to --rl-green", css.includes("--color-primary:var(--rl-green)"));
  // The three theme selectors + the system media query all present (P2 no-attr path).
  ok('light owns [data-theme="light"] and :not([data-theme])', css.includes(':root[data-theme="light"],:root:not([data-theme])'));
  ok('dark owns [data-theme="dark"]', css.includes(':root[data-theme="dark"]'));
  ok("system dark rides prefers-color-scheme", /@media \(prefers-color-scheme:dark\)\{:root:not\(\[data-theme\]\)/.test(css));
  // The alias bridge is complete (every mapped alias emitted).
  ALIAS_BRIDGE.forEach(([alias]) => ok("bridge emits " + alias, css.includes(alias + ":")));
}

// ================= 6. boot + toggle scripts =================
function testScripts() {
  console.log("\n# boot + toggle scripts");
  const boot = bootScript("dark", "rl_theme");
  ok("boot sets data-theme", boot.includes("setAttribute('data-theme'"));
  ok("boot reads rl_theme", boot.includes("rl_theme"));
  ok("boot honors a dark default", boot.includes('"dark"') || boot.includes("'dark'"));
  const sys = bootScript("system", "rl_theme");
  ok("system boot consults prefers-color-scheme", sys.includes("prefers-color-scheme"));
  const tog = toggleScript("rl_theme", META_LIGHT, META_DARK);
  ok("toggle targets #themeBtn", tog.includes("themeBtn"));
  ok("toggle swaps the light contract meta", tog.includes(META_LIGHT));
  ok("toggle swaps the dark contract meta", tog.includes(META_DARK));
  ok("toggle persists to rl_theme", tog.includes("setItem") && tog.includes("rl_theme"));
}

// ================= 7. ssrThemeAttr (P2) + metaColorFor (contract) =================
function testSsrAndMeta() {
  console.log("\n# ssrThemeAttr (P2) + metaColorFor (contract defaults)");
  eq("disabled => no attr", ssrThemeAttr({ enabled: false }), undefined);
  eq("undefined => no attr", ssrThemeAttr(undefined), undefined);
  eq("default light => light", ssrThemeAttr({ enabled: true, default: "light" }), "light");
  eq("default dark => dark", ssrThemeAttr({ enabled: true, default: "dark" }), "dark");
  eq("default system => NO attr (P2)", ssrThemeAttr({ enabled: true, default: "system" }), undefined);
  eq("meta default light is the contract color", metaColorFor({ enabled: true, default: "light" }), META_LIGHT);
  eq("meta default dark is the contract color", metaColorFor({ enabled: true, default: "dark" }), META_DARK);
  ok("contract colors are not #ffffff", META_LIGHT !== "#ffffff" && META_DARK !== "#ffffff");
}

// ================= 8. TOKEN-PARITY: globals.css back-compat gate =================
function testGlobalsParity() {
  console.log("\n# globals.css parity: the one-light back-compat rule (release gate)");
  const css = readFileSync(join(ROOT, "app", "globals.css"), "utf8");
  // The rescoped back-compat rule MUST exist (craft-only demos still render dark).
  ok("back-compat rule present", css.includes('[data-craft~="one-light"]:not([data-theme])'));
  // NO bare unconditional one-light selector may survive: every occurrence of the token
  // selector must be immediately followed by :not([data-theme]). This pins the rescope so a
  // future edit cannot reintroduce the unconditional dark remap (which would fight the theme).
  const bare = css.match(/\[data-craft~="one-light"\](?!:not\(\[data-theme\]\))/g) || [];
  eq("no bare [data-craft~=one-light] remains", bare, []);
  // The dual-theme surface exists and keys off [data-theme].
  ok("theme backdrop keys off [data-theme]", css.includes(":root[data-theme] body"));
  ok("dark machine-room keys off [data-theme=dark]", css.includes(':root[data-theme="dark"] .hero'));
  ok("the 44px nav toggle is styled", /\.theme-btn\s*\{/.test(css) && css.includes("width: 44px"));
}

testColorMath();
testDeriveAnchors();
testDeriveWcag();
testResolve();
testSheet();
testScripts();
testSsrAndMeta();
testGlobalsParity();

// ================= 9. R5.1 group tokens: glass / shadows / status =================
function testGroupTokens() {
  console.log("\n# deriveGroupTokens + emission (R5.1 glass / shadows / status)");
  const gl = deriveGroupTokens(BRAND, "light");
  const gd = deriveGroupTokens(BRAND, "dark");
  ["fill", "edge", "lineTop", "glow"].forEach((k) => ok("light glass." + k + " present", gl.glass[k] != null));
  ["sm", "md", "lg"].forEach((k) => ok("dark shadows." + k + " present", gd.shadows[k] != null));
  eq("status keys are the four semantic hues", STATUS_KEYS, ["amber", "blue", "green", "red"]);
  STATUS_KEYS.forEach((k) =>
    ok("light status." + k + " is an [ink,bg] pair", Array.isArray(gl.status[k]) && gl.status[k].length === 2),
  );
  // green status ties to the brand accent (var(--rl-green)); the other three are fixed semantic hues.
  ok("status.green derives off the brand green", gl.status.green[0].includes("var(--rl-green)"));
  ok("status.amber is a fixed semantic hue", gl.status.amber[1].includes("#c9962f"));
  // resolveTheme: a partial palette glass completes from the derive (per-FIELD merge).
  const r = resolveTheme({ enabled: true, palette: { light: { glass: { fill: "rgba(1,2,3,.5)" } } } }, BRAND);
  eq("palette glass.fill used verbatim", r.light.glass.fill, "rgba(1,2,3,.5)");
  ok("omitted glass.edge completes from derive", r.light.glass.edge != null && r.light.glass.edge !== "rgba(1,2,3,.5)");
  // A supplied status pair is used verbatim; an omitted one derives.
  const r2 = resolveTheme({ enabled: true, palette: { dark: { status: { amber: ["#111", "#222"] } } } }, BRAND);
  eq("palette status.amber used verbatim", r2.dark.status.amber, ["#111", "#222"]);
  ok("omitted status.blue completes from derive", Array.isArray(r2.dark.status.blue));
  // tokenSheetCss emits the group vars for both themes (no undefined leaks: derive fills every field).
  const css = tokenSheetCss(resolveTheme({ enabled: true, palette: { light: {}, dark: {} } }, BRAND));
  [
    "--rl-glass-fill",
    "--rl-glass-line-top",
    "--rl-glass-glow",
    "--rl-shadow-sm",
    "--rl-shadow-md",
    "--rl-shadow-lg",
    "--rl-status-amber-ink",
    "--rl-status-amber-bg",
    "--rl-status-green-bg",
    "--rl-status-red-ink",
  ].forEach((v) => ok("sheet emits " + v, css.includes(v + ":")));
  ok("no undefined leaks into the group vars", !/--rl-(glass|shadow|status)[a-z-]*:undefined/.test(css));
}

// ================= 10. R5.1 craft + motion CSS: config-gated, brand-neutral =================
function testCraftCss() {
  console.log("\n# globals.css: R5.1 craft + motion layer (config-gated, brand-neutral)");
  const css = readFileSync(join(ROOT, "app", "globals.css"), "utf8");
  // Glass / shadow / status token DEFAULTS derive from the two brand colors (the no-theme
  // "glass for free from your two colors" path); the theme layer overrides them per-theme.
  ok("glass default derives from --color-bg", /--rl-glass-fill:\s*color-mix\(in srgb,\s*var\(--color-bg\)/.test(css));
  ok("shadow default derives from --color-text", /--rl-shadow-md:[^;]*var\(--color-text\)/.test(css));
  ok("status default present (amber)", css.includes("--rl-status-amber-ink:"));
  // glassHover is opt-in (data-craft glass), backdrop-blur(12px) saturate(1.4), pointer glow --mx/--my.
  ok("glass hover is data-craft gated", css.includes('[data-craft~="glass"]'));
  ok("glass uses backdrop-blur(12px) saturate(1.4)", css.includes("backdrop-filter: blur(12px) saturate(1.4)"));
  ok("glass glow reads --mx/--my", css.includes("var(--mx, 50%)") && css.includes("var(--my, 24%)"));
  // Fine-pointer only (degrades to a static card on coarse / no-hover), with a no-blur fallback.
  ok("glass hover is fine-pointer gated", css.includes("@media (hover: hover) and (pointer: fine)"));
  ok("glass has a no-backdrop-filter fallback", /@supports not \(\(backdrop-filter/.test(css));
  // Gradient price: ONLY the highlighted plan (.plan--hot-gradient), the sanctioned clip.
  ok("gradient price scoped to .plan--hot-gradient", css.includes(".plan--hot-gradient .plan__price"));
  ok("gradient price uses background-clip: text", css.includes("background-clip: text"));
  // aurora / hero-motion / magnetic are each data-craft gated (nothing renders unless opted in).
  ok("aurora is data-craft gated", css.includes('[data-craft~="aurora"]'));
  ok("hero-motion is data-craft gated", css.includes('[data-craft~="hero-motion"]'));
  ok("magnetic is data-craft gated", css.includes('[data-craft~="magnetic"]'));
  // Reduced-motion HARD CONTRACT: the hero hidden initial state is scoped to no-preference (so
  // reduced motion shows content), and a reduce block neutralizes the glass lift + magnetic translate.
  ok("hero hidden state scoped to no-preference", css.includes("@media (prefers-reduced-motion: no-preference)"));
  ok(
    "reduce block neutralizes the glass lift",
    /@media \(prefers-reduced-motion: reduce\)[\s\S]*data-craft~="glass"[\s\S]*transform: none/.test(css),
  );
  ok("reduce block neutralizes the magnetic translate", css.includes("translate: none"));
  // Brand-neutrality: no RiseLynk green literal is baked into the new layer.
  ok("no RiseLynk green literal (#0c6b52) in the craft layer", !css.includes("#0c6b52"));
  ok("no RiseLynk dark green literal (#5dcaa5) in the craft layer", !css.includes("#5dcaa5"));
}

testGroupTokens();
testCraftCss();

console.log("\n" + (failed ? "FAILED " + failed + " / " : "PASSED all ") + (passed + failed) + " checks");
process.exit(failed ? 1 : 0);
