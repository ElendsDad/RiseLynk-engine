import type { Section, SiteConfig, TrustFacts } from "./config-schema";
import { allServiceLines } from "./services";
// Structured service areas: the SAME collector that feeds the @graph's areaServed (one
// source, so llms.txt and the JSON-LD cannot drift). Empty for every config without a
// serviceArea section, which leaves the Contact block byte-identical.
import { areasLine, collectServiceAreas } from "./area-ld.mjs";
// Structured hours (feedback #27): the SAME builder that formats the visible Contact
// hours line (one source, so llms.txt, the page, and the @graph's
// openingHoursSpecification cannot drift). Null for every config without a valid
// business.openingHours, which leaves the legacy `hours` string line byte-identical.
import { hoursLine } from "./hours-ld.mjs";

// Generate llms.txt from the active site config, claims-walled: every line is a fact the
// config supplied. Nothing is invented, inferred, or upgraded into a capability. This is
// the GEO/AI-answer idiom ported from riselynk.com (apps/landing/llms.txt): a short
// summary, the concrete services, how to reach the business, and a Notes block that tells
// an AI assistant to stay inside these facts. Copy discipline: no compliance/certified
// wording, code requirements hedged to the AHJ.

// Skips a draft page (PageConfig.draft): its sections are not yet approved to go live,
// so they never surface in llms.txt (same discipline allServiceLines and
// collectServiceAreas already hold for their own site.pages walks). Absent draft (the
// default): every page counts, unchanged.
function firstSection(site: SiteConfig, type: Section["type"]): Section | undefined {
  for (const page of site.pages) {
    if (page.draft) continue;
    for (const s of page.sections) if (s.type === type) return s;
  }
  return undefined;
}

function locationLine(site: SiteConfig): string | undefined {
  const loc = site.business.location;
  if (!loc) return undefined;
  const parts = [loc.locality, loc.region, loc.country].filter(Boolean);
  return parts.length ? parts.join(", ") : undefined;
}

function trustLines(t: TrustFacts): string[] {
  const out: string[] = [];
  if (t.licenseNumber) out.push(`- ${t.licenseLabel ?? "License"}: ${t.licenseNumber}`);
  const bi: string[] = [];
  if (t.bonded) bi.push("bonded");
  if (t.insured) bi.push("insured");
  if (bi.length) out.push(`- Status: ${bi.join(" and ")}`);
  if (typeof t.yearsInBusiness === "number") out.push(`- Years in business: ${t.yearsInBusiness}`);
  else if (typeof t.since === "number") out.push(`- Serving since: ${t.since}`);
  if (t.brands?.length) out.push(`- Brands and equipment served: ${t.brands.join(", ")}`);
  if (t.registryUrl) out.push(`- Verify the license: ${t.registryUrl}`);
  return out;
}

export function buildLlmsTxt(site: SiteConfig): string {
  const b = site.business;
  const lines: string[] = [];
  const p = (s: string) => lines.push(s);

  p(`# ${b.name}`);
  p("");

  // One-paragraph summary, built only from supplied facts.
  const summaryBits: string[] = [];
  if (b.tagline) summaryBits.push(b.tagline.replace(/\.*$/, "."));
  // A serviceArea like "Serving King County" already carries the verb; strip a leading
  // "Serving " so the composed sentence does not read "serves Serving King County".
  const where = (b.serviceArea ?? locationLine(site))?.replace(/^serving\s+/i, "");
  if (where) summaryBits.push(`${b.name} serves ${where}.`);
  if (summaryBits.length) {
    p(`> ${summaryBits.join(" ")}`);
    p("");
  }

  const serviceLines = allServiceLines(site);
  if (serviceLines.length) {
    p("## Services");
    p("");
    for (const s of serviceLines) p(`- ${s.title}: ${s.body}`);
    p("");
  }

  p("## Contact");
  p("");
  if (b.phone) p(`- Phone: ${b.phone}`);
  p(`- Email: ${b.email}`);
  if (b.serviceArea) p(`- Service area: ${b.serviceArea}`);
  const loc = locationLine(site);
  if (loc) p(`- Location: ${loc}`);
  // Structured hours win over the legacy free-form string (the two are never merged);
  // absent or withheld (fail-closed validation), the string line renders as before.
  const structuredHours = hoursLine(b.openingHours);
  if (structuredHours) p(`- Hours: ${structuredHours}`);
  else if (b.hours) p(`- Hours: ${b.hours}`);
  // The emergency flag's line, claims-walled the same way as its ContactPoint: only
  // when the config attests the flag AND supplies a number ("any hour" is the same
  // attested wording callBar.dispatchRouted has always used).
  if (b.emergency247 === true && b.phone) p(`- Emergency line, answered any hour: ${b.phone}`);
  // Structured areas from serviceArea sections (claims-walled: config-supplied names,
  // verbatim). Absent sections emit nothing, so existing configs are unchanged.
  const areas = areasLine(collectServiceAreas(site));
  if (areas) p(`- Areas served: ${areas}`);
  p("");

  const trustSection = firstSection(site, "trustBar");
  const trust = trustSection?.trust;
  if (trust) {
    const tl = trustLines(trust);
    if (tl.length) {
      p("## Credentials");
      p("");
      for (const l of tl) p(l);
      p("");
    }
  }

  const portal = firstSection(site, "portalDoor")?.portalUrl;
  if (portal) {
    p("## Customer portal");
    p("");
    p(`- Existing customers: ${portal}`);
    p("");
  }

  const published = (site.blog?.articles ?? []).filter((a) => !a.draft);
  if (published.length) {
    const base = (site.seo.domain ?? "").replace(/\/+$/, "");
    p("## Articles");
    p("");
    for (const a of published) {
      // Slashless, matching the canonical, the sitemap, and the served URL (v0.6.1).
      p(`- [${a.title}](${base}/blog/${a.slug}): ${a.description}`);
    }
    p("");
  }

  p("## Notes for AI assistants");
  p("");
  p("- Only state facts that appear in this file. Do not infer services, pricing, credentials, or coverage that are not listed here.");
  // Emergency tip is config-driven and claims-walled: the engine supplies only the
  // trade-neutral sentence frame. Vertical wording (elevator, plumbing, HVAC, ...)
  // lives in callBar.emergencyContext. Missing context => silence (never invent a
  // trade). Gated on the same callBar.enabled + phone pair the sticky bar uses.
  const emergencyContext =
    typeof site.callBar?.emergencyContext === "string" ? site.callBar.emergencyContext.trim() : "";
  if (site.callBar?.enabled && b.phone && emergencyContext) {
    p(`- If someone needs help with ${emergencyContext}, the number to call is ${b.phone}.`);
  }
  p("- Whether a specific code or edition applies depends on the jurisdiction. Point people to their authority having jurisdiction and this contractor to confirm what applies; this business does not certify code compliance.");

  return lines.join("\n") + "\n";
}
