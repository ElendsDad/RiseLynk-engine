import type { FaqItem, PricingTier, Product, Section, ServiceLine, SiteConfig } from "./config-schema";
import { allServiceLines } from "./services";
// Review / rating JSON-LD builders (feature-backlog #2). Shared, dependency-free
// .mjs so the same logic is unit-tested in plain Node (tools/seo-jsonld.test.mjs);
// withRatingLd carries the claims-wall guard (emit only real, config-supplied ratings).
import { withRatingLd } from "./rating-ld.mjs";
// Software-product (G3) + pricing offer (G4) JSON-LD builders. Same shared dependency-free
// .mjs pattern as rating-ld.mjs: the claims-wall offer logic is unit-tested in plain Node
// (tools/seo-jsonld.test.mjs). pricingOffersLd emits an Offer only for a real numeric price;
// softwareAppNode assembles the SoftwareApplication node shape.
import { pricingOffersLd, softwareApplicationLd as softwareAppNode } from "./offer-ld.mjs";
// Service-area seam. Same shared dependency-free .mjs pattern: collectServiceAreas walks the
// config's serviceArea sections (one collector, so the @graph and llms.txt cannot drift from
// the visible section), and areaServedLd is the back-compat seam. With no serviceArea sections
// it reproduces the legacy single-Place object byte-for-byte (key order included); structured
// areas become one Place per area. Unit-tested in plain Node (tools/service-area.test.mjs).
import { areaServedLd, collectServiceAreas } from "./area-ld.mjs";

// JSON-LD (schema.org) builders. Kept as plain objects; rendered by <JsonLd>.
//
// Provenance: lifted 2026-07-10 from KitsapComponent
// (Kitsap Component/kitsap-store/lib/seo.ts). The KitsapComponent version hardcoded
// one storefront: the SITE_URL constant, the "Kitsap Component" name, the Port Orchard
// PostalAddress, and fixed contact emails. Here every one of those is read off the
// active SiteConfig, so one builder serves every site the engine renders.
//
// v0.1.0 modeled the org as Organization. v0.2.0 upgrades it to LocalBusiness when the
// site is the elevator-contractor archetype or carries a structured location, and adds a
// Service node per configured service line, so a contractor site emits a local @graph.

function siteUrl(site: SiteConfig): string {
  return (site.seo.domain ?? "").replace(/\/+$/, "");
}

// A build is indexable only when it has a real domain and is not marked draft. A
// domain-less build (a client-review deploy on a *.vercel.app alias) or an explicit
// `seo.draft` is public-but-not-indexed: robots.txt disallows all and every page carries
// robots:noindex, so a not-yet-live brand never lands in search. One source of truth for
// app/robots.ts and app/layout.tsx.
export function isIndexable(site: SiteConfig): boolean {
  return Boolean(site.seo.domain) && site.seo.draft !== true;
}

// LocalBusiness is the right type when this is a contractor with a real place/area, or
// any site that supplied a structured location. Otherwise stay a plain Organization.
function isLocalBusiness(site: SiteConfig): boolean {
  return site.archetype === "elevator-contractor" || Boolean(site.business.location);
}

function absUrl(site: SiteConfig, path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  const base = siteUrl(site);
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}

// v0.5.0: absolute canonical URL for a page path, from seo.domain. Undefined when the
// site has no domain configured (a preview build), so routes emit no canonical rather
// than a wrong one. For the root path ("/") this literally returns base + "/"; feedback
// item #22 flagged that as a docs nit, not a bug: Next 15's metadata resolver strips the
// trailing slash when it renders <link rel="canonical"> (trailingSlash is off, the
// default), so the SERVED canonical is always slashless, matching every other rendered
// canonical and app/sitemap.ts's home entry (which never emits a trailing slash either).
export function canonicalUrl(site: SiteConfig, path: string): string | undefined {
  const base = siteUrl(site);
  if (!base) return undefined;
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}

