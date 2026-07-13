import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { site } from "@/site.config";
import { publishedArticles } from "@/lib/config-schema";
import { canonicalUrl } from "@/lib/seo";

// Blog index. Config-driven and hosted-only (no external CMS). 404s when the active site
// publishes no blog. Draft articles are excluded here but remain reachable at their direct
// URL (with noindex) for review, mirroring the riselynk.com blog draft idiom.

export const dynamicParams = false;

export function generateMetadata(): Metadata {
  const blog = site.blog;
  if (!blog) return {};
  const canonical = canonicalUrl(site, "/blog");
  return {
    title: blog.title ?? "Blog",
    description: blog.description ?? site.business.tagline,
    ...(canonical ? { alternates: { canonical } } : {}),
  };
}

function articleDate(iso?: string): number {
  return iso ? Date.parse(iso) || 0 : 0;
}

export default function BlogIndex() {
  const blog = site.blog;
  if (!blog) notFound();

  const articles = [...publishedArticles(site)].sort((a, b) => articleDate(b.date) - articleDate(a.date));

  return (
    <section className="section">
      <div className="container">
        <p className="eyebrow">{blog.title ?? "Blog"}</p>
        <h1>{blog.title ?? "Articles"}</h1>
        {blog.description ? <p className="lead">{blog.description}</p> : null}

        <div className="bloglist" style={{ marginTop: "2rem" }}>
          {articles.map((a) => (
            <article className="blogcard" key={a.slug}>
              {a.eyebrow ? <p className="eyebrow">{a.eyebrow}</p> : null}
              <h2>
                <Link href={`/blog/${a.slug}`}>{a.title}</Link>
              </h2>
              <p>{a.description}</p>
              <Link className="blogcard__more" href={`/blog/${a.slug}`}>
                Read more
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
