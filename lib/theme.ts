import type { CSSProperties } from "react";
import type { NavConfig, SiteConfig, ThemeConfig } from "./config-schema";
// The pure theme-token logic lives in a shared .mjs so it is unit-testable in plain Node
// (tools/theme-tokens.test.mjs) and consumed identically here by the Next build.
import {
  resolveTheme,
  tokenSheetCss,
  bootScript,
  toggleScript,
  ssrThemeAttr as ssrThemeAttrImpl,
  metaColorFor,
  themeEnabled as themeEnabledImpl,
} from "./theme-tokens.mjs";

// Maps the site's brand colors to CSS custom properties.
// Applied once on <html> in layout.tsx; every component themes off these vars.
// Change the two brand colors and the whole site reskins.
//
// Provenance: extracted 2026-07-10 from
// kitsap-website-creation/templates/brochure/lib/theme.ts (unchanged).
//
// P0 (theme layer): when a site enables the dual-theme block, the generated token sheet
// OWNS the engine aliases (--color-bg/-text/-primary/-accent) via the alias bridge, driven
// by [data-theme]. An inline custom-property on <html> beats the non-!important generated
// sheet, so pinning those aliases inline would keep them stuck on the light brand and dark
// would render half-applied. So we DROP the alias spread from the inline style when themed,
// and emit ONLY the font var (which the sheet does not set). A site with no theme block is
// unchanged: it still gets the full inline brand spread.
export function themeVars(brand: SiteConfig["brand"], theme?: ThemeConfig): CSSProperties {
  const c = brand.colors;
  const vars: Record<string, string> = {
    "--font-body":
      brand.font === "serif"
        ? 'Georgia, "Times New Roman", serif'
        : 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  };
  if (!themeEnabledImpl(theme)) {
    vars["--color-primary"] = c.primary;
    vars["--color-accent"] = c.accent;
    vars["--color-bg"] = c.bg ?? "#ffffff";
    vars["--color-text"] = c.text ?? "#16181d";
  }
  return vars as unknown as CSSProperties;
}

// --- Dual-theme layer (G1 + G2) TS-facing helpers over lib/theme-tokens.mjs ---

export function themeEnabled(theme?: ThemeConfig): boolean {
  return themeEnabledImpl(theme);
}

// The SSR data-theme attribute value, or undefined for a "system" default (P2).
export function ssrThemeAttr(theme?: ThemeConfig): string | undefined {
  return ssrThemeAttrImpl(theme);
}

// The server-rendered token sheet CSS for a theme-enabled site (per-theme --rl-* tokens plus
// the alias bridge). Empty string when the site has no theme block.
export function themeSheetCss(brand: SiteConfig["brand"], theme?: ThemeConfig): string {
  if (!themeEnabledImpl(theme)) return "";
  return tokenSheetCss(resolveTheme(theme, brand));
}

// The pre-paint boot script body (sets data-theme before first paint).
export function themeBootJs(theme?: ThemeConfig): string {
  if (!themeEnabledImpl(theme)) return "";
  return bootScript(theme?.default ?? "light");
}

// The nav-toggle runtime script body (wires the button, persists, swaps meta theme-color).
export function themeToggleJs(theme?: ThemeConfig): string {
  if (!themeEnabledImpl(theme)) return "";
  return toggleScript();
}

// The initial <meta name="theme-color"> for the SSR default (contract colors).
export function themeMetaColor(theme?: ThemeConfig): string {
  return metaColorFor(theme);
}

// --- R5 design-system structural craft ---
// The value for the <html data-craft> attribute: space-separated tokens the globals.css
// craft rules key off (`[data-craft~="one-light"]`, `~="grain"`, `~="fonts"`). Returns
// undefined when no craft is enabled, so a site without a `craft` block emits no attribute
// and is unchanged. Each token gates one pattern; a site opts into any subset.
export function craftDataAttr(craft: SiteConfig["craft"]): string | undefined {
  if (!craft) return undefined;
  const tokens: string[] = [];
  if (craft.oneLight) tokens.push("one-light");
  if (craft.grain) tokens.push("grain");
  if (craft.fonts) tokens.push("fonts");
  // R5.1 craft + motion tokens (each gates a [data-craft~="..."] rule block in globals.css).
  if (craft.glass) tokens.push("glass");
  if (craft.aurora) tokens.push("aurora");
  if (craft.magneticCta) tokens.push("magnetic");
  if (craft.heroMotion) tokens.push("hero-motion");
  return tokens.length ? tokens.join(" ") : undefined;
}

