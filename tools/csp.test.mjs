// =============================================================================
// site-engine - config-extendable CSP connect-src gate (v0.24.1, feedback #31a)
//
//   node tools/csp.test.mjs
//
// Unit-tests lib/csp.mjs directly (pure, dependency-free): the origin-shape
// validator, the accept/reject partitioning, and the final directive builder.
// tools/security-headers.test.mjs additionally proves the wiring into
// next.config.ts's real headers() output against the active site config.
//
// Zero dependencies: node:assert only. Exit code is non-zero on any failure.
// =============================================================================

import assert from "node:assert/strict";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const { validateConnectSrcOrigin, partitionConnectSrcEntries, buildConnectSrcDirective } = await import(
  "file://" + resolve(here, "../lib/csp.mjs")
);

let passed = 0;
const ok = (name, cond) => {
  if (cond) { passed++; console.log("  ok  " + name); }
  else { console.log("FAIL  " + name); process.exitCode = 1; }
};

const BASE = ["'self'", "https://challenges.cloudflare.com"];

console.log("\n# validateConnectSrcOrigin: accepts a bare https origin");
ok("a plain https origin is valid", validateConnectSrcOrigin("https://api.example.com").ok === true);
ok("an https origin with a port is valid", validateConnectSrcOrigin("https://api.example.com:8443").ok === true);

console.log("\n# validateConnectSrcOrigin: rejects everything that is not exactly that");
ok("non-string is rejected", validateConnectSrcOrigin(42).reason === "not_a_string");
ok("empty string is rejected", validateConnectSrcOrigin("").reason === "empty");
ok("whitespace-only is rejected", validateConnectSrcOrigin("   ").reason === "empty");
ok("a wildcard subdomain is rejected (no wildcards beyond host)", validateConnectSrcOrigin("https://*.example.com").reason === "wildcard_not_allowed");
ok("a bare wildcard is rejected", validateConnectSrcOrigin("*").reason === "wildcard_not_allowed");
ok("http (non-https) is rejected", validateConnectSrcOrigin("http://api.example.com").reason === "https_only");
ok("javascript: is rejected", validateConnectSrcOrigin("javascript:alert(1)").reason === "https_only");
ok("data: is rejected", validateConnectSrcOrigin("data:text/plain,hi").reason === "https_only");
ok("a path is rejected (origins only, no path)", validateConnectSrcOrigin("https://api.example.com/v1").reason === "origin_only_no_path");
ok("a trailing slash is rejected", validateConnectSrcOrigin("https://api.example.com/").reason === "origin_only_no_path");
ok("a query string is rejected", validateConnectSrcOrigin("https://api.example.com?x=1").reason === "origin_only_no_path");
ok("embedded credentials are rejected (origin diverges)", validateConnectSrcOrigin("https://user:pass@api.example.com").reason === "origin_only_no_path");
ok("a CSP keyword is rejected (not a URL)", validateConnectSrcOrigin("'self'").reason === "not_a_url");
ok("garbage is rejected (not a URL)", validateConnectSrcOrigin("not-a-url-at-all").reason === "not_a_url");
ok("internal whitespace is rejected before URL parsing", validateConnectSrcOrigin("https://api.example.com and more").reason === "whitespace_in_origin");

console.log("\n# partitionConnectSrcEntries: additive default");
{
  const { accepted, rejected } = partitionConnectSrcEntries(BASE, undefined);
  ok("undefined extra -> nothing accepted", accepted.length === 0);
  ok("undefined extra -> nothing rejected", rejected.length === 0);
}
{
  const { accepted, rejected } = partitionConnectSrcEntries(BASE, []);
  ok("empty array extra -> nothing accepted", accepted.length === 0);
  ok("empty array extra -> nothing rejected", rejected.length === 0);
}
{
  const { accepted, rejected } = partitionConnectSrcEntries(BASE, null);
  ok("null extra -> treated as empty (no throw)", accepted.length === 0 && rejected.length === 0);
}

console.log("\n# partitionConnectSrcEntries: extension + rejection + dedupe");
{
  const extra = [
    "https://control-plane.example.com",
    "https://*.evil.com",
    "http://insecure.example.com",
    "https://good.example.com/path",
    "https://control-plane.example.com", // duplicate of an earlier accepted entry
    "https://challenges.cloudflare.com", // duplicate of a BASE entry
    "'self'", // duplicate of a BASE entry, and not a URL either way
  ];
  const { accepted, rejected } = partitionConnectSrcEntries(BASE, extra);
  ok("exactly the two genuinely-new valid origins are accepted", accepted.length === 1);
  ok("the accepted origin is the real new one", accepted[0] === "https://control-plane.example.com");
  ok("three malformed entries are rejected", rejected.filter((r) => ["wildcard_not_allowed", "https_only", "origin_only_no_path"].includes(r.reason)).length === 3);
  ok("the wildcard entry carries its own reason", rejected.some((r) => r.value === "https://*.evil.com" && r.reason === "wildcard_not_allowed"));
  ok("dedupe against BASE is silent (not reported as rejected)", !rejected.some((r) => r.value === "https://challenges.cloudflare.com"));
  // "'self'" is BOTH already in BASE and not a valid https origin on its own terms; validation
  // runs before the dedupe check, so it is reported honestly (not_a_url) rather than silently
  // waved through as "just a duplicate".
  ok("a CSP-keyword duplicate of a BASE entry is still reported as invalid", rejected.some((r) => r.value === "'self'" && r.reason === "not_a_url"));
}

console.log("\n# buildConnectSrcDirective: additive-contract proof");
{
  const abs = buildConnectSrcDirective(BASE, undefined);
  ok("absent extra reproduces the base directive byte-for-byte", abs.value === "'self' https://challenges.cloudflare.com");
  ok("absent extra -> nothing accepted", abs.accepted.length === 0);
  ok("absent extra -> nothing rejected", abs.rejected.length === 0);
}
{
  const ext = buildConnectSrcDirective(BASE, ["https://portal.example.com"]);
  ok("a valid extension is appended after the base, in order", ext.value === "'self' https://challenges.cloudflare.com https://portal.example.com");
}
{
  const mixed = buildConnectSrcDirective(BASE, ["https://portal.example.com", "https://*.evil.com"]);
  ok("the valid entry is appended and the invalid one is silently excluded from the value", mixed.value === "'self' https://challenges.cloudflare.com https://portal.example.com");
  ok("the invalid entry is still reported for the caller to log", mixed.rejected.length === 1 && mixed.rejected[0].value === "https://*.evil.com");
}

console.log(`\n${passed} checks passed`);
process.exit(process.exitCode || 0);
