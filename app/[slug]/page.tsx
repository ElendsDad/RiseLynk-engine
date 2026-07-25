import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { site } from "@/site.config";
import { hrefFor } from "@/lib/config-schema";
import { breadcrumbLd, canonicalUrl, productLdsForSections } from "@/lib/seo";
// Per-service detail-page Service JSON-LD (feedback item #19). Same shared-.mjs pattern
// as every other JSON-LD builder: servicePageLd is dependency-free (lib/service-page-ld.mjs)
// and areaServedLd/collectServiceAreas (lib/area-ld.mjs) are the SAME collector the
// sitewide per-ServiceLine Service nodes read, so a page's areaServed can never drift
// from the site's.
import { servicePageLd } from "@/lib/service-page-ld.mjs";
import { areaServedLd, collectServiceAreas } from "@/lib/area-ld.mjs";
import SectionRenderer from "@/components/SectionRenderer";
import JsonLd from "@/components/JsonLd";

// Only the pages defined in site.config exist; everything else is a 404. Draft pages
// (PageConfig.draft) are INCLUDED here: they stay reachable at their direct URL for
// review, same as a draft blog article - generateMetadata below is what keeps a draft
// out of search regardless.
export const dynamicParams = false;

export function generateStaticParams() {
  return site.pages
    .filter((p) => p.slug !== "")
    .map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const page = site.pages.find((p) => p.slug === slug);
  if (!page) return {};
  const canonical = canonicalUrl(site, hrefFor(slug));
  return {
    title: page.title,
    description: page.description,
    // A draft page carries robots:noindex on its own route, regardless of the
    // site-level isIndexable state (mirrors app/blog/[slug]/page.tsx's article.draft
    // handling).
    ...(page.draft ? { robots: { index: false, follow: false } } : {}),
    ...(canonical ? { alternates: { canonical } } : {}),
  };
}

export default async function Page(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const page = site.pages.find((p) => p.slug === slug);
  if (!page) notFound();
  const crumbs = [
    { name: "Home", path: "/" },
    { name: page.nav ?? page.title, path: hrefFor(slug) },
  ];
  // A draft page emits no Service node (PageConfig.draft's claims-wall contract: nothing
  // machine-readable leaks before the page is approved), and a domain-less preview build
  // emits nothing either, since canonicalUrl is undefined without a configured domain and
  // servicePageLd's own gate withholds the node on a falsy url.
  const serviceLd = !page.draft && page.service
    ? servicePageLd({
        url: canonicalUrl(site, hrefFor(slug)),
        orgId: canonicalUrl(site, "/#organization"),
        name: page.service.name ?? page.title,
        description: page.description,
        serviceType: page.service.key,
        areaServed: areaServedLd(site.business.serviceArea, collectServiceAreas(site)),
        rating: page.service.rating,
        reviews: page.service.reviews,
      })
    : null;
  // The Service node rides the SAME array-render slot the per-product nodes already
  // occupy, instead of its own conditional child: a `{cond ? <JsonLd/> : null}` sibling
  // would serialize an extra null into the RSC flight payload of EVERY page, changing
  // emitted HTML for configs that never set `service` and breaking the byte-identical-
  // absent guarantee (the exact regression class the addons section hit; see that fix's
  // commit). Appending to the existing array leaves an absent `service` page's payload
  // untouched, empty-array included. The `product-` key prefix is kept verbatim for the
  // same reason: the key text is serialized into the flight payload, so renaming it
  // would change bytes for every page that already emits product nodes.
  const pageLds = productLdsForSections(site, page.sections);
  if (serviceLd) pageLds.push(serviceLd);
  return (
    <>
      <JsonLd data={breadcrumbLd(site, crumbs)} />
      {pageLds.map((ld, i) => (
        <JsonLd key={`product-${i}`} data={ld} />
      ))}
      {page.draft ? (
        <div className="container" style={{ paddingTop: "1.5rem" }}>
          <p className="draftbadge" role="note">
            Draft preview. Not indexed and not listed in navigation until approved.
          </p>
        </div>
      ) : null}
      <SectionRenderer sections={page.sections} />
    </>
  );
}
