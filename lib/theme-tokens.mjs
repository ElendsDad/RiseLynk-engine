// =============================================================================
// site-engine - theme token engine (G1 toggle + G2 per-theme palette).
//
// Pure, dependency-free logic shared by lib/theme.ts (the Next build) and
// tools/theme-tokens.test.mjs (plain-Node parity + WCAG tests). Same shared-.mjs
// pattern as lib/trust.mjs and lib/offer-ld.mjs: the logic lives here in plain
// JS so it is unit-testable without a TypeScript toolchain, and the full render
// is additionally proven by the rendered-output build check on the demos.
//
// The model (founder-approved 2026-07-12):
//   - Dual theme, LIGHT is the default marketing surface, a user toggle to DARK.
//   - Mechanism: data-theme on <html>, storageKey rl_theme, a pre-paint inline
//     boot script, a 44px nav moon/sun toggle, a <meta name="theme-color"> swap.
//   - DARK = the R5 machine-room craft, retokenized to the design bundle's exact
//     dark tokens (byte-match goal); LIGHT is the precision-enterprise surface.
//   - Rich tokens are ALL namespaced --rl-* so NONE collides with an engine alias
//     (--color-*, --line, --surface, --muted, --grain-opacity). The alias bridge
//     maps a subset of --rl-* onto those engine aliases; the sheet OWNS them for a
//     theme-enabled site (P0 fixes: no --line self-alias, no inline pin on <html>).
//   - ACCENT = the single-hue green: --color-accent AND --color-primary both map to
//     --rl-green, so the eyebrow, focus ring, .btn--accent, .callbar, .quote,
//     .summary and the hero overlay all recolor to the brand green.
// =============================================================================

// The scalar rich-token contract, in emit order. Every value is a plain CSS value
// (hex, gradient, or number). A per-site palette supplies these VERBATIM; the
// derive fallback computes them from the two brand colors (see deriveTokens).
export const SCALAR_TOKEN_KEYS = [
  "bg",
  "bg2",
  "card",
  "card2",
  "line",
  "line2",
  "ink",
  "dim",
  "faint",
  "green",
  "greenHover",
  "onGreen",
  "greenWash",
  "eyebrow",
  "danger",
  "pageBleed",
  "heroGlow",
  "grainOpacity",
];

// camelCase token key -> the --rl-<kebab> custom property name.
export function rlVar(key) {
  return "--rl-" + key.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
}

// The alias bridge: engine alias custom property -> the --rl-* expression that feeds
// it. FIXED engine logic (a site tunes VALUES via the palette, never this mapping).
// Note there is NO --line self-reference (P0): --line is fed from --rl-line. And the
// grain opacity is NOT bridged onto --grain-opacity (the craft var); the theme
// backdrop reads --rl-grain-opacity directly, so the two never collide (P0).
export const ALIAS_BRIDGE = [
  ["--color-bg", "var(--rl-bg)"],
  ["--color-text", "var(--rl-ink)"],
  ["--color-primary", "var(--rl-green)"], // single-hue green brand
  ["--color-accent", "var(--rl-green)"], // accent = focus ring / contrast green (fills only)
  ["--color-eyebrow", "var(--rl-eyebrow)"], // eyebrow text: AA-clamped off green (feedback item #11)
  ["--surface", "var(--rl-bg2)"],
  ["--muted", "var(--rl-dim)"],
  ["--line", "var(--rl-line)"],
];

// The contract meta theme-color values (NOT #ffffff): light #fafaf7 / dark #0f1412.
export const META_LIGHT = "#fafaf7";
export const META_DARK = "#0f1412";

// ------------------------------- color math -------------------------------
// Small, exact sRGB helpers for the WCAG-AA clamp on the zero-config derived dark
// path. Concrete hex only (color-mix() strings are opaque to these, so derive keeps
// the contrast-critical pair - ink and bg - as concrete hex and computes the rest as
// color-mix() expressions off them).

