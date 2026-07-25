// =============================================================================
// Gate: go-live readiness linter (completeness, not validity).
//
//   node tools/readiness.test.mjs
// =============================================================================

import assert from "node:assert/strict";
import { writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { assessReadiness, assessConfigPath, formatReport } from "./readiness.mjs";

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

const emptyLocal = {
  business: { name: "Acme", email: "a@example.com" },
  brand: {},
  seo: {},
  pages: [{ sections: [{ type: "hero", heading: "Hi" }] }],
};

test("empty local config surfaces the high-value WARNs", () => {
  const r = assessReadiness(emptyLocal, { slug: "acme" });
  const ids = r.findings.map((f) => f.id);
  assert.ok(ids.includes("schemaType"));
  assert.ok(ids.includes("openingHours"));
  assert.ok(ids.includes("serviceArea"));
  assert.ok(ids.includes("ogImage"));
  assert.ok(ids.includes("location"));
  assert.ok(ids.includes("gbp"));
  assert.ok(ids.includes("turnstile"));
  assert.ok(ids.includes("analytics"));
  assert.equal(r.findings.find((f) => f.id === "gbp").severity, "WARN");
  assert.equal(r.findings.find((f) => f.id === "turnstile").severity, "INFO");
  assert.equal(r.findings.find((f) => f.id === "analytics").severity, "INFO");
  assert.match(
    r.findings.find((f) => f.id === "analytics").message,
    /Plausible is a paid product/,
  );
});

test("filled config is clean of those WARNs", () => {
  const r = assessReadiness({
    business: {
      name: "Acme Plumbing",
      email: "a@example.com",
      schemaType: "Plumber",
      openingHours: [{ days: ["monday"], opens: "08:00", closes: "17:00" }],
      location: { locality: "Port Orchard", region: "WA", country: "US" },
      emergency247: true,
      hours: "Emergencies any hour.",
      phone: "(360) 555-0100",
      gbp: {
        placeId: "ChIJx",
        profileUrl: "https://g.page/acme",
        reviewUrl: "https://search.google.com/local/writereview?placeid=ChIJx",
      },
    },
    brand: { faviconUrl: "/favicon.svg" },
    seo: { ogImage: "/og.png" },
    callBar: { enabled: true, dispatchRouted: true, emergencyContext: "a burst pipe" },
    security: { turnstile: { siteKey: "1x00000000000000000000AA" } },
    analytics: { cloudflareToken: "abc" },
    pages: [
      {
        sections: [
          { type: "serviceArea", areas: [{ name: "Port Orchard" }, { name: "Gig Harbor" }] },
        ],
      },
    ],
  });
  const warns = r.findings.filter((f) => f.severity === "WARN");
  assert.deepEqual(warns, []);
});

test("software archetype skips the gbp WARN", () => {
  const r = assessReadiness({
    ...emptyLocal,
    archetype: "software",
  });
  assert.ok(!r.findings.some((f) => f.id === "gbp"));
});

test("any-hour claim without emergency247 is a WARN", () => {
  const r = assessReadiness({
    ...emptyLocal,
    business: {
      ...emptyLocal.business,
      hours: "Mon to Fri 8am to 5pm. Emergencies any hour.",
      location: { locality: "X", region: "WA", country: "US" },
      schemaType: "Plumber",
      openingHours: [{ days: ["monday"], opens: "08:00", closes: "17:00" }],
    },
    seo: { ogImage: "/og.png" },
    pages: [{ sections: [{ type: "serviceArea", areas: [{ name: "X" }] }] }],
  });
  assert.ok(r.findings.some((f) => f.id === "emergency247" && f.severity === "WARN"));
});

test("elevator archetype without emergencyContext WARNs", () => {
  const r = assessReadiness({
    archetype: "elevator-contractor",
    business: {
      name: "Summit",
      email: "a@example.com",
      schemaType: "ProfessionalService",
      openingHours: [{ days: ["monday"], opens: "07:00", closes: "16:00" }],
      location: { locality: "Demo City", region: "WA", country: "US" },
      phone: "1",
    },
    brand: { faviconUrl: "/favicon.svg" },
    seo: { ogImage: "/og.png" },
    callBar: { enabled: true },
    pages: [{ sections: [{ type: "serviceArea", areas: [{ name: "King County" }] }] }],
  });
  assert.ok(r.findings.some((f) => f.id === "emergencyContext"));
});

test("formatReport summarizes WARN/INFO counts", () => {
  const text = formatReport([assessReadiness(emptyLocal, { slug: "acme" })]);
  assert.match(text, /## acme/);
  assert.match(text, /Summary: 1 config\(s\)/);
  assert.match(text, /WARN/);
});

test("assessConfigPath loads a JSON fixture", async () => {
  const dir = mkdtempSync(join(tmpdir(), "readiness-test-"));
  const file = join(dir, "site.json");
  writeFileSync(file, JSON.stringify(emptyLocal), "utf8");
  try {
    const r = await assessConfigPath(file);
    assert.ok(r.findings.length > 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

let failed = 0;
for (const { name, fn } of tests) {
  try {
    await fn();
    console.log(`  PASS  ${name}`);
  } catch (err) {
    failed++;
    console.error(`  FAIL  ${name}`);
    console.error(`        ${err.message}`);
  }
}
console.log(`\n${tests.length - failed}/${tests.length} passed`);
process.exit(failed ? 1 : 0);
