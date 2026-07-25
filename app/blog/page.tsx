import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { site } from "@/site.config";
import { publishedArticles, type Article } from "@/lib/config-schema";
import { canonicalUrl } from "@/lib/seo";
import { readTimeForArticle } from "@/lib/read-time.mjs";
import { organizeBlogIndex } from "@/lib/blog-index.mjs";

// Blog index. Config-driven and hosted-only (no external CMS). 404s when the active site
// publishes no blog. Draft articles are excluded here but remain reachable at their direct
// URL (with noindex) for review, mirroring the riselynk.com blog draft idiom.
//
// Teardown P2 6a: when any published article sets `featured` or `category`, the index
// switches to a featured lead + category-grouped layout. Otherwise the flat grid is
// unchanged (absent-field byte-identity for blogs that never opt in).

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

function ArticleCard({ a, featured = false }: { a: Article; featured?: boolean }) {
  const read = readTimeForArticle(a);
  return (
    <article className={`blogcard${featured ? " blogcard--featured" : ""}`}>
      {a.category ? <p className="blogcard__category">{a.category}</p> : null}
      {a.eyebrow ? <p className="eyebrow">{a.eyebrow}</p> : null}
      <h2>
        <Link href={`/blog/${a.slug}`}>{a.title}</Link>
      </h2>
      <p>{a.description}</p>
      <Link className="blogcard__more" href={`/blog/${a.slug}`}>
        Read more
      </Link>
      {read ? (
        <p className="blogcard__readtime" aria-label={read.label}>
          {read.label}
        </p>
      ) : null}
    </article>
  );
}

export default function BlogIndex() {
  const blog = site.blog;
  if (!blog) notFound();

  const articles = publishedArticles(site);
  // organizeBlogIndex is plain ESM (tested from Node); cast the Article-shaped result.
  const { organized, featured, groups, categoryNames, uncategorized } = organizeBlogIndex(
    articles,
    blog.categoryOrder,
  ) as {
    organized: boolean;
    featured: Article[];
    groups: Record<string, Article[]>;
    categoryNames: string[];
    uncategorized: Article[];
  };

  return (
    <section className="section">
      <div className="container">
        <p className="eyebrow">{blog.title ?? "Blog"}</p>
        <h1>{blog.title ?? "Articles"}</h1>
        {blog.description ? <p className="lead">{blog.description}</p> : null}

        {organized ? (
          <>
            {featured.length ? (
              <div className="bloglist bloglist--featured" style={{ marginTop: "2rem" }}>
                {featured.map((a) => (
                  <ArticleCard key={a.slug} a={a} featured />
                ))}
              </div>
            ) : null}
            {categoryNames.map((cat) => (
              <div className="bloggroup" key={cat}>
                <h2 className="bloggroup__title">{cat}</h2>
                <div className="bloglist">
                  {groups[cat].map((a) => (
                    <ArticleCard key={a.slug} a={a} />
                  ))}
                </div>
              </div>
            ))}
            {uncategorized.length ? (
              <div className="bloggroup" style={!categoryNames.length && !featured.length ? { marginTop: "2rem" } : undefined}>
                {categoryNames.length ? <h2 className="bloggroup__title">More</h2> : null}
                <div className="bloglist">
                  {uncategorized.map((a) => (
                    <ArticleCard key={a.slug} a={a} />
                  ))}
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <div className="bloglist" style={{ marginTop: "2rem" }}>
            {[...articles]
              .sort((a, b) => (b.date ? Date.parse(b.date) || 0 : 0) - (a.date ? Date.parse(a.date) || 0 : 0))
              .map((a) => (
                <ArticleCard key={a.slug} a={a} />
              ))}
          </div>
        )}
      </div>
    </section>
  );
}
