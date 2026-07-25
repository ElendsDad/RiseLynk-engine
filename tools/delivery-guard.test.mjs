// =============================================================================
// site-engine - lead-capture delivery preflight gate (v0.24.1, feedback #30a, #30c)
//
//   node tools/delivery-guard.test.mjs
//
// Unit-tests lib/delivery-guard.mjs directly (pure, dependency-free): the
// placeholder-shape matcher, hasLeadCapture's page/section walk (including the
// draft-page exclusion), isRealProductionIntent's domain/draft/placeholder-domain
// gating, and the two issue builders (#30a placeholderEmailIssue, #30c
// deliveryWiringIssue) across the WARN-vs-FAIL and env-presence matrices.
//
// Zero dependencies: node:assert only. Exit code is non-zero on any failure.
// =============================================================================

import assert from "node:assert/strict";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const {
  isPlaceholderHost, isPlaceholderEmail, isRealProductionIntent, hasLeadCapture,
  hasEmailIntake, turnstileMissingIssue,
  placeholderEmailIssue, deliveryWiringIssue,
} = await import("file://" + resolve(here, "../lib/delivery-guard.mjs"));

let passed = 0;
const ok = (name, cond) => {
  if (cond) { passed++; console.log("  ok  " + name); }
  else { console.log("FAIL  " + name); process.exitCode = 1; }
};

// ---- fixtures ----
const contactSection = { type: "contact" };
const leadformSection = { type: "leadform" };
const heroSection = { type: "hero" };

function site(overrides = {}) {
  return {
    business: { email: "hello@realbusiness.com" },
    seo: { domain: "https://realbusiness.com" },
    pages: [{ sections: [heroSection, contactSection] }],
    ...overrides,
  };
}

console.log("\n# isPlaceholderHost / isPlaceholderEmail: the literal shape list");
ok(".example TLD is a placeholder", isPlaceholderHost("summit-vertical.example") === true);
ok(".invalid TLD is a placeholder", isPlaceholderHost("foo.invalid") === true);
ok("yourdomain. is a placeholder", isPlaceholderHost("yourdomain.com") === true);
ok("example.com bare is a placeholder", isPlaceholderHost("example.com") === true);
ok("www.example.com is a placeholder", isPlaceholderHost("www.example.com") === true);
ok("a real domain is not a placeholder", isPlaceholderHost("arkfabricating.com") === false);
ok("a real subdomain is not a placeholder", isPlaceholderHost("portal.arkfabricating.com") === false);
ok("case-insensitive", isPlaceholderHost("Summit-Vertical.EXAMPLE") === true);
ok("empty/absent host is not a placeholder (nothing to flag)", isPlaceholderHost("") === false && isPlaceholderHost(undefined) === false);
ok("a placeholder email resolves via its domain half", isPlaceholderEmail("hello@arkfabrication.example") === true);
ok("a real email is not a placeholder", isPlaceholderEmail("hello@maxlynk.com") === false);
ok("an email with no @ is not a placeholder (malformed, not our concern here)", isPlaceholderEmail("not-an-email") === false);
ok("a non-string email does not throw", isPlaceholderEmail(undefined) === false);

console.log("\n# hasLeadCapture: leadform/contact only, draft pages excluded");
ok("a contact section counts", hasLeadCapture({ pages: [{ sections: [contactSection] }] }) === true);
ok("a leadform section counts", hasLeadCapture({ pages: [{ sections: [leadformSection] }] }) === true);
ok("other section types do not count", hasLeadCapture({ pages: [{ sections: [heroSection] }] }) === false);
ok("no pages -> false", hasLeadCapture({ pages: [] }) === false);
ok("absent pages -> false, never throws", hasLeadCapture({}) === false);
ok("a draft page's contact section does not count (mirrors services.ts/area-ld.mjs)", hasLeadCapture({ pages: [{ draft: true, sections: [contactSection] }] }) === false);
ok("a non-draft page's section still counts alongside a draft page", hasLeadCapture({ pages: [{ draft: true, sections: [contactSection] }, { sections: [leadformSection] }] }) === true);

console.log("\n# isRealProductionIntent: real domain + not draft, and NOT itself placeholder-shaped");
ok("a real domain, no draft -> production intent", isRealProductionIntent({ seo: { domain: "https://arkfabricating.com" } }) === true);
ok("no domain -> not production intent (preview)", isRealProductionIntent({ seo: {} }) === false);
ok("draft:true overrides a real domain -> not production intent", isRealProductionIntent({ seo: { domain: "https://arkfabricating.com", draft: true } }) === false);
ok("a placeholder-shaped domain (the engine's own demo fixtures) -> not production intent", isRealProductionIntent({ seo: { domain: "https://summit-vertical.example" } }) === false);
ok("a placeholder-shaped domain with no scheme still resolves", isRealProductionIntent({ seo: { domain: "northgate.example" } }) === false);

