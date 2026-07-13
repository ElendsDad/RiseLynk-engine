// ============================================================
// site-engine - config-gated confetti celebration harness.
//
//   node tools/celebrate.test.mjs   (npm run test:celebrate)
//
// Proves the pure logic in lib/celebrate.mjs (the module both form components
// consume), the SAME shared-.mjs pattern as tools/theme-tokens.test.mjs. Plus
// the vendored-asset contract: the self-hosted canvas-confetti file exists, is
// same-origin only (no third-party URL in the code body), evaluates to a real
// window.confetti function, and ships with its ISC provenance notice. String-
// level wiring parity on the two components and the schema mirrors the
// token-parity precedent in tools/theme-tokens.test.mjs.
// ============================================================

import { fileURLToPath } from "node:url";
import { dirname, join, basename } from "node:path";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

const m = await import("file://" + join(ROOT, "lib", "celebrate.mjs"));
const { CONFETTI_SRC, celebrateSuccess, _resetForTest } = m;

let passed = 0, failed = 0;
const ok = (name, cond) => { if (cond) { passed++; console.log("  ok  " + name); } else { failed++; console.log("FAIL  " + name); } };

// A minimal DOM stub: records injected scripts; "load" resolves them with the
// staged confetti function, "error" simulates offline / a missing asset.
function fakeWindow({ reduced = false, behavior = "load", confettiOnLoad = null } = {}) {
  const scripts = [];
  const win = {
    matchMedia: (q) => ({ matches: reduced && q.includes("prefers-reduced-motion") }),
    document: {
      createElement: (tag) => ({ tagName: String(tag).toUpperCase() }),
      head: {
        appendChild(el) {
          scripts.push(el);
          queueMicrotask(() => {
            if (behavior === "load") {
              if (confettiOnLoad) win.confetti = confettiOnLoad;
              if (el.onload) el.onload();
            } else if (el.onerror) {
              el.onerror(new Error("offline"));
            }
          });
        },
      },
    },
    scripts,
  };
  return win;
}

// ================= 1. the config gate (default OFF) =================
{
  _resetForTest();
  const win = fakeWindow();
  ok("gate: absent flag fires nothing", (await celebrateSuccess(undefined, win)) === false && win.scripts.length === 0);
  ok("gate: unknown value fires nothing", (await celebrateSuccess("balloons", win)) === false && win.scripts.length === 0);
  ok("gate: SSR (no window) is a no-op", (await celebrateSuccess("confetti", null)) === false);
}

// ================= 2. the reduced-motion guard =================
{
  _resetForTest();
  const win = fakeWindow({ reduced: true });
  ok("reduced motion: no script, no fire", (await celebrateSuccess("confetti", win)) === false && win.scripts.length === 0);
}

// ================= 3. the happy path (lazy load + feature detect) =================
{
  _resetForTest();
  const calls = [];
  const win = fakeWindow({ confettiOnLoad: (opts) => calls.push(opts) });
  const fired = await celebrateSuccess("confetti", win);
  ok("success path fires confetti", fired === true && calls.length === 1);
  ok("script tag is the vendored same-origin asset", win.scripts.length === 1 && win.scripts[0].src === CONFETTI_SRC && win.scripts[0].async === true);
  ok("library-level reduced-motion double guard", calls[0] && calls[0].disableForReducedMotion === true);
  const again = await celebrateSuccess("confetti", win);
  ok("second success reuses the loaded script", again === true && win.scripts.length === 1 && calls.length === 2);
}

// ================= 4. offline / missing asset fails silently =================
{
  _resetForTest();
  const win = fakeWindow({ behavior: "error" });
  let threw = false;
  let fired = true;
  try { fired = await celebrateSuccess("confetti", win); } catch { threw = true; }
  ok("offline: resolves false, never throws", !threw && fired === false && win.scripts.length === 1);
}

// ================= 5. feature-detect: script loads but no confetti global =================
{
  _resetForTest();
  const win = fakeWindow(); // behavior "load" but confettiOnLoad stays null
  ok("no window.confetti after load: resolves false", (await celebrateSuccess("confetti", win)) === false);
}

// ================= 6. the vendored asset contract =================
{
  const assetPath = join(ROOT, "public", CONFETTI_SRC.replace(/^\//, ""));
  const src = readFileSync(assetPath, "utf8");
  ok("CONFETTI_SRC is root-relative same-origin", CONFETTI_SRC.startsWith("/") && !CONFETTI_SRC.startsWith("//") && !/^[a-z]+:/i.test(CONFETTI_SRC));
  ok("vendored file exists and is nonempty", src.length > 1000);
  ok("banner carries version + license", src.startsWith("/*!") && src.includes("canvas-confetti v1.9.3") && src.includes("ISC"));
  const body = src.slice(src.indexOf("*/") + 2);
  ok("zero third-party network: no URL literal in the code body", !/https?:\/\//.test(body));
  // The asset really is the library: evaluating it against a bare window yields
  // the window.confetti function the loader feature-detects.
  const sandbox = { window: {}, navigator: { userAgent: "node" } };
  sandbox.window.navigator = sandbox.navigator;
  vm.runInContext(src, vm.createContext(sandbox));
  ok("asset evaluates to a window.confetti function", typeof sandbox.window.confetti === "function");

  const notice = readFileSync(join(ROOT, "public", "vendor", "canvas-confetti-LICENSE.md"), "utf8");
  ok("provenance notice: package, version, ISC text, author", ["canvas-confetti", "1.9.3", "ISC License", "Kiril Vatev", "terser"].every((s) => notice.includes(s)));
}

// ================= 7. wiring parity (components + schema) =================
{
  for (const rel of ["components/sections/LeadForm.tsx", "components/sections/Contact.tsx"]) {
    const src = readFileSync(join(ROOT, rel), "utf8");
    ok(rel + " imports the shared loader", src.includes('from "@/lib/celebrate.mjs"'));
    ok(rel + " fires on the success path only", src.includes("void celebrateSuccess(section.celebrate);") && src.split("celebrateSuccess(").length === 2);
  }
  const schema = readFileSync(join(ROOT, "lib", "config-schema.ts"), "utf8");
  ok("schema carries the optional celebrate flag", schema.includes('celebrate?: "confetti";'));
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
