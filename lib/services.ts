import type { ServiceLine, SiteConfig } from "./config-schema";

// Collect every service the active site config defines, for the machine-readable
// surfaces (the SEO @graph emits one Service node per entry; llms.txt lists them).
// Mirrors lib/products.ts allProducts().
//
// v0.5.0: plain brochure `services` sections count too, not only the contractor
// archetype's `contractorServices`. A brochure item ({ title, body }) becomes a
// ServiceLine with no `key`, so its Service node carries no serviceType. Contractor
// lines are collected first and win on a name collision; brochure items are deduped
// by normalized title (a site listing the same service on two pages, or on both
// section types, emits it once). Contractor-only configs produce byte-identical
// output to v0.4.0.
export function allServiceLines(site: SiteConfig): ServiceLine[] {
  const out: ServiceLine[] = [];
  const seen = new Set<string>();
  const norm = (title: string) => title.trim().toLowerCase();

  for (const page of site.pages) {
    for (const section of page.sections) {
      if (section.type === "contractorServices" && section.serviceLines) {
        out.push(...section.serviceLines);
        for (const line of section.serviceLines) seen.add(norm(line.title));
      }
    }
  }

  for (const page of site.pages) {
    for (const section of page.sections) {
      if (section.type !== "services" || !section.items) continue;
      for (const item of section.items) {
        if (seen.has(norm(item.title))) continue;
        seen.add(norm(item.title));
        out.push({ title: item.title, body: item.body });
      }
    }
  }

  return out;
}