export function hexToRgb(hex) {
  const h = String(hex).trim().replace(/^#/, "");
  const s = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(s, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgbToHex({ r, g, b }) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return "#" + c(r) + c(g) + c(b);
}

// Mix pctA% of hex a with the remainder of hex b, in plain sRGB (matches CSS
// color-mix(in srgb) closely enough for the derive path's concrete anchors).
export function mixHex(a, b, pctA) {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  const t = pctA / 100;
  return rgbToHex({ r: A.r * t + B.r * (1 - t), g: A.g * t + B.g * (1 - t), b: A.b * t + B.b * (1 - t) });
}

function channelLuminance(c) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);
}

export function contrastRatio(a, b) {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

// Pick #ffffff or a near-black ink for text sitting ON the given fill, by contrast.
export function onColor(fill) {
  return contrastRatio("#ffffff", fill) >= contrastRatio("#0b1a14", fill) ? "#ffffff" : "#0b1a14";
}

// WCAG-AA lightness clamp for the DERIVED dark path (P1). Walks `ink` toward `toward`
// (white on a dark ground, black on a light ground) until it clears `min` contrast on
// `bg`, or throws (fail the build) if even the endpoint cannot. Derived dark is labelled
// approximate in config; this guarantees it is at least legible.
export function clampInkForContrast(ink, bg, min = 4.5, toward = "#ffffff") {
  let cur = ink;
  for (let i = 0; i <= 20; i++) {
    if (contrastRatio(cur, bg) >= min) return cur;
    cur = mixHex(toward, cur, 5 + i * 5); // step ever further toward the endpoint
  }
  if (contrastRatio(toward, bg) >= min) return toward;
  throw new Error(
    `deriveTokens: cannot reach WCAG-AA (${min}:1) for ink on bg ${bg}; supply an explicit theme.palette`,
  );
}

// The eyebrow token (feedback-v0.5.0 item 11). One brand accent double-duties as the CTA fill
// (`.btn--accent`, needs to stay light/bright so its fixed dark button ink reads) and, unclamped,
// the `.eyebrow` small-caps text color sitting directly on the page bg (needs 4.5:1 AA) - a value
// tuned for the first rarely clears the second. Rather than pick one loser, derive a SEPARATE
// eyebrow ink from the same accent by reusing the derived-dark path's own WCAG-AA clamp: darken
// toward black on a light bg, lighten toward white on a dark bg, stopping the moment AA clears.
// An accent that already clears AA on its own bg is returned unchanged (no-op).
export function eyebrowColorFor(accent, bg, toward = "#000000") {
  return clampInkForContrast(accent, bg, 4.5, toward);
}

// ------------------------------- derive -------------------------------
// The zero-config fallback: build a full token set for one mode from the two brand
// colors. A site with an explicit theme.palette bypasses this entirely (its tokens are
// used verbatim). Derived DARK is APPROXIMATE and WCAG-AA clamped; a brand that wants a
// byte-exact surface supplies theme.palette.{light,dark}.
export function deriveTokens(brand, mode) {
  const primary = (brand && brand.colors && brand.colors.primary) || "#1f3a5f";
  const accent = (brand && brand.colors && brand.colors.accent) || "#0c6b52";
  if (mode === "dark") {
    const bg = mixHex(primary, "#0b0f0d", 12); // dark ground, faintly brand-tinted
    const ink = clampInkForContrast("#e7efea", bg, 4.5, "#ffffff");
    const green = mixHex(accent, "#ffffff", 58); // lift the brand accent for dark legibility
    return {
      bg,
      bg2: `color-mix(in srgb, ${bg} 82%, #ffffff)`,
      card: mixHex(primary, "#0b0f0d", 20),
      card2: mixHex(primary, "#0b0f0d", 30),
      line: `color-mix(in srgb, #ffffff 14%, transparent)`,
      line2: `color-mix(in srgb, #ffffff 22%, transparent)`,
      ink,
      dim: `color-mix(in srgb, ${ink} 72%, ${bg})`,
      faint: `color-mix(in srgb, ${ink} 55%, ${bg})`,
      green,
      greenHover: `color-mix(in srgb, ${green} 82%, #ffffff)`,
      onGreen: "#062018",
      greenWash: `color-mix(in srgb, ${green} 18%, ${bg})`,
      eyebrow: eyebrowColorFor(green, bg, "#ffffff"),
      danger: "#e08b8b",
      pageBleed: `linear-gradient(180deg, ${mixHex(primary, "#0b0f0d", 16)} 0%, #0b0f0d 60%, #08100d 100%)`,
      heroGlow: `radial-gradient(1200px 640px at 62% -18%, color-mix(in srgb, ${green} 22%, transparent), transparent 62%)`,
      grainOpacity: "0.05",
    };
  }
  // light
  const bg = (brand && brand.colors && brand.colors.bg) || "#fafaf8";
  let ink = (brand && brand.colors && brand.colors.text) || "#141a17";
  ink = clampInkForContrast(ink, bg, 4.5, "#000000");
  const green = accent;
  return {
    bg,
    bg2: `color-mix(in srgb, ${bg} 94%, ${ink})`,
    card: "#ffffff",
    card2: `color-mix(in srgb, ${bg} 90%, ${ink})`,
    line: `color-mix(in srgb, ${ink} 12%, ${bg})`,
    line2: `color-mix(in srgb, ${ink} 22%, ${bg})`,
    ink,
    dim: `color-mix(in srgb, ${ink} 72%, ${bg})`,
    faint: `color-mix(in srgb, ${ink} 55%, ${bg})`,
    green,
    greenHover: `color-mix(in srgb, ${green} 85%, #000000)`,
    onGreen: onColor(green),
    greenWash: `color-mix(in srgb, ${green} 12%, ${bg})`,
    eyebrow: eyebrowColorFor(green, bg, "#000000"),
    danger: "#a03d3d",
    pageBleed: `linear-gradient(180deg, ${bg} 0%, color-mix(in srgb, ${bg} 92%, ${green}) 100%)`,
    heroGlow: `radial-gradient(1100px 520px at 68% -20%, color-mix(in srgb, ${green} 10%, transparent), transparent 62%)`,
    grainOpacity: "0.03",
  };
}

// The grouped craft tokens: glass, shadows, and the four status pairs. Emitted per theme as
// --rl-glass-* / --rl-shadow-* / --rl-status-*. Unlike the contrast-critical scalar anchors these
// derive as color-mix() expressions off the SIBLING --rl-* tokens in the same selector, so they
// stay coherent with whatever card / green / ink / bg resolved to (a supplied palette or the
// derive). A site overrides any field via theme.palette.{light,dark}.{glass,shadows,status}.
export const STATUS_KEYS = ["amber", "blue", "green", "red"];

export function deriveGroupTokens(brand, mode) {
  // Semantic status anchors (brand-neutral hues). "green" ties to the brand accent (var(--rl-green))
  // so a status-green chip is on-brand; the other three are fixed muted semantic hues.
  const anchor = { amber: "#c9962f", blue: "#3f6fb0", green: "var(--rl-green)", red: "#b25050" };
  const status = {};
  for (const k of STATUS_KEYS) {
    const a = anchor[k];
    status[k] =
      mode === "dark"
        ? [`color-mix(in srgb, ${a} 72%, var(--rl-ink))`, `color-mix(in srgb, ${a} 22%, var(--rl-bg))`]
        : [`color-mix(in srgb, ${a} 58%, var(--rl-ink))`, `color-mix(in srgb, ${a} 16%, var(--rl-bg))`];
  }
  if (mode === "dark") {
    return {
      glass: {
        fill: "color-mix(in srgb, var(--rl-card) 62%, transparent)",
        edge: "color-mix(in srgb, #ffffff 10%, transparent)",
        lineTop: "color-mix(in srgb, var(--rl-green) 40%, transparent)",
        glow: "color-mix(in srgb, var(--rl-green) 14%, transparent)",
      },
      shadows: {
        sm: "0 1px 2px rgba(0,0,0,.35)",
        md: "0 10px 30px -8px rgba(0,0,0,.45)",
        lg: "0 24px 60px -16px rgba(0,0,0,.55)",
      },
      status,
    };
  }
  return {
    glass: {
      fill: "color-mix(in srgb, var(--rl-card) 72%, transparent)",
      edge: "color-mix(in srgb, #ffffff 75%, transparent)",
      lineTop: "color-mix(in srgb, var(--rl-green) 35%, transparent)",
      glow: "color-mix(in srgb, var(--rl-green) 18%, transparent)",
    },
    shadows: {
      sm: "0 1px 2px color-mix(in srgb, var(--rl-ink) 8%, transparent)",
      md: "0 10px 28px -10px color-mix(in srgb, var(--rl-ink) 14%, transparent)",
      lg: "0 24px 56px -18px color-mix(in srgb, var(--rl-ink) 20%, transparent)",
    },
    status,
  };
}

// Merge one theme side: derived scalars + derived groups as the base, then the palette side's
// scalar overrides (VERBATIM) and per-FIELD group overrides (a partial glass / shadows / status
// completes from the derive, so a byte-exact surface can supply only the fields it cares about).
function mergeSide(scalars, groups, palSide) {
  const p = palSide || {};
  const out = { ...scalars };
  for (const k of SCALAR_TOKEN_KEYS) if (p[k] != null) out[k] = p[k];
  out.glass = { ...groups.glass, ...(p.glass || {}) };
  out.shadows = { ...groups.shadows, ...(p.shadows || {}) };
  out.status = { ...groups.status };
  if (p.status) for (const k of STATUS_KEYS) if (p.status[k] != null) out.status[k] = p.status[k];
  return out;
}

// Resolve a config theme block + brand into the concrete { light, dark } token sets.
// palette.{light,dark} are used VERBATIM when present (byte-match); each missing side
// derives from the brand. A partial palette side is completed by the derive (scalars and groups).
export function resolveTheme(theme, brand) {
  const t = theme || {};
  const pal = t.palette || {};
  const light = mergeSide(deriveTokens(brand, "light"), deriveGroupTokens(brand, "light"), pal.light);
  const dark = mergeSide(deriveTokens(brand, "dark"), deriveGroupTokens(brand, "dark"), pal.dark);
  return { light, dark };
}

// ------------------------------- CSS emission -------------------------------

function rlBlock(tokens) {
  return SCALAR_TOKEN_KEYS.filter((k) => tokens[k] != null)
    .map((k) => `${rlVar(k)}:${tokens[k]}`)
    .join(";");
}

function bridgeBlock() {
  return ALIAS_BRIDGE.map(([alias, expr]) => `${alias}:${expr}`).join(";");
}

// Emit the grouped craft tokens for one theme: --rl-glass-* / --rl-shadow-* / --rl-status-*.
// The derive fills every field, so a resolved theme never leaks an undefined var; a field is
// skipped only if a caller passes a hand-built partial token set.
function groupBlock(tokens) {
  const parts = [];
  const g = tokens.glass || {};
  if (g.fill != null) parts.push(`--rl-glass-fill:${g.fill}`);
  if (g.edge != null) parts.push(`--rl-glass-edge:${g.edge}`);
  if (g.lineTop != null) parts.push(`--rl-glass-line-top:${g.lineTop}`);
  if (g.glow != null) parts.push(`--rl-glass-glow:${g.glow}`);
  const s = tokens.shadows || {};
  if (s.sm != null) parts.push(`--rl-shadow-sm:${s.sm}`);
  if (s.md != null) parts.push(`--rl-shadow-md:${s.md}`);
  if (s.lg != null) parts.push(`--rl-shadow-lg:${s.lg}`);
  const st = tokens.status || {};
  for (const k of STATUS_KEYS) {
    const pair = st[k];
    if (Array.isArray(pair) && pair.length === 2) {
      parts.push(`--rl-status-${k}-ink:${pair[0]}`);
      parts.push(`--rl-status-${k}-bg:${pair[1]}`);
    }
  }
  return parts.join(";");
}

// Emit one selector's full body: the namespaced scalar --rl-* tokens, then the grouped craft
// tokens (glass / shadows / status), then the alias bridge. The bridge is repeated per selector
// so each theme is self-contained.
function themeRule(selector, tokens) {
  const groups = groupBlock(tokens);
  return `${selector}{${rlBlock(tokens)};${groups ? groups + ";" : ""}${bridgeBlock()}}`;
}

// The server-rendered token sheet (P1: pinned first-child-of-body, no precedence).
// LIGHT owns [data-theme="light"] AND the no-attribute default (:root:not([data-theme]),
// so a system site with JS disabled still gets the light surface); DARK owns
// [data-theme="dark"] and the prefers-color-scheme:dark side of the no-attribute default
// (P2: a system default emits NO SSR data-theme, so this media query can fire).
export function tokenSheetCss({ light, dark }) {
  return [
    themeRule(`:root[data-theme="light"],:root:not([data-theme])`, light),
    `@media (prefers-color-scheme:dark){${themeRule(`:root:not([data-theme])`, dark)}}`,
    themeRule(`:root[data-theme="dark"]`, dark),
  ].join("\n");
}

// ------------------------------- runtime scripts -------------------------------

// Pre-paint boot: runs synchronously before first paint so there is no flash of the
// wrong scheme. A stored rl_theme wins; else a "system" default follows the OS, and a
// "light"/"dark" default resolves to itself. Sets data-theme on <html>.
export function bootScript(defaultTheme = "light", storageKey = "rl_theme") {
  const d = defaultTheme === "dark" ? "dark" : defaultTheme === "system" ? "system" : "light";
  return (
    "(function(){var d=" +
    JSON.stringify(d) +
    ",t;try{t=localStorage.getItem(" +
    JSON.stringify(storageKey) +
    ");if(t!=='light'&&t!=='dark'){t=d==='system'?(window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):d;}}catch(e){t=d==='dark'?'dark':'light';}" +
    "document.documentElement.setAttribute('data-theme',t);})();"
  );
}

// The nav toggle runtime: wires the 44px button, persists the choice to rl_theme, and
// keeps <meta name="theme-color"> in step with the contract colors. Mirrors the design
// bundle's toggle verbatim in behavior.
export function toggleScript(storageKey = "rl_theme", metaLight = META_LIGHT, metaDark = META_DARK) {
  return (
    "(function(){var btn=document.getElementById('themeBtn');if(!btn)return;" +
    "var meta=document.querySelector('meta[name=\"theme-color\"]');" +
    "function label(){var dark=document.documentElement.getAttribute('data-theme')==='dark';" +
    "btn.setAttribute('aria-label',dark?'Switch to light theme':'Switch to dark theme');" +
    "if(meta)meta.setAttribute('content',dark?" +
    JSON.stringify(metaDark) +
    ":" +
    JSON.stringify(metaLight) +
    ");}label();" +
    "btn.addEventListener('click',function(){var next=document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark';" +
    "document.documentElement.setAttribute('data-theme',next);try{localStorage.setItem(" +
    JSON.stringify(storageKey) +
    ",next);}catch(e){}label();});})();"
  );
}

// The SSR data-theme attribute value: "light"/"dark" for those defaults, or undefined for
// "system" (P2: a system site must emit NO SSR data-theme so :root:not([data-theme]) and
// the media query can fire; the boot script sets it pre-paint).
export function ssrThemeAttr(theme) {
  if (!theme || !theme.enabled) return undefined;
  const d = theme.default;
  return d === "dark" ? "dark" : d === "system" ? undefined : "light";
}

// The initial <meta name="theme-color"> value for the SSR default (contract colors; the
// toggle script corrects it on load for a system->dark resolution).
export function metaColorFor(theme) {
  const t = theme || {};
  const light = (t.metaColor && t.metaColor.light) || META_LIGHT;
  const dark = (t.metaColor && t.metaColor.dark) || META_DARK;
  return t.default === "dark" ? dark : light;
}

export function themeEnabled(theme) {
  return !!(theme && theme.enabled);
}
