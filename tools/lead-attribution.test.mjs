// =============================================================================
// site-engine - lead-source attribution sanitizer gate (UTM + referrer + landing)
//
//   node tools/lead-attribution.test.mjs
//
// Proves: hostile attribution fields are neutralized before foldExtras; a
// referrer WITH a query string is stored WITHOUT it; absent fields stay absent
// (never empty-string lines in the lead message); every email form wires the
// shared LeadAttribution component; cookie-notice default copy mentions the
// capture. Zero runtime deps.
// =============================================================================

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

const {
  applyLeadAttribution,
  sanitizeAttributionField,
  LEAD_ATTRIBUTION_KEYS,
} = await import("file://" + resolve(root, "lib/lead-attribution.mjs"));

const { foldExtras, submit } = await import("file://" + resolve(root, "lib/contact-intake.mjs"));

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

console.log("\n# LEAD_ATTRIBUTION_KEYS covers UTM + referrer + landing_path");
ok("utm_source present", LEAD_ATTRIBUTION_KEYS.includes("utm_source"));
ok("utm_medium present", LEAD_ATTRIBUTION_KEYS.includes("utm_medium"));
ok("utm_campaign present", LEAD_ATTRIBUTION_KEYS.includes("utm_campaign"));
ok("utm_term present", LEAD_ATTRIBUTION_KEYS.includes("utm_term"));
ok("utm_content present", LEAD_ATTRIBUTION_KEYS.includes("utm_content"));
ok("referrer present", LEAD_ATTRIBUTION_KEYS.includes("referrer"));
ok("landing_path present", LEAD_ATTRIBUTION_KEYS.includes("landing_path"));

console.log("\n# sanitizeAttributionField: hostile utm_source neutralized");
{
  const overlong = "x".repeat(500);
  const out = sanitizeAttributionField("utm_source", overlong);
  ok("overlong capped", typeof out === "string" && out.length <= 200 && out.length > 0);
}
{
  const withControls = "google\u0000\u0007\nads";
  const out = sanitizeAttributionField("utm_source", withControls);
  ok("control chars stripped", out === "googleads");
}
{
  const withHtml = '<script>alert(1)</script>newsletter';
  const out = sanitizeAttributionField("utm_source", withHtml);
  ok("HTML angle brackets stripped", out != null && !out.includes("<") && !out.includes(">") && out.includes("newsletter"));
}
{
  ok("array rejected", sanitizeAttributionField("utm_source", ["a", "b"]) === null);
  ok("object rejected", sanitizeAttributionField("utm_source", { a: 1 }) === null);
  ok("empty string omitted", sanitizeAttributionField("utm_source", "   ") === null);
  ok("null omitted", sanitizeAttributionField("utm_source", null) === null);
}

console.log("\n# sanitizeAttributionField: referrer query string DROPPED");
{
  const hostile =
    "https://www.google.com/search?q=someone+elses+terms&sid=abc123&token=secret";
  const out = sanitizeAttributionField("referrer", hostile);
  ok("origin+path kept", out === "https://www.google.com/search");
  ok("query string gone", out != null && !out.includes("?") && !out.includes("someone"));
  ok("no token leaked", out != null && !out.includes("token") && !out.includes("secret"));
}
{
  ok(
    "referrer with hash still origin+path",
    sanitizeAttributionField("referrer", "https://example.com/path#frag") ===
      "https://example.com/path",
  );
  ok(
    "javascript: referrer rejected",
    sanitizeAttributionField("referrer", "javascript:alert(1)") === null,
  );
  ok(
    "non-http(s) referrer rejected",
    sanitizeAttributionField("referrer", "ftp://files.example/x") === null,
  );
}

console.log("\n# sanitizeAttributionField: landing_path is path-only");
{
  ok(
    "clean path kept",
    sanitizeAttributionField("landing_path", "/pricing/") === "/pricing/",
  );
  ok(
    "query stripped from landing_path",
    sanitizeAttributionField("landing_path", "/pricing/?utm_source=x") === "/pricing/",
  );
  ok(
    "protocol-relative rejected",
    sanitizeAttributionField("landing_path", "//evil.example/x") === null,
  );
  ok(
    "absolute URL rejected",
    sanitizeAttributionField("landing_path", "https://evil.example/x") === null,
  );
}

console.log("\n# applyLeadAttribution: absent stays absent; clean values pass");
{
  const base = { name: "Pat", email: "pat@x.com", message: "hello" };
  const out = applyLeadAttribution(base);
  ok("no attribution keys invented", !("utm_source" in out) && !("referrer" in out) && !("landing_path" in out));
  ok("core fields untouched", out.name === "Pat" && out.email === "pat@x.com");
}
{
  const out = applyLeadAttribution({
    name: "Pat",
    email: "pat@x.com",
    message: "hello",
    utm_source: "newsletter",
    utm_medium: "",
    referrer: "https://bing.com/search?q=private",
    landing_path: "/contact/",
    state: "WA",
  });
  ok("utm_source kept", out.utm_source === "newsletter");
  ok("empty utm_medium absent (not empty string)", !("utm_medium" in out));
  ok("referrer query stripped", out.referrer === "https://bing.com/search");
  ok("landing_path kept", out.landing_path === "/contact/");
  ok("unrelated extras untouched", out.state === "WA");
}

