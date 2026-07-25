// =============================================================================
// SEC hardening FIX 6: response-header defense-in-depth.
//
//   node tools/security-headers.test.mjs
//
// Proves next.config.ts emits, on every route, the baseline Content-Security-Policy added in FIX 6
// alongside the X-Content-Type-Options: nosniff shipped in v0.18.0. A gate so the CSP cannot silently
// regress: object-src 'none' plus base-uri / frame-ancestors / form-action 'self' are the load-bearing
// directives that blunt the same-origin active-content and form-hijack classes.
//
// v0.24.1 (feedback #31a): next.config.mjs was renamed next.config.ts so it can resolve the ACTIVE
// site config at build time (see that file's own doc comment for why: Next's own next.config.ts SWC
// pipeline, not Node's experimental type stripping, which is not guaranteed at this repo's declared
// Node floor). The dynamic import below picks that up via plain Node ESM import - this repo's own dev
// tooling only, not the production build path (next.config.ts's build-time guarantee comes from Next's
// bundled SWC compiler, exercised for real by `npm run build` in tools/hydrate.buildcheck.mjs and by
// this release's manual build-green proof, not by this test's own import mechanism). The connect-src
// extension/rejection logic itself (lib/csp.mjs) has its own dedicated unit gate, tools/csp.test.mjs;
// this file additionally proves the WIRING - that headers() over the real active config (no
// security.connectSrc set) reproduces today's exact connect-src, unchanged.
//
// Zero dependencies: node:assert only. Exit code is non-zero on any failure.
// =============================================================================

import assert from "node:assert/strict";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

// This test drives next.config.ts's real headers() output, which requires actually loading
// next.config.ts (and, via its own top-level require(), the active site config). Plain Node's
// dynamic import() below is NOT Next's own SWC-based next.config.ts pipeline (see next.config.ts's
// doc comment) - it only has Node's native TypeScript handling, which does not understand the `@/`
// path alias. The checked-in root seam (site.config.ts) re-exports the active demo via exactly
// that alias (`export { site } from "@/examples/elevator-demo/site.config";`), so this test points
// SITE_CONFIG_PATH at the SAME underlying file directly (an absolute path, no alias involved) -
// the exact config `npm run build` uses today, just reached without going through the aliased
// re-export this harness cannot follow. next.config.ts itself already respects SITE_CONFIG_PATH
// (the same seam a real external consumer config uses), so this is not a test-only code path.
process.env.SITE_CONFIG_PATH = resolve(here, "../examples/elevator-demo/site.config.ts");
const cfg = (await import("file://" + resolve(here, "../next.config.ts"))).default;
const { buildConnectSrcDirective } = await import("file://" + resolve(here, "../lib/csp.mjs"));
const {
  analyticsConnectSrcExtras,
  analyticsScriptSrcExtras,
} = await import("file://" + resolve(here, "../lib/analytics.mjs"));

let passed = 0;
const ok = (name, cond) => {
  if (cond) { passed++; console.log("  ok  " + name); }
  else { console.log("FAIL  " + name); process.exitCode = 1; }
};

const rules = await cfg.headers();
ok("headers() returns at least one rule", Array.isArray(rules) && rules.length > 0);

const pairs = rules.flatMap((r) => r.headers.map((h) => [String(h.key).toLowerCase(), h.value]));
const byKey = new Map(pairs);

ok("X-Content-Type-Options: nosniff present", byKey.get("x-content-type-options") === "nosniff");

// HSTS (added 2026-07-14 for the riselynk.com apex served by this engine build). Force HTTPS,
// two years, includeSubDomains, and deliberately no `preload` yet (a preload submission is hard
// to reverse - the RiseLynk trust-signals founder runbook keeps it out until the header is proven).
const hsts = byKey.get("strict-transport-security");
ok("Strict-Transport-Security present", typeof hsts === "string" && hsts.length > 0);
ok("HSTS max-age is at least one year", /max-age=(\d+)/.test(hsts || "") && Number((hsts.match(/max-age=(\d+)/) || [])[1]) >= 31536000);
ok("HSTS asserts includeSubDomains", /includeSubDomains/i.test(hsts || ""));
ok("HSTS has no preload yet (deliberate)", !/preload/i.test(hsts || ""));