console.log("\n# placeholderEmailIssue: #30a - null when nothing to say");
ok("no lead-capture section -> null even with a placeholder email", placeholderEmailIssue({ business: { email: "hi@x.example" }, seo: { domain: "https://real.com" }, pages: [{ sections: [heroSection] }] }) === null);
ok("a real email -> null even with lead capture live", placeholderEmailIssue(site()) === null);

console.log("\n# placeholderEmailIssue: #30a - WARN vs FAIL keyed on production intent");
{
  // Real domain + placeholder email + contact section: the exact ryan-dehart incident shape.
  const s = site({ business: { email: "hello@arkfabrication.example" }, seo: { domain: "https://arkfabricating.com" } });
  const issue = placeholderEmailIssue(s);
  ok("real domain + placeholder email + contact live -> an issue is reported", issue !== null);
  ok("...and it is severity FAIL (production intent)", issue.severity === "FAIL");
  ok("...and the message names the actual bad value", issue.message.includes("hello@arkfabrication.example"));
}
{
  // Same placeholder email, but the site's OWN domain is also placeholder-shaped (the engine's
  // own example/ and dist/hydrated/ fixtures): WARN only, so `npm run build` stays green.
  const s = site({ business: { email: "service@summit-vertical.example" }, seo: { domain: "https://summit-vertical.example" } });
  const issue = placeholderEmailIssue(s);
  ok("placeholder domain + placeholder email -> WARN, not FAIL", issue.severity === "WARN");
}
{
  // Draft build: WARN even with an otherwise-real domain.
  const s = site({ business: { email: "hello@arkfabrication.example" }, seo: { domain: "https://arkfabricating.com", draft: true } });
  ok("draft:true -> WARN even with a real domain", placeholderEmailIssue(s).severity === "WARN");
}
{
  // Domain-less (client-review deploy): WARN.
  const s = site({ business: { email: "hello@arkfabrication.example" }, seo: {} });
  ok("no domain -> WARN (preview)", placeholderEmailIssue(s).severity === "WARN");
}

console.log("\n# deliveryWiringIssue: #30c - null when wired or nothing to wire");
ok("no lead-capture section -> null regardless of env", deliveryWiringIssue({ pages: [{ sections: [heroSection] }] }, {}) === null);
ok("RESEND_API_KEY alone is enough -> null", deliveryWiringIssue(site(), { RESEND_API_KEY: "re_xxx" }) === null);
ok("LEADS_ENDPOINT alone is enough -> null", deliveryWiringIssue(site(), { LEADS_ENDPOINT: "https://sink.example.com/leads" }) === null);
ok("both set -> null", deliveryWiringIssue(site(), { RESEND_API_KEY: "re_xxx", LEADS_ENDPOINT: "https://sink.example.com" }) === null);
ok("whitespace-only env values do not count as configured", deliveryWiringIssue(site(), { RESEND_API_KEY: "   " }) !== null);

console.log("\n# deliveryWiringIssue: #30c - the black-hole shape");
{
  const issue = deliveryWiringIssue(site(), {});
  ok("neither var set + lead capture live -> an issue is reported", issue !== null);
  ok("the message names both env vars", issue.message.includes("RESEND_API_KEY") && issue.message.includes("LEADS_ENDPOINT"));
  ok("the message names the machine-readable status a consumer can probe for", issue.message.includes("black_hole"));
}
ok("undefined env (no crash) behaves like empty env", deliveryWiringIssue(site(), undefined) !== null);

console.log("\n# hasEmailIntake / turnstileMissingIssue (trust pack readiness)");
ok("hasEmailIntake includes contentGate", hasEmailIntake({ pages: [{ sections: [{ type: "contentGate" }] }] }) === true);
ok("hasEmailIntake includes requestService", hasEmailIntake({ pages: [{ sections: [{ type: "requestService" }] }] }) === true);
ok("hasEmailIntake includes careers", hasEmailIntake({ pages: [{ sections: [{ type: "careers" }] }] }) === true);
ok("hasLeadCapture still ignores contentGate (delivery path only)", hasLeadCapture({ pages: [{ sections: [{ type: "contentGate" }] }] }) === false);
ok(
  "turnstileMissingIssue WARNs when contact is live without siteKey",
  turnstileMissingIssue(site({ security: {} }))?.message.includes("turnstile") === true,
);
ok(
  "turnstileMissingIssue is null when siteKey is set",
  turnstileMissingIssue(site({ security: { turnstile: { siteKey: "0xSITE" } } })) === null,
);

console.log(`\n${passed} checks passed`);
process.exit(process.exitCode || 0);
