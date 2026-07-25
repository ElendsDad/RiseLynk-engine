// =============================================================================
// site-engine - Cloudflare Web Analytics + CSP extras (trust pack)
//
//   node tools/analytics.test.mjs
//
// Proves:
//   - a cloudflareToken resolves to the official beacon src + data-cf-beacon payload
//   - absent/blank token is a no-op (additive: no analytics, no CSP extras)
//   - when a token is present, script-src and connect-src extras match Cloudflare's
//     documented manual-embed CSP (static.cloudflareinsights.com / cloudflareinsights.com)
//   - cookieNotice stays unnecessary for CF-analytics-only (cookieless); the helper
//     reports that fact so schema/docs and the runbook stay honest
// =============================================================================

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const {
  resolveCloudflareBeacon,
  analyticsScriptSrcExtras,
  analyticsConnectSrcExtras,
  cloudflareAnalyticsSetsCookies,
} = await import("file://" + resolve(here, "../lib/analytics.mjs"));

let passed = 0;
const ok = (name, cond) => {
  if (cond) { passed++; console.log("  ok  " + name); }
  else { console.log("FAIL  " + name); process.exitCode = 1; }
};
const eq = (name, a, b) => ok(name + " (" + JSON.stringify(a) + ")", a === b);

console.log("\n# resolveCloudflareBeacon: token -> official beacon attrs");
{
  const b = resolveCloudflareBeacon({ cloudflareToken: "tok_abc123" });
  ok("present token yields a beacon", b !== null);
  eq("src is the Cloudflare insights beacon", b.src, "https://static.cloudflareinsights.com/beacon.min.js");
  eq("data-cf-beacon carries the token JSON", b.dataCfBeacon, JSON.stringify({ token: "tok_abc123" }));
}
ok("absent analytics -> null", resolveCloudflareBeacon(undefined) === null);
ok("empty object -> null", resolveCloudflareBeacon({}) === null);
ok("blank token -> null", resolveCloudflareBeacon({ cloudflareToken: "   " }) === null);
ok("whitespace-only token does not invent a beacon", resolveCloudflareBeacon({ cloudflareToken: "\t" }) === null);

console.log("\n# CSP extras: only when a real cloudflareToken is set");
eq(
  "no token -> no script-src extras (additive)",
  JSON.stringify(analyticsScriptSrcExtras({})),
  "[]",
);
eq(
  "no token -> no connect-src extras (additive)",
  JSON.stringify(analyticsConnectSrcExtras({})),
  "[]",
);
eq(
  "token -> script-src host for the beacon",
  JSON.stringify(analyticsScriptSrcExtras({ cloudflareToken: "tok" })),
  JSON.stringify(["https://static.cloudflareinsights.com"]),
);
eq(
  "token -> connect-src host for manual-embed beacon POSTs",
  JSON.stringify(analyticsConnectSrcExtras({ cloudflareToken: "tok" })),
  JSON.stringify(["https://cloudflareinsights.com"]),
);

console.log("\n# cookie notice: CF Web Analytics is cookieless");
ok(
  "cloudflareAnalyticsSetsCookies is false (cookieNotice stays OFF for analytics-only)",
  cloudflareAnalyticsSetsCookies() === false,
);

console.log(`\n${passed} checks passed`);
process.exit(process.exitCode || 0);
