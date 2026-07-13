import type { Metadata } from "next";
import { site } from "@/site.config";
import { canonicalUrl, productLdsForSections } from "@/lib/seo";
import SectionRenderer from "@/components/SectionRenderer";
import JsonLd from "@/components/JsonLd";

export function generateMetadata(): Metadata {
  const home = site.pages.find((p) => p.slug === "");
  const canonical = canonicalUrl(site, "/");
  return {
    title: { absolute: site.business.name },
    description: home?.description ?? site.business.tagline,
    ...(canonical ? { alternates: { canonical } } : {}),
  };
}

export default function HomePage() {
  const home = site.pages.find((p) => p.slug === "");
  if (!home) return null;
  return (
    <>
      {productLdsForSections(site, home.sections).map((ld, i) => (
        <JsonLd key={`product-${i}`} data={ld} />
      ))}
      <SectionRenderer sections={home.sections} />
    </>
  );
}
