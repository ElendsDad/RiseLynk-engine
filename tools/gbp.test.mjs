// =============================================================================
// Gate: Google Business Profile helpers (review CTA, sameAs URL, NAP drift).
//
//   node tools/gbp.test.mjs
//
// Proves:
//   - unset gbp is a no-op (additive / claims-walled)
//   - review CTA is a plain public https URL for every visitor (no sentiment gate)
//   - http / javascript / malformed URLs fail closed
//   - NAP warnings only when gbp mirrors are declared and drift
// =============================================================================

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const {
  REVIEW_CTA_LABEL,
  sanitizeGbpHttpsUrl,
  resolveGbp,
  resolveReviewCta,
  resolveGbpProfileUrl,
  gbpNapIssues,
  gbpConfigured,
} = await import("file://" + resolve(here, "../lib/gbp.mjs"));

let passed = 0;
const ok = (name, cond) => {
  if (cond) {
    passed++;
    console.log("  ok  " + name);
  } else {
    console.log("FAIL  " + name);
    process.exitCode = 1;
  }
};
const eq = (name, a, b) => ok(name + " (" + JSON.stringify(a) + ")", a === b);

console.log("\n# additive: unset gbp emits nothing");
ok("resolveGbp(undefined) has null URLs", resolveGbp(undefined).profileUrl === null);
ok("resolveReviewCta(undefined) is null", resolveReviewCta(undefined) === null);
ok("resolveGbpProfileUrl({}) is null", resolveGbpProfileUrl({}) === null);
ok("gbpConfigured({}) is false", gbpConfigured({}) === false);
ok("gbpNapIssues with no mirrors is empty", gbpNapIssues({ name: "Acme" }, undefined).length === 0);

console.log("\n# https URL guard");
eq("https profile kept", sanitizeGbpHttpsUrl("https://maps.google.com/?cid=1"), "https://maps.google.com/?cid=1");
ok("http rejected", sanitizeGbpHttpsUrl("http://maps.google.com/?cid=1") === null);
ok("javascript rejected", sanitizeGbpHttpsUrl("javascript:alert(1)") === null);
ok("protocol-relative rejected", sanitizeGbpHttpsUrl("//evil.example") === null);
ok("empty rejected", sanitizeGbpHttpsUrl("  ") === null);

console.log("\n# review CTA: equal ask, no sentiment path");
{
  const cta = resolveReviewCta({
    reviewUrl: "https://search.google.com/local/writereview?placeid=ChIJx",
  });
  ok("reviewUrl yields a CTA", cta !== null);
  eq("CTA label is the fixed public ask", cta.label, REVIEW_CTA_LABEL);
  eq(
    "CTA href is the public review URL verbatim",
    cta.href,
    "https://search.google.com/local/writereview?placeid=ChIJx",
  );
  // There is no API on this module that accepts a score, sentiment, or filter flag.
  const exported = Object.keys(
    await import("file://" + resolve(here, "../lib/gbp.mjs")),
  ).sort();
  ok(
    "no sentiment/filter/gate export exists",
    !exported.some((k) => /sentiment|filter|gate|score|route/i.test(k)),
  );
}

console.log("\n# profile / configured");
eq(
  "profileUrl resolves",
  resolveGbpProfileUrl({ profileUrl: "https://g.page/acme" }),
  "https://g.page/acme",
);
ok(
  "placeId alone counts as configured (operator paste, no invented URL)",
  gbpConfigured({ placeId: "ChIJx" }) === true,
);
ok(
  "reviewUrl alone counts as configured",
  gbpConfigured({ reviewUrl: "https://search.google.com/local/writereview?placeid=x" }) === true,
);

console.log("\n# NAP drift");
ok(
  "matching NAP is quiet",
  gbpNapIssues(
    { name: "Acme Plumbing", phone: "(360) 555-0100", address: "1 Main St, Port Orchard, WA" },
    {
      name: "Acme Plumbing",
      phone: "360-555-0100",
      address: "1 Main St, Port Orchard, WA",
    },
  ).length === 0,
);
{
  const issues = gbpNapIssues(
    { name: "Acme LLC", phone: "3605550100", address: "2 Other St" },
    { name: "Acme Plumbing", phone: "3605550199", address: "1 Main St" },
  );
  eq("three drift fields reported", issues.length, 3);
  ok(
    "name drift mentioned",
    issues.some((i) => i.field === "name" && /drifts/.test(i.message)),
  );
}
ok(
  "empty site field vs declared GBP WARNs",
  gbpNapIssues({ name: "Acme" }, { phone: "3605550100" }).some((i) => i.field === "phone"),
);
ok(
  "undeclared GBP phone never checks site phone",
  gbpNapIssues({ phone: "999" }, { name: "Acme" }).every((i) => i.field !== "phone"),
);

console.log(`\n${passed} checks passed`);
process.exit(process.exitCode || 0);
