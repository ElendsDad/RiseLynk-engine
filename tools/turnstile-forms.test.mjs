// =============================================================================
// site-engine - Turnstile presence on every email-entry form (trust pack)
//
//   node tools/turnstile-forms.test.mjs
//
// Static gate: every component that renders an email input on a lead/intake
// surface must also import and render the shared Turnstile widget behind
// site.security.turnstile.siteKey. Catches a new form that forgets the human
// check. Also re-asserts the server-side fail-closed XOR (turnstileConfig) so a
// misconfigured siteKey-without-secret cannot silently accept unverified leads.
// =============================================================================

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

const { turnstileConfig, verifyTurnstile } = await import("file://" + resolve(root, "lib/contact-intake.mjs"));
const { turnstileMissingIssue, hasEmailIntake } = await import("file://" + resolve(root, "lib/delivery-guard.mjs"));

let passed = 0;
const ok = (name, cond) => {
  if (cond) { passed++; console.log("  ok  " + name); }
  else { console.log("FAIL  " + name); process.exitCode = 1; }
};

// Every form component that accepts an email for lead/intake purposes.
const EMAIL_FORM_FILES = [
  "components/sections/Contact.tsx",
  "components/sections/LeadForm.tsx",
  "components/RequestAccessForm.tsx",
  "components/ContentGate.tsx",
  "components/sections/RequestService.tsx",
  "components/sections/Careers.tsx",
];

console.log("\n# every email form wires Turnstile behind security.turnstile.siteKey");
for (const rel of EMAIL_FORM_FILES) {
  const src = readFileSync(resolve(root, rel), "utf8");
  ok(`${rel} imports Turnstile`, /from ["']@\/components\/Turnstile["']/.test(src));
  // Classic forms use type="email"; RequestAccessForm declares type: "email" on LeadField configs.
  ok(
    `${rel} accepts an email field`,
    /type=["']email["']/.test(src) || /type:\s*["']email["']/.test(src),
  );
  ok(
    `${rel} gates the widget on site.security?.turnstile?.siteKey`,
    /site\.security\?\.turnstile\?\.siteKey/.test(src) && /<Turnstile\s+siteKey=/.test(src),
  );
}

console.log("\n# fail-closed: misconfigured Turnstile never silently accepts");
{
  const xor = turnstileConfig({ siteKey: "0xSITE", secret: "" });
  ok("siteKey without secret -> ok:false", xor.ok === false);
  ok("siteKey without secret -> turnstile_misconfig", xor.reason === "turnstile_misconfig");
}
{
  const xor = turnstileConfig({ siteKey: "", secret: "s3cret" });
  ok("secret without siteKey -> ok:false", xor.ok === false);
}
{
  const both = turnstileConfig({ siteKey: "0xSITE", secret: "s3cret" });
  ok("both present -> enforced", both.ok === true && both.enforced === true);
}
{
  const off = turnstileConfig({ siteKey: "", secret: "" });
  ok("neither present -> ok, not enforced (brochure default)", off.ok === true && off.enforced === false);
}
{
  // Configured but missing client token must reject (fail closed).
  const v = await verifyTurnstile({ token: "", secret: "s3cret" });
  ok("configured + empty token -> reject", v.ok === false && v.reason === "missing_token");
}

console.log("\n# readiness: turnstileMissingIssue WARNs when email intake is live without a siteKey");
ok(
  "contact without turnstile -> WARN message",
  turnstileMissingIssue({
    pages: [{ sections: [{ type: "contact" }] }],
    security: {},
  })?.message.includes("turnstile") === true,
);
ok(
  "contact WITH siteKey -> null",
  turnstileMissingIssue({
    pages: [{ sections: [{ type: "contact" }] }],
    security: { turnstile: { siteKey: "0xSITE" } },
  }) === null,
);
ok(
  "no email intake -> null",
  turnstileMissingIssue({ pages: [{ sections: [{ type: "hero" }] }] }) === null,
);
ok("hasEmailIntake sees contentGate", hasEmailIntake({ pages: [{ sections: [{ type: "contentGate" }] }] }) === true);
ok("hasEmailIntake sees requestService", hasEmailIntake({ pages: [{ sections: [{ type: "requestService" }] }] }) === true);
ok("hasEmailIntake sees careers", hasEmailIntake({ pages: [{ sections: [{ type: "careers" }] }] }) === true);
ok("hasEmailIntake skips draft pages", hasEmailIntake({ pages: [{ draft: true, sections: [{ type: "contact" }] }] }) === false);

console.log(`\n${passed} checks passed`);
process.exit(process.exitCode || 0);
