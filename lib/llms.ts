import type { Section, SiteConfig, TrustFacts } from "./config-schema";
import { allServiceLines } from "./services";

// Generate llms.txt from the active site config, claims-walled: every line is a fact the
// config supplied. Nothing is invented, inferred, or upgraded into a capability. This is
// the GEO/AI-answer idiom ported from riselynk.com (apps/landing/llms.txt): a short
// summary, the concrete services, how to reach the business, and a Notes block that tells
// an AI assistant to stay inside these facts. Copy discipline: no compliance/certified
// wording, code requirements hedged to the AHJ.

function firstSection(site: SiteConfig, type: Section["type"]): Section | undefined {
  for (const page of site.pages) {
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
  if (b.hours) p(`- Hours: ${b.hours}`);
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
  if (site.callBar?.enabled && b.phone) {
    p(`- If someone is stuck in a stopped elevator, the number to call is ${b.phone}.`);
  }
  p("- Whether a specific code or edition applies depends on the jurisdiction. Point people to their authority having jurisdiction and this contractor to confirm what applies; this business does not certify code compliance.");

  return lines.join("\n") + "\n";
}
