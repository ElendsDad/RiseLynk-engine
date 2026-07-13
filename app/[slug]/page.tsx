import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { site } from "@/site.config";
import { hrefFor } from "@/lib/config-schema";
import { breadcrumbLd, canonicalUrl, productLdsForSections } from "@/lib/seo";
import SectionRenderer from "@/components/SectionRenderer";
import JsonLd from "@/components/JsonLd";

// Only the pages defined in site.config exist; everything else is a 404.
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
  return (
    <>
      <JsonLd data={breadcrumbLd(site, crumbs)} />
      {productLdsForSections(site, page.sections).map((ld, i) => (
        <JsonLd key={`product-${i}`} data={ld} />
      ))}
      <SectionRenderer sections={page.sections} />
    </>
  );
}