export function organizationLd(site: SiteConfig) {
  const base = siteUrl(site);
  const b = site.business;
  const ld: Record<string, unknown> = {
    // v0.2.0: LocalBusiness for a contractor or a site with a real location; else Organization.
    "@type": isLocalBusiness(site) ? "LocalBusiness" : "Organization",
    "@id": `${base}/#organization`,
    name: b.name,
    email: b.email,
  };
  if (base) ld.url = base;
  if (b.tagline) ld.description = b.tagline;
  if (b.phone) ld.telephone = b.phone;
  if (site.brand.logoUrl) {
    const logo = absUrl(site, site.brand.logoUrl);
    ld.logo = logo;
    ld.image = logo;
  }
  // Expose only city/region/country in structured data (a local-SEO signal) - never
  // the exact residential street address of a home-based business.
  const loc = b.location;
  if (loc && (loc.locality || loc.region || loc.country || loc.postalCode)) {
    ld.address = {
      "@type": "PostalAddress",
      ...(loc.locality ? { addressLocality: loc.locality } : {}),
      ...(loc.region ? { addressRegion: loc.region } : {}),
      ...(loc.country ? { addressCountry: loc.country } : {}),
      ...(loc.postalCode ? { postalCode: loc.postalCode } : {}),
    };
  }
  const areaServed = areaServedLd(b.serviceArea, collectServiceAreas(site));
  if (areaServed) ld.areaServed = areaServed;
  // sameAs: the same social profile links the Footer renders (business.socials), folded
  // into the org node so search engines and AI answer engines can tie the two together.
  // Omitted entirely when unset/empty, same claims-walled posture as every other optional
  // fact here (nothing invented; a social link is emitted only when the config supplies one).
  if (b.socials && b.socials.length) {
    ld.sameAs = b.socials.map((s) => s.href);
  }
  // AggregateRating / Review for the business, only when the config supplies a REAL
  // rating (claims-walled in withRatingLd). A business with none emits neither.
  withRatingLd(ld, b.rating, b.reviews);
  return ld;
}

// One Service node per configured service line, provided by the org. Emitted into the
// @graph so an AI answer engine can see the concrete services this contractor performs.
export function serviceLd(site: SiteConfig, line: ServiceLine) {
  const base = siteUrl(site);
  const b = site.business;
  const ld: Record<string, unknown> = {
    "@type": "Service",
    name: line.title,
    description: line.body,
    provider: { "@id": `${base}/#organization` },
  };
  if (line.key) ld.serviceType = line.key;
  const areaServed = areaServedLd(b.serviceArea, collectServiceAreas(site));
  if (areaServed) ld.areaServed = areaServed;
  return ld;
}

export function websiteLd(site: SiteConfig) {
  const base = siteUrl(site);
  return {
    "@type": "WebSite",
    "@id": `${base}/#website`,
    url: base || undefined,
    name: site.business.name,
    publisher: { "@id": `${base}/#organization` },
  };
}

// Collect every pricing tier the active config defines, across all pages and sections, for
// the SoftwareApplication's Offer JSON-LD. Mirrors allServiceLines: ONE collector so the
// structured offers are built from the same tiers the Pricing section renders (they cannot
// drift). Order is preserved; no dedupe, since a plan is a plan.
function allPricingTiers(site: SiteConfig): PricingTier[] {
  const out: PricingTier[] = [];
  for (const page of site.pages) {
    for (const section of page.sections) {
      if (section.type === "pricing" && section.tiers) out.push(...section.tiers);
    }
  }
  return out;
}

// G3: SoftwareApplication node for the software-product archetype (a SaaS product like
// riselynk.com), emitted into the site @graph alongside Organization + WebSite. Its
// Offer / AggregateOffer is built from the config's pricing tiers (G4, claims-walled in
// lib/offer-ld.mjs: only tiers with a real numeric priceValue), and its AggregateRating comes
// ONLY from a real business.rating (claims-walled in withRatingLd). Nothing is synthesized.
export function softwareApplicationLd(site: SiteConfig) {
  const base = siteUrl(site);
  const b = site.business;
  const sw = site.software ?? {};
  const currency = site.commerce?.currency;
  // Resolve each tier's CTA href to an absolute Offer url, from the same config.
  const tiers = allPricingTiers(site).map((t) => ({
    name: t.name,
    priceValue: t.priceValue,
    priceCurrency: t.priceCurrency,
    url: t.ctaHref ? absUrl(site, t.ctaHref) : undefined,
  }));
  const offers = pricingOffersLd(tiers, currency);
  const ld = softwareAppNode({
    id: base ? `${base}/#software` : undefined,
    name: sw.name ?? b.name,
    applicationCategory: sw.applicationCategory,
    operatingSystem: sw.operatingSystem,
    description: sw.description ?? b.tagline,
    url: base || undefined,
    providerId: base ? `${base}/#organization` : undefined,
    offers,
  });
  // AggregateRating / Review for the product, only from a REAL config-supplied rating.
  withRatingLd(ld, b.rating, b.reviews);
  return ld;
}