// The shared craft-motion runtime, injected once at the end of <body> (layout.tsx) only when a
// POINTER-driven effect is enabled: the glass pointer-glow (feeds --mx/--my) and the magnetic CTA
// pull. A single guard gates both: it bails entirely under prefers-reduced-motion and on any
// non-fine pointer, so on a phone or under reduced motion nothing attaches and the cards / buttons
// stay static (the master reduced-motion contract, settled instantly). Returns "" when neither
// effect is on, so a site that opts into neither emits no script. Aurora and hero-motion are pure
// CSS and need no JS, so they are not gated here.
export function craftMotionJs(craft: SiteConfig["craft"]): string {
  const glass = !!craft?.glass;
  const magnetic = !!craft?.magneticCta;
  if (!glass && !magnetic) return "";
  const glassJs = glass
    ? "document.querySelectorAll('.card,.quote,.product,.blogcard,.records__item,.svc-card,.mod').forEach(function(c){" +
      "c.addEventListener('pointermove',function(e){var r=c.getBoundingClientRect();" +
      "c.style.setProperty('--mx',(e.clientX-r.left)+'px');c.style.setProperty('--my',(e.clientY-r.top)+'px');},{passive:true});});"
    : "";
  const magneticJs = magnetic
    ? "document.querySelectorAll('.btn--primary,.btn--accent').forEach(function(b){var raf=0;" +
      "b.addEventListener('pointermove',function(e){if(raf)return;raf=requestAnimationFrame(function(){raf=0;" +
      "var r=b.getBoundingClientRect();var dx=((e.clientX-r.left)/r.width-0.5)*6;var dy=((e.clientY-r.top)/r.height-0.5)*6;" +
      "b.style.translate=Math.max(-3,Math.min(3,dx)).toFixed(1)+'px '+Math.max(-3,Math.min(3,dy)).toFixed(1)+'px';});},{passive:true});" +
      "b.addEventListener('pointerleave',function(){b.style.translate='0px 0px';});});"
    : "";
  return (
    "(function(){var mm=window.matchMedia;if(!mm)return;" +
    "if(mm('(prefers-reduced-motion: reduce)').matches)return;" +
    "if(!mm('(pointer: fine)').matches)return;" +
    glassJs +
    magneticJs +
    "})();"
  );
}

// Per-site craft tuning vars, merged onto <html> alongside themeVars. Only the key-light
// position and the grain opacity are tunable; everything else is derived in CSS from the two
// brand colors, so the two-color contract stays the single source of the palette.
export function craftVars(craft: SiteConfig["craft"]): CSSProperties {
  const vars: Record<string, string> = {};
  if (craft && typeof craft.oneLight === "object") {
    if (craft.oneLight.keyX) vars["--key-x"] = craft.oneLight.keyX;
    if (craft.oneLight.keyY) vars["--key-y"] = craft.oneLight.keyY;
  }
  if (craft && typeof craft.grain === "object" && typeof craft.grain.opacity === "number") {
    vars["--grain-opacity"] = String(craft.grain.opacity);
  }
  return vars as unknown as CSSProperties;
}

// The self-hosted OFL woff2 subsets to preload when craft.fonts is on (the above-the-fold
// faces: the display 800 and the mono 500). Same-origin paths, so zero third-party requests.
// Empty when fonts are off, so a site without the pairing emits no preload link.
export function craftFontPreloads(craft: SiteConfig["craft"]): string[] {
  return craft?.fonts ? ["/fonts/barlow-800.woff2", "/fonts/plex-mono-500.woff2"] : [];
}

// --- Nav condense runtime (NavConfig.condense) ---
// A tiny passive scroll listener that toggles `.is-scrolled` on the sticky header past a small
// threshold (scrollY > 12), so the header tightens (64->56px) as the page leaves the top. Pure
// class toggle, no motion of its own (the height transition is CSS, settled by the master reduced-
// motion guard). Returns "" when condense is off, so a site that does not opt in emits no script,
// and with JS off the header simply keeps its full height (no layout-shifting jump on load).
export function navChromeJs(nav?: NavConfig): string {
  if (!nav?.condense) return "";
  return (
    "(function(){var h=document.querySelector('.site-header');if(!h)return;" +
    "var on=function(){if(window.scrollY>12)h.classList.add('is-scrolled');else h.classList.remove('is-scrolled');};" +
    "on();window.addEventListener('scroll',on,{passive:true});})();"
  );
}
