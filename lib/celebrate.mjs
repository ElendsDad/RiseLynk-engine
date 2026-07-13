// =============================================================================
// Config-gated form-success celebration (Section.celebrate?: "confetti").
//
// Vendored first-party: the engine self-hosts canvas-confetti v1.9.3 (ISC) at
// public/vendor/canvas-confetti-1.9.3.min.js. Provenance and the verbatim
// upstream license live beside the asset (public/vendor/canvas-confetti-LICENSE.md).
// The engine's zero-third-party-network contract forbids any CDN script tag,
// so the ONLY script URL here is same-origin.
//
// Contract (each point enforced by tools/celebrate.test.mjs):
//   - Default OFF. Nothing loads unless a section sets celebrate: "confetti"
//     AND a visitor actually reaches the form-success path (lazy, on success).
//   - prefers-reduced-motion: reduce means no script and no animation.
//   - Fails silently: offline, a 404, or an old browser resolves false and the
//     success message is never disturbed.
//   - Loads once: repeat successes reuse the single injected script tag.
//   - No new runtime npm dependency; the loader is this file plus one asset.
//
// Plain .mjs on purpose: the same shared-module pattern as lib/trust.mjs and
// lib/theme-tokens.mjs, so the Node gate harness imports the exact code the
// client components run, no TypeScript toolchain required.
// =============================================================================

// Root-relative on purpose: same-origin, works under any domain a site deploys to.
export const CONFETTI_SRC = "/vendor/canvas-confetti-1.9.3.min.js";

// One promise per page: the script tag is injected at most once.
let loader = null;

// Test seam: reset the module memo between harness cases.
export function _resetForTest() {
  loader = null;
}

function reducedMotion(win) {
  try {
    return !!(win.matchMedia && win.matchMedia("(prefers-reduced-motion: reduce)").matches);
  } catch {
    // A misbehaving matchMedia is never a reason to disturb the success path;
    // skip the celebration (the conservative side).
    return true;
  }
}

// Inject the vendored script once; resolve the confetti function or null.
// Never rejects, so a caller cannot be broken by a load failure.
function loadConfetti(win) {
  if (typeof win.confetti === "function") return Promise.resolve(win.confetti);
  if (!loader) {
    loader = new Promise((resolve) => {
      try {
        const s = win.document.createElement("script");
        s.src = CONFETTI_SRC;
        s.async = true;
        s.onload = () => resolve(typeof win.confetti === "function" ? win.confetti : null);
        s.onerror = () => resolve(null); // offline or missing asset: fail silently
        win.document.head.appendChild(s);
      } catch {
        resolve(null);
      }
    });
  }
  return loader;
}

// Fire the celebration for a form success, honoring the config gate and the
// guards. Resolves true only when confetti actually fired. `celebrate` is the
// section's config value; callers fire-and-forget (`void celebrateSuccess(...)`).
export async function celebrateSuccess(celebrate, win = typeof window === "undefined" ? null : window) {
  if (celebrate !== "confetti") return false; // config gate: default OFF
  if (!win || !win.document) return false; // SSR or non-DOM environment
  if (reducedMotion(win)) return false; // motion guard
  const confetti = await loadConfetti(win);
  if (typeof confetti !== "function") return false; // feature-detect window.confetti
  try {
    // disableForReducedMotion doubles the matchMedia guard inside the library.
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.7 }, disableForReducedMotion: true });
    return true;
  } catch {
    return false;
  }
}
