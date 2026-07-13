import type { Section } from "@/lib/config-schema";

// Pricing section (Phase-A product-marketing layer, G4). Renders the plan set from config as a
// row of cards. Display-only: the Offer / AggregateOffer JSON-LD is emitted once on the
// SoftwareApplication node in the site @graph (lib/seo.ts), built from these SAME tiers, so the
// structured offers can never drift from the cards. Brand-neutral: the `highlighted` flag only
// adds a class a site can style (for example the gradient hot-plan price), and the badge text is
// config-supplied. The engine bakes no color and no marketing copy; every value here is config.
export default function Pricing({ section }: { section: Section }) {
  const tiers = section.tiers ?? [];
  if (!tiers.length) return null;
  return (
    <section className="section" id="pricing">
      <div className="container">
        {section.subheading ? <p className="eyebrow">{section.subheading}</p> : null}
        {section.heading ? <h2>{section.heading}</h2> : null}
        {section.body ? <p className="lead">{section.body}</p> : null}

        <div className="plans" style={{ marginTop: "1.5rem" }}>
          {tiers.map((t, i) => (
            <article
              className={`plan${t.highlighted ? " plan--highlighted" : ""}${
                section.gradientPrice && t.highlighted ? " plan--hot-gradient" : ""
              }`}
              key={i}
            >
              {t.badge ? <span className="plan__badge">{t.badge}</span> : null}
              <h3 className="plan__name">{t.name}</h3>
              <p className="plan__price">
                {t.price}
                {t.period ? <span className="plan__period"> {t.period}</span> : null}
              </p>
              {t.meta ? <p className="plan__meta">{t.meta}</p> : null}
              {t.who ? <p className="plan__who">{t.who}</p> : null}
              {t.features.length ? (
                <ul className="plan__features">
                  {t.features.map((f, j) => (
                    <li key={j}>{f}</li>
                  ))}
                </ul>
              ) : null}
              {t.ctaHref ? (
                <a
                  className={`btn ${t.highlighted ? "btn--primary" : "btn--ghost"} plan__cta`}
                  href={t.ctaHref}
                >
                  {t.ctaLabel ?? "Learn more"}
                </a>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
