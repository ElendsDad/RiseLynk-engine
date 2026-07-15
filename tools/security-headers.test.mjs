// =============================================================================
// SEC hardening FIX 6: response-header defense-in-depth.
//
//   node tools/security-headers.test.mjs
//
// Proves next.config.mjs emits, on every route, the baseline Content-Security-Policy added in FIX 6
// alongside the X-Content-Type-Options: nosniff shipped in v0.18.0. A gate so the CSP cannot silently
// regress: object-src 'none' plus base-uri / frame-ancestors / form-action 'self' are the load-bearing
// directives that blunt the same-origin active-content and form-hijack classes.
//
// Zero dependencies: node:assert only. Exit code is non-zero on any failure.
// =============================================================================

import assert from "node:assert/strict";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const cfg = (await import("file://" + resolve(here, "../next.config.mjs"))).default;

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

console.log(`\n${passed} checks passed`);
process.exit(process.exitCode || 0);