console.log("\n# foldExtras + submit: attribution rides the existing fold path");
{
  const cleaned = applyLeadAttribution({
    name: "Pat",
    email: "pat@x.com",
    message: "Need a quote",
    utm_source: "adwords",
    utm_campaign: "spring",
    referrer: "https://example.com/out?session=abc",
    landing_path: "/services/",
  });
  const lines = foldExtras(cleaned);
  ok("utm_source folded", lines.includes("utm_source: adwords"));
  ok("utm_campaign folded", lines.includes("utm_campaign: spring"));
  ok("referrer folded without query", lines.includes("referrer: https://example.com/out"));
  ok("landing_path folded", lines.includes("landing_path: /services/"));
  ok("no empty attribution lines", !lines.some((l) => /: $/.test(l) || /utm_medium:/.test(l)));
}
{
  const spy = { saved: [], send: async () => true, save: async (lead) => { spy.saved.push(lead); return { saved: true }; } };
  // submit must sanitize before fold: a hostile referrer query must not land in the message
  const r = await submit({
    body: {
      name: "Pat Rivera",
      email: "pat@summit.com",
      message: "Quote please",
      utm_source: "<b>evil</b>" + "z".repeat(300),
      referrer: "https://news.example/story?token=leak&q=private",
      landing_path: "/quote/",
    },
    save: spy.save,
    send: spy.send,
    to: "team@example.com",
    from: "noreply@example.com",
  });
  ok("submit ok", r.ok === true);
  const msg = spy.saved[0].message;
  ok("hostile HTML not in saved message", !msg.includes("<b>") && !msg.includes("</b>"));
  ok("overlong utm capped in saved message", !msg.includes("z".repeat(250)));
  ok("referrer query not in saved message", !msg.includes("token=leak") && !msg.includes("private"));
  ok("clean referrer origin+path in saved message", msg.includes("referrer: https://news.example/story"));
  ok("landing_path in saved message", msg.includes("landing_path: /quote/"));
}
{
  const spy = { saved: [], send: async () => true, save: async (lead) => { spy.saved.push(lead); return { saved: true }; } };
  await submit({
    body: { name: "Pat", email: "pat@x.com", message: "hi" },
    save: spy.save,
    send: spy.send,
    to: "team@example.com",
    from: "noreply@example.com",
  });
  const msg = spy.saved[0].message || "";
  ok(
    "no UTM/referrer/landing lines when absent",
    !/utm_/i.test(msg) && !/referrer:/i.test(msg) && !/landing_path:/i.test(msg),
  );
}

console.log("\n# every email form wires LeadAttribution");
const EMAIL_FORM_FILES = [
  "components/sections/Contact.tsx",
  "components/sections/LeadForm.tsx",
  "components/RequestAccessForm.tsx",
  "components/ContentGate.tsx",
  "components/sections/RequestService.tsx",
  "components/sections/Careers.tsx",
];
for (const rel of EMAIL_FORM_FILES) {
  const src = readFileSync(resolve(root, rel), "utf8");
  ok(`${rel} imports LeadAttribution`, /from ["']@\/components\/LeadAttribution["']/.test(src));
  ok(`${rel} renders <LeadAttribution`, /<LeadAttribution\s*\/>/.test(src));
}

console.log("\n# cookie/privacy notice default mentions lead-source capture");
{
  const notice = readFileSync(resolve(root, "components/CookieNotice.tsx"), "utf8");
  ok(
    "default message mentions form / campaign / page capture",
    /campaign|landing|form/i.test(notice) && /found us|how you found|page you were on/i.test(notice),
  );
  ok("default message has no em/en dash", !notice.includes("\u2013") && !notice.includes("\u2014"));
}

console.log("\n# LeadAttribution component: hidden fields + first-party populate script");
{
  const src = readFileSync(resolve(root, "components/LeadAttribution.tsx"), "utf8");
  ok("lists utm_source in ATTR_KEYS", /"utm_source"/.test(src));
  ok("lists referrer in ATTR_KEYS", /"referrer"/.test(src));
  ok("lists landing_path in ATTR_KEYS", /"landing_path"/.test(src));
  ok("renders hidden inputs", /type=["']hidden["']/.test(src) && /name=\{name\}/.test(src));
  ok("reads location.search", /location\.search/.test(src));
  ok("reads document.referrer", /document\.referrer/.test(src));
  ok("reads location.pathname", /location\.pathname/.test(src));
  // Strip comments/strings about the policy so only executable API use would fail.
  const code = src.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
  ok(
    "no storage / cookie / fingerprint APIs in code",
    !/\blocalStorage\b|\bsessionStorage\b|document\.cookie|\bfingerprint/i.test(code),
  );
}

console.log("\n# lead-attribution gate: " + passed + " assertions");
if (process.exitCode) {
  console.log("FAILED");
  process.exit(1);
}
console.log("All lead-attribution checks passed.");