// Organization/LocalBusiness + WebSite + a Service per configured line, as one @graph for
// the root layout (every page). v0.2.0 folds the service lines in so a contractor site
// ships a local business graph with its concrete services, all from config.
export function siteGraphLd(site: SiteConfig) {
  const graph: Record<string, unknown>[] = [organizationLd(site), websiteLd(site)];
  for (const line of allServiceLines(site)) graph.push(serviceLd(site, line));
  // G3: the software-product archetype adds a SoftwareApplication node (with its offers) to
  // the graph. Additive and archetype-selected: the trade sites' Organization/LocalBusiness +
  // Service graph is untouched, and a non-software site emits exactly what it did before.
  if (site.archetype === "software") graph.push(softwareApplicationLd(site));
  return { "@context": "https://schema.org", "@graph": graph };
}

// FAQPage JSON-LD built from the same FaqItem array the Faq section renders visibly, so
// the structured answers are verbatim-identical to the on-page copy by construction.
export function faqPageLd(faqs: FaqItem[], id?: string) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    ...(id ? { "@id": id } : {}),
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

// BlogPosting JSON-LD for a hosted blog article. Only config-provided facts.
export function articleLd(
  site: SiteConfig,
  article: { slug: string; title: string; description: string; date?: string; author?: string },
) {
  const base = siteUrl(site);
  // Slashless, so the article's url / mainEntityOfPage / @id match the canonical, the
  // sitemap entry, and the URL Next actually serves (trailingSlash is off). One URL
  // identity across every surface (v0.6.1: aligned; previously emitted a trailing slash).
  const url = `${base}/blog/${article.slug}`;
  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    headline: article.title,
    description: article.description,
    ...(base ? { url, mainEntityOfPage: url } : {}),
    ...(article.date ? { datePublished: article.date } : {}),
    publisher: { "@id": `${base}/#organization` },
  };
  if (article.author) ld.author = { "@type": "Person", name: article.author };
  return ld;
}

export function breadcrumbLd(site: SiteConfig, crumbs: { name: string; path: string }[]) {
  const base = siteUrl(site);
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: `${base}${c.path}`,
    })),
  };
}

// Product JSON-LD for simple-commerce sites. The engine auto-injects this per product from
// v0.6.1 (see productLdsForSections); it stays exported for a site that wants to emit it by
// hand. An Offer is attached only for a priced product (below), so a quote-only catalog
// never emits price data it cannot honor.
export function productLd(site: SiteConfig, product: Product) {
  const base = siteUrl(site);
  const currency = (product.currency ?? site.commerce?.currency ?? "usd").toUpperCase();
  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.id,
    ...(product.description ? { description: product.description } : {}),
  };
  if (product.image) ld.image = absUrl(site, product.image);
  if (typeof product.priceCents === "number") {
    ld.offers = {
      "@type": "Offer",
      priceCurrency: currency,
      price: (product.priceCents / 100).toFixed(2),
      availability: "https://schema.org/InStock",
      seller: { "@id": `${base}/#organization` },
    };
  }
  // AggregateRating / Review for this product, only from REAL config-supplied ratings
  // (claims-walled in withRatingLd). A product with none emits a bare Product node.
  withRatingLd(ld, product.rating, product.reviews);
  return ld;
}

// Auto-emit Product JSON-LD for every product in a page's `products` sections (v0.6.1,
// feedback item 3). Gated on a configured domain: a domain-less build is a noindex preview
// (see isIndexable), so rich product results are moot there and the Offer seller @id would
// have no base to point at. A priced product carries an Offer; a quote-only (unpriced)
// product emits a bare Product node with no price. Returns [] when there is no domain or no
// products, so a page can map over it unconditionally.
export function productLdsForSections(site: SiteConfig, sections: Section[]) {
  if (!site.seo.domain) return [];
  const out: Record<string, unknown>[] = [];
  for (const section of sections) {
    if (section.type !== "products") continue;
    for (const product of section.products ?? []) out.push(productLd(site, product));
  }
  return out;
}
