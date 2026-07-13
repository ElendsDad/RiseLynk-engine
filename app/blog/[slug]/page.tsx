import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { site } from "@/site.config";
import type { Section } from "@/lib/config-schema";
import { renderMarkdown } from "@/lib/markdown";
import { articleLd, breadcrumbLd, canonicalUrl } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import Summary from "@/components/sections/Summary";
import Faq from "@/components/sections/Faq";

// Blog article route. Structured articles (answer-first summary + FAQ blocks) and markdown
// bodies are both supported; the summary and FAQ reuse the same section components pages
// use, so the FAQPage JSON-LD stays verbatim-identical to the visible copy. A draft article
// is reachable at its URL but carries robots noindex and is kept out of the index/sitemap.

export const dynamicParams = false;

export function generateStaticParams() {
  // Include drafts: they are reachable at their direct URL for review.
  return (site.blog?.articles ?? []).map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = site.blog?.articles.find((a) => a.slug === slug);
  if (!article) return {};
  const canonical = canonicalUrl(site, `/blog/${article.slug}`);
  return {
    title: article.title,
    description: article.description,
    ...(article.draft ? { robots: { index: false, follow: false } } : {}),
    ...(canonical ? { alternates: { canonical } } : {}),
    openGraph: { title: article.title, description: article.description, type: "article" },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = site.blog?.articles.find((a) => a.slug === slug);
  if (!article) notFound();

  const summarySection: Section | null = article.summary
    ? {
        type: "summary",
        summaryLabel: article.summary.label,
        body: article.summary.intro,
        points: article.summary.points,
        ordered: article.summary.ordered,
      }
    : null;

  const faqSection: Section | null = article.faqs?.length ? { type: "faq", heading: "Frequently asked questions", faqs: article.faqs } : null;

  const crumbs = [
    { name: "Home", path: "/" },
    { name: site.blog?.title ?? "Blog", path: "/blog" },
    { name: article.title, path: `/blog/${article.slug}` },
  ];

  return (
    <article className="section">
      <div className="container article">
        <JsonLd data={articleLd(site, article)} />
        <JsonLd data={breadcrumbLd(site, crumbs)} />

        {article.draft ? (
          <p className="draftbadge" role="note">
            Draft preview. Not indexed and not listed on the blog until approved.
          </p>
        ) : null}

        {article.eyebrow ? <p className="eyebrow">{article.eyebrow}</p> : null}
        <h1>{article.title}</h1>
        {article.date || article.author ? (
          <p className="article__meta">
            {[article.author, article.date].filter(Boolean).join(" · ")}
          </p>
        ) : null}
        {article.lede ? <p className="lead article__lede">{article.lede}</p> : null}

        {summarySection ? <Summary section={summarySection} /> : null}

        {article.body ? (
          <div className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(article.body) }} />
        ) : null}

        {faqSection ? <Faq section={faqSection} /> : null}
      </div>
    </article>
  );
}