const csp = byKey.get("content-security-policy");
ok("Content-Security-Policy present (FIX 6)", typeof csp === "string" && csp.length > 0);
ok("CSP sets default-src 'self'", /(^|;)\s*default-src 'self'/.test(csp || ""));
ok("CSP sets object-src 'none'", /(^|;)\s*object-src 'none'/.test(csp || ""));
ok("CSP sets base-uri 'self'", /(^|;)\s*base-uri 'self'/.test(csp || ""));
ok("CSP sets frame-ancestors 'self'", /(^|;)\s*frame-ancestors 'self'/.test(csp || ""));
ok("CSP sets form-action 'self'", /(^|;)\s*form-action 'self'/.test(csp || ""));

ok("a rule applies to every route (/:path*)", rules.some((r) => r.source === "/:path*"));

// v0.24.1 (feedback #31a): config-extendable connect-src. The active site config committed at
// this tag (examples/elevator-demo/site.config.ts, via the site.config.ts seam) sets no
// `security.connectSrc`, so the byte-for-byte-unchanged proof is a direct assertion against the
// REAL headers() output above - this is the additive-contract proof, not a synthetic fixture.
ok(
  "default-unchanged: connect-src is exactly 'self' + the Turnstile host with no active security.connectSrc",
  /(^|;)\s*connect-src 'self' https:\/\/challenges\.cloudflare\.com(;|$)/.test(csp || ""),
);

// Teardown P2 7j: config-extendable frame-src. Active elevator-demo sets no
// security.frameSrc, so the baseline Turnstile-only frame-src must hold.
ok(
  "default-unchanged: frame-src is exactly the Turnstile host with no active security.frameSrc",
  /(^|;)\s*frame-src https:\/\/challenges\.cloudflare\.com(;|$)/.test(csp || ""),
);
{
  const withFrame = buildConnectSrcDirective(["https://challenges.cloudflare.com"], [
    "https://www.youtube-nocookie.com",
  ]);
  ok(
    "extension: a valid security.frameSrc entry is appended after the base",
    withFrame.value === "https://challenges.cloudflare.com https://www.youtube-nocookie.com",
  );
}

// The extension and rejection cases exercise lib/csp.mjs directly (its own dedicated unit gate is
// tools/csp.test.mjs) with the SAME base list next.config.ts wires in, proving the header-level
// composition end to end without needing to mutate the real active site config.
const BASE_CONNECT_SRC = ["'self'", "https://challenges.cloudflare.com"];
{
  const withExtension = buildConnectSrcDirective(BASE_CONNECT_SRC, ["https://control-plane.example.com"]);
  ok(
    "extension: a valid security.connectSrc entry is appended after the base",
    withExtension.value === "'self' https://challenges.cloudflare.com https://control-plane.example.com",
  );
}
{
  const withRejection = buildConnectSrcDirective(BASE_CONNECT_SRC, ["https://*.evil.com", "http://insecure.example.com"]);
  ok("rejection: a wildcard/non-https entry never reaches the directive value", withRejection.value === BASE_CONNECT_SRC.join(" "));
  ok("rejection: both bad entries are reported back for the caller to log", withRejection.rejected.length === 2);
}

// Trust pack: Cloudflare Web Analytics CSP. Active elevator-demo has no
// cloudflareToken, so the REAL headers() output must NOT mention the insights
// hosts (additive). When a token IS present, the same helpers next.config.ts
// uses append the documented manual-embed hosts.
ok(
  "default-unchanged: script-src has no cloudflareinsights host without a token",
  /(^|;)\s*script-src 'self' 'unsafe-inline' https:\/\/challenges\.cloudflare\.com(;|$)/.test(csp || ""),
);
ok(
  "default-unchanged: connect-src has no cloudflareinsights.com without a token",
  !/cloudflareinsights\.com/.test(csp || ""),
);
{
  const extras = analyticsConnectSrcExtras({ cloudflareToken: "tok" });
  const withCf = buildConnectSrcDirective(BASE_CONNECT_SRC, extras);
  ok(
    "CF analytics token appends https://cloudflareinsights.com to connect-src",
    withCf.value === "'self' https://challenges.cloudflare.com https://cloudflareinsights.com",
  );
  ok(
    "CF analytics token adds static.cloudflareinsights.com to script-src extras",
    JSON.stringify(analyticsScriptSrcExtras({ cloudflareToken: "tok" })) ===
      JSON.stringify(["https://static.cloudflareinsights.com"]),
  );
}

console.log(`\n${passed} checks passed`);
process.exit(process.exitCode || 0);
