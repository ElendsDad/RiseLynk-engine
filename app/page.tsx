import type { Metadata } from "next";
import { site } from "@/site.config";
import { canonicalUrl, productLdsForSections } from "@/lib/seo";
// Per-service detail-page Service JSON-LD (feedback item #19). See app/[slug]/page.tsx
// for the full doc comment; the home page is a PageConfig entry too, so it can carry a
// `service` block the same way any other page can.
import { servicePageLd } from "@/lib/service-page-ld.mjs";
import { areaServedLd, collectServiceAreas } from "@/lib/area-ld.mjs";
import SectionRenderer from "@/components/SectionRenderer";
import JsonLd from "@/components/JsonLd";

export function generateMetadata(): Metadata {
  const home = site.pages.find((p) => p.slug === "");
  const canonical = canonicalUrl(site, "/");
  return {
    title: { absolute: site.business.name },
    description: home?.description ?? site.business.tagline,
    // A draft home page (PageConfig.draft) carries robots:noindex on its own route,
    // regardless of the site-level isIndexable state (mirrors app/[slug]/page.tsx).
    ...(home?.draft ? { robots: { index: false, follow: false } } : {}),
    ...(canonical ? { alternates: { canonical } } : {}),
  };
}

export default function HomePage() {
  const home = site.pages.find((p) => p.slug === "");
  if (!home) return null;
  // See app/[slug]/page.tsx for the draft / domain-less gating this mirrors.
  const serviceLd = !home.draft && home.service
    ? servicePageLd({
        url: canonicalUrl(site, "/"),
        orgId: canonicalUrl(site, "/#organization"),
        name: home.service.name ?? home.title,
        description: home.description,
        serviceType: home.service.key,
        areaServed: areaServedLd(site.business.serviceArea, collectServiceAreas(site)),
        rating: home.service.rating,
        reviews: home.service.reviews,
      })
    : null;
  // Same byte-identity discipline as app/[slug]/page.tsx: the Service node rides the
  // existing per-product array-render slot (a conditional null sibling would serialize
  // into every page's RSC flight payload), and the `product-` key prefix stays verbatim
  // because key text is serialized too.
  const pageLds = productLdsForSections(site, home.sections);
  if (serviceLd) pageLds.push(serviceLd);
  return (
    <>
      {pageLds.map((ld, i) => (
        <JsonLd key={`product-${i}`} data={ld} />
      ))}
      {home.draft ? (
        <div className="container" style={{ paddingTop: "1.5rem" }}>
          <p className="draftbadge" role="note">
            Draft preview. Not indexed and not listed in navigation until approved.
          </p>
        </div>
      ) : null}
      <SectionRenderer sections={home.sections} />
    </>
  );
}
